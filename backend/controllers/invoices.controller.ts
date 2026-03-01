import { Request, Response } from 'express';
import { Pool } from 'pg';
import { InvoiceNumberService } from '../services/InvoiceNumberService';
import { TaxCalculationService } from '../services/TaxCalculationService';
import { ValidationService } from '../services/ValidationService';
import { PDFGenerationService } from '../services/PDFGenerationService';
import { CSVExportService } from '../services/CSVExportService';
import {
  CreateInvoiceRequest,
  ListInvoicesQuery,
  InvoiceDocumentData,
  CompanyInfo
} from '../types/invoice.types';

/**
 * Contrôleur pour les endpoints de facturation
 */
export class InvoicesController {
  private pool: Pool;
  private invoiceNumberService: InvoiceNumberService;
  private taxCalculationService: TaxCalculationService;
  private validationService: ValidationService;
  private pdfGenerationService: PDFGenerationService;
  private csvExportService: CSVExportService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.invoiceNumberService = new InvoiceNumberService(pool);
    this.taxCalculationService = new TaxCalculationService();
    this.validationService = new ValidationService();
    this.pdfGenerationService = new PDFGenerationService();
    this.csvExportService = new CSVExportService();
  }

  /**
   * POST /api/invoices - Crée une nouvelle facture ou reçu
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    const client = await this.pool.connect();

    try {
      const requestData: CreateInvoiceRequest = req.body;
      const tenantId = (req as any).tenantId; // Ajouté par middleware auth
      const userId = (req as any).userId; // Ajouté par middleware auth

      // 1. Validation des données
      const validation = this.validationService.validateInvoice({
        ...requestData,
        dueDate: requestData.dueDate ? new Date(requestData.dueDate) : undefined,
        customerData: requestData.customerData,
        items: requestData.items,
        globalDiscountPercent: requestData.globalDiscountPercent || 0,
        additionalTaxes: requestData.additionalTaxes || []
      });

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: validation.errors
        });
        return;
      }

      await client.query('BEGIN');

      // 2. Gérer le client (créer ou récupérer)
      let customerId = requestData.customerId;
      if (!customerId) {
        // Séparer le nom complet en prénom et nom
        const fullName = requestData.customerData.name || 'Client';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || 'Client';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const customerResult = await client.query(
          `INSERT INTO customers (tenant_id, first_name, last_name, ncc, phone, email, address)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            tenantId,
            firstName,
            lastName,
            requestData.customerData.ncc || null,
            requestData.customerData.phone || null,
            requestData.customerData.email || null,
            requestData.customerData.address || null
          ]
        );
        customerId = customerResult.rows[0].id;
      }

      // 3. Ajouter timbre de quittance si paiement en espèces
      const additionalTaxes = this.taxCalculationService.addTimbreIfCash(
        requestData.paymentMethod,
        requestData.additionalTaxes || []
      );

      // 4. Récupérer les noms de produits et variantes AVANT le calcul
      const itemsWithNames = [];
      for (let i = 0; i < requestData.items.length; i++) {
        const originalItem = requestData.items[i];
        
        // Récupérer les noms de produit et variante
        const productResult = await client.query(
          `SELECT p.name as product_name, pv.sku, pv.selected_options
           FROM products p
           JOIN product_variants pv ON pv.product_id = p.id
           WHERE p.id = $1 AND pv.id = $2`,
          [originalItem.productId, originalItem.variantId]
        );

        const productName = productResult.rows[0]?.product_name || 'Produit inconnu';
        const selectedOptions = productResult.rows[0]?.selected_options || {};
        const variantName = Object.keys(selectedOptions).length > 0 
          ? Object.values(selectedOptions).join(' / ')
          : 'Standard';

        itemsWithNames.push({
          ...originalItem,
          productName,
          variantName
        });
      }

      // 5. Calculer les totaux avec les noms
      const totals = this.taxCalculationService.calculateInvoiceTotals(
        itemsWithNames,
        requestData.globalDiscountPercent || 0,
        additionalTaxes
      );

      // 6. Générer le numéro de facture
      const invoiceNumber = await this.invoiceNumberService.getNextNumber(
        tenantId,
        requestData.documentSubtype
      );

      // 7. Créer la facture dans la base
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          tenant_id, invoice_number, document_type, invoice_type, document_subtype,
          customer_id, date, due_date, payment_method,
          subtotal_ht, total_discounts, total_tva, total_additional_taxes, total_ttc,
          global_discount_percent, commercial_message, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id`,
        [
          tenantId,
          invoiceNumber,
          requestData.documentType,
          requestData.invoiceType,
          requestData.documentSubtype,
          customerId,
          requestData.dueDate || null,
          requestData.paymentMethod,
          totals.subtotalHT,
          totals.totalDiscounts,
          totals.totalTVA,
          totals.totalAdditionalTaxes,
          totals.totalTTC,
          requestData.globalDiscountPercent || 0,
          requestData.commercialMessage || null,
          userId
        ]
      );

      const invoiceId = invoiceResult.rows[0].id;

      // 8. Créer les lignes d'articles (les noms sont déjà dans totals.items)
      for (let i = 0; i < totals.items.length; i++) {
        const item = totals.items[i];
        const originalItem = itemsWithNames[i];

        await client.query(
          `INSERT INTO invoice_items (
            invoice_id, line_number, product_id, variant_id,
            product_name, variant_name, quantity, unit_price_ht,
            discount_percent, total_ht, tva_rate, tva_amount, total_ttc
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            invoiceId,
            i + 1,
            originalItem.productId,
            originalItem.variantId,
            item.productName,
            item.variantName,
            item.quantity,
            item.unitPriceHT,
            item.discountPercent,
            item.totalHT,
            item.tvaRate,
            item.tvaAmount,
            item.totalTTC
          ]
        );
      }

      // 9. Créer les taxes additionnelles
      for (const tax of additionalTaxes) {
        await client.query(
          `INSERT INTO invoice_taxes (invoice_id, tax_name, tax_amount)
           VALUES ($1, $2, $3)`,
          [invoiceId, tax.name, tax.amount]
        );
      }

      // 10. Récupérer les infos entreprise
      const companyResult = await client.query(
        `SELECT name, address, ncc, rccm, phone, email, logo_url
         FROM tenants
         WHERE id = $1`,
        [tenantId]
      );

      const companyInfo: CompanyInfo = {
        name: companyResult.rows[0]?.name || 'Entreprise',
        address: companyResult.rows[0]?.address || '',
        phone: companyResult.rows[0]?.phone || '',
        email: companyResult.rows[0]?.email || '',
        ncc: companyResult.rows[0]?.ncc || '',
        rccm: companyResult.rows[0]?.rccm || '',
        logoUrl: companyResult.rows[0]?.logo_url || undefined
      };

      // 10b. Récupérer le nom, l'email et le téléphone de l'utilisateur créateur
      const userResult = await client.query(
        `SELECT username, first_name, last_name, email, phone
         FROM users
         WHERE id = $1`,
        [userId]
      );

      const createdByName = userResult.rows[0] 
        ? `${userResult.rows[0].first_name || ''} ${userResult.rows[0].last_name || ''}`.trim() || userResult.rows[0].username
        : `User #${userId}`;
      
      const createdByEmail = userResult.rows[0]?.email || '';
      const createdByPhone = userResult.rows[0]?.phone || '';

      // 11. Récupérer les infos client
      const customerResult = await client.query(
        `SELECT first_name, last_name, ncc, phone, email, address
         FROM customers
         WHERE id = $1`,
        [customerId]
      );

      // Construire le nom complet
      const customerName = `${customerResult.rows[0].first_name} ${customerResult.rows[0].last_name}`.trim();

      // 12. Préparer les données pour génération de documents
      const documentData: InvoiceDocumentData = {
        invoice: {
          id: invoiceId,
          tenantId,
          invoiceNumber,
          documentType: requestData.documentType,
          invoiceType: requestData.invoiceType,
          documentSubtype: requestData.documentSubtype,
          customerId,
          date: new Date(),
          dueDate: requestData.dueDate ? new Date(requestData.dueDate) : undefined,
          paymentMethod: requestData.paymentMethod,
          subtotalHT: totals.subtotalHT,
          totalDiscounts: totals.totalDiscounts,
          totalTVA: totals.totalTVA,
          totalAdditionalTaxes: totals.totalAdditionalTaxes,
          totalTTC: totals.totalTTC,
          globalDiscountPercent: requestData.globalDiscountPercent || 0,
          commercialMessage: requestData.commercialMessage,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          createdByName: createdByName,
          createdByEmail: createdByEmail,
          createdByPhone: createdByPhone
        },
        customer: {
          id: customerId,
          name: customerName,
          ncc: customerResult.rows[0].ncc,
          phone: customerResult.rows[0].phone,
          email: customerResult.rows[0].email,
          address: customerResult.rows[0].address
        },
        items: totals.items.map((item, i) => ({
          id: i + 1,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          unitPriceHT: item.unitPriceHT,
          discountPercent: item.discountPercent,
          totalHT: item.totalHT,
          tvaRate: item.tvaRate,
          tvaAmount: item.tvaAmount,
          totalTTC: item.totalTTC
        })),
        tvaSummary: totals.tvaSummary,
        additionalTaxes,
        company: companyInfo
      };

      // 13. Générer PDF
      const pdfBuffer = await this.pdfGenerationService.generateInvoicePDF(documentData);
      const pdfPath = await this.pdfGenerationService.savePDF(tenantId, invoiceNumber, pdfBuffer);

      // 14. Générer CSV
      const csvContent = await this.csvExportService.generateInvoiceCSV(documentData);
      const csvPath = await this.csvExportService.saveCSV(tenantId, invoiceNumber, csvContent);

      // 15. Mettre à jour les chemins des fichiers
      await client.query(
        `UPDATE invoices SET pdf_path = $1, csv_path = $2 WHERE id = $3`,
        [pdfPath, csvPath, invoiceId]
      );

      await client.query('COMMIT');

      // 16. Retourner la réponse
      res.status(201).json({
        success: true,
        invoice: {
          id: invoiceId,
          invoiceNumber,
          pdfUrl: `/api/invoices/${invoiceId}/pdf`,
          csvUrl: `/api/invoices/${invoiceId}/csv`
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur création facture:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la facture',
        details: error.message
      });
    } finally {
      client.release();
    }
  }

  /**
   * GET /api/invoices - Liste les factures avec filtres et pagination
   */
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const query: ListInvoicesQuery = req.query;

      const page = parseInt(query.page as any) || 1;
      const limit = parseInt(query.limit as any) || 20;
      const offset = (page - 1) * limit;

      // Construction de la requête avec filtres
      let whereConditions = ['i.tenant_id = $1'];
      const params: any[] = [tenantId];
      let paramIndex = 2;

      if (query.startDate) {
        whereConditions.push(`i.date >= $${paramIndex}`);
        params.push(query.startDate);
        paramIndex++;
      }

      if (query.endDate) {
        whereConditions.push(`i.date <= $${paramIndex}`);
        params.push(query.endDate);
        paramIndex++;
      }

      if (query.customerName) {
        whereConditions.push(`CONCAT(c.first_name, ' ', c.last_name) ILIKE $${paramIndex}`);
        params.push(`%${query.customerName}%`);
        paramIndex++;
      }

      if (query.invoiceNumber) {
        whereConditions.push(`i.invoice_number ILIKE $${paramIndex}`);
        params.push(`%${query.invoiceNumber}%`);
        paramIndex++;
      }

      if (query.documentType) {
        whereConditions.push(`i.document_type = $${paramIndex}`);
        params.push(query.documentType);
        paramIndex++;
      }

      if (query.invoiceType) {
        whereConditions.push(`i.invoice_type = $${paramIndex}`);
        params.push(query.invoiceType);
        paramIndex++;
      }

      if (query.minAmount) {
        whereConditions.push(`i.total_ttc >= $${paramIndex}`);
        params.push(query.minAmount);
        paramIndex++;
      }

      if (query.maxAmount) {
        whereConditions.push(`i.total_ttc <= $${paramIndex}`);
        params.push(query.maxAmount);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Compter le total
      const countResult = await this.pool.query(
        `SELECT COUNT(*) as total
         FROM invoices i
         JOIN customers c ON c.id = i.customer_id
         WHERE ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);

      // Récupérer les factures
      const invoicesResult = await this.pool.query(
        `SELECT 
          i.id, i.invoice_number, i.document_type, i.invoice_type, i.document_subtype,
          i.date, i.total_ttc, CONCAT(c.first_name, ' ', c.last_name) as customer_name
         FROM invoices i
         JOIN customers c ON c.id = i.customer_id
         WHERE ${whereClause}
         ORDER BY i.date DESC, i.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      res.json({
        success: true,
        invoices: invoicesResult.rows.map(row => ({
          id: row.id,
          invoiceNumber: row.invoice_number,
          documentType: row.document_type,
          invoiceType: row.invoice_type,
          documentSubtype: row.document_subtype,
          customerName: row.customer_name,
          date: row.date,
          totalTTC: parseFloat(row.total_ttc),
          pdfUrl: `/api/invoices/${row.id}/pdf`,
          csvUrl: `/api/invoices/${row.id}/csv`
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erreur liste factures:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des factures'
      });
    }
  }

  /**
   * GET /api/invoices/:id - Récupère les détails d'une facture
   */
  async getInvoiceDetails(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const invoiceId = req.params.id;

      // Récupérer la facture
      const invoiceResult = await this.pool.query(
        `SELECT i.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name, c.ncc, c.phone, c.email, c.address
         FROM invoices i
         JOIN customers c ON c.id = i.customer_id
         WHERE i.id = $1 AND i.tenant_id = $2`,
        [invoiceId, tenantId]
      );

      if (invoiceResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Facture non trouvée'
        });
        return;
      }

      const invoice = invoiceResult.rows[0];

      // Récupérer les articles
      const itemsResult = await this.pool.query(
        `SELECT * FROM invoice_items
         WHERE invoice_id = $1
         ORDER BY line_number`,
        [invoiceId]
      );

      // Récupérer les taxes additionnelles
      const taxesResult = await this.pool.query(
        `SELECT tax_name, tax_amount FROM invoice_taxes
         WHERE invoice_id = $1`,
        [invoiceId]
      );

      // Calculer le résumé TVA
      const tvaSummary = this.taxCalculationService.calculateTVASummary(
        itemsResult.rows,
        1 // Pas de remise globale supplémentaire
      );

      res.json({
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          documentType: invoice.document_type,
          invoiceType: invoice.invoice_type,
          documentSubtype: invoice.document_subtype,
          date: invoice.date,
          dueDate: invoice.due_date,
          customer: {
            id: invoice.customer_id,
            name: invoice.customer_name,
            ncc: invoice.ncc,
            phone: invoice.phone,
            email: invoice.email,
            address: invoice.address
          },
          items: itemsResult.rows.map(item => ({
            id: item.id,
            productName: item.product_name,
            variantName: item.variant_name,
            quantity: parseFloat(item.quantity) || 0,
            unitPriceHT: parseFloat(item.unit_price_ht) || 0,
            discountPercent: parseFloat(item.discount_percent) || 0,
            totalHT: parseFloat(item.total_ht) || 0,
            tvaRate: parseFloat(item.tva_rate) || 0,
            tvaAmount: parseFloat(item.tva_amount) || 0,
            totalTTC: parseFloat(item.total_ttc) || 0
          })),
          subtotalHT: parseFloat(invoice.subtotal_ht) || 0,
          totalDiscounts: parseFloat(invoice.total_discounts) || 0,
          tvaSummary: tvaSummary.map(tva => ({
            rate: tva.rate,
            base: tva.base,
            amount: tva.amount
          })),
          totalTVA: parseFloat(invoice.total_tva) || 0,
          additionalTaxes: taxesResult.rows.map(tax => ({
            name: tax.tax_name,
            amount: parseFloat(tax.tax_amount) || 0
          })),
          totalTTC: parseFloat(invoice.total_ttc) || 0,
          paymentMethod: invoice.payment_method,
          commercialMessage: invoice.commercial_message,
          pdfUrl: `/api/invoices/${invoice.id}/pdf`,
          csvUrl: `/api/invoices/${invoice.id}/csv`
        }
      });

    } catch (error) {
      console.error('Erreur détails facture:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des détails'
      });
    }
  }

  /**
   * GET /api/invoices/:id/pdf - Télécharge le PDF
   */
  async downloadPDF(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const invoiceId = req.params.id;

      const result = await this.pool.query(
        `SELECT pdf_path, invoice_number FROM invoices
         WHERE id = $1 AND tenant_id = $2`,
        [invoiceId, tenantId]
      );

      if (result.rows.length === 0 || !result.rows[0].pdf_path) {
        res.status(404).json({
          success: false,
          error: 'PDF non trouvé'
        });
        return;
      }

      const pdfBuffer = await this.pdfGenerationService.getPDF(result.rows[0].pdf_path);
      const fileName = `${result.rows[0].invoice_number.replace(/\//g, '-')}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du téléchargement du PDF'
      });
    }
  }

  /**
   * GET /api/invoices/:id/csv - Télécharge le CSV
   */
  async downloadCSV(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const invoiceId = req.params.id;

      const result = await this.pool.query(
        `SELECT csv_path, invoice_number FROM invoices
         WHERE id = $1 AND tenant_id = $2`,
        [invoiceId, tenantId]
      );

      if (result.rows.length === 0 || !result.rows[0].csv_path) {
        res.status(404).json({
          success: false,
          error: 'CSV non trouvé'
        });
        return;
      }

      const csvContent = await this.csvExportService.getCSV(result.rows[0].csv_path);
      const fileName = `${result.rows[0].invoice_number.replace(/\//g, '-')}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvContent);

    } catch (error) {
      console.error('Erreur téléchargement CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du téléchargement du CSV'
      });
    }
  }

  /**
   * GET /api/invoices/next-number - Obtient le prochain numéro disponible
   */
  async getNextNumber(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId;
      const documentSubtype = (req.query.documentSubtype as any) || 'standard';

      const nextNumber = await this.invoiceNumberService.getNextNumber(
        tenantId,
        documentSubtype
      );

      res.json({
        success: true,
        nextNumber
      });

    } catch (error) {
      console.error('Erreur prochain numéro:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du prochain numéro'
      });
    }
  }
}
