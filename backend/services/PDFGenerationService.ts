import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { InvoiceDocumentData } from '../types/invoice.types';

/**
 * Service de génération de PDF pour factures et reçus
 * Génère des documents professionnels avec logo et branding entreprise
 * Format A4 avec layout professionnel
 */
export class PDFGenerationService {
  private uploadsDir: string;

  constructor(uploadsDir: string = path.join(__dirname, '../uploads/invoices')) {
    this.uploadsDir = uploadsDir;
    this.ensureDirectoryExists(this.uploadsDir);
  }

  /**
   * Génère un PDF de facture ou reçu
   */
  async generateInvoicePDF(data: InvoiceDocumentData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Générer le contenu du PDF
        this.generateHeader(doc, data);
        this.generateDocumentInfo(doc, data);
        this.generateCustomerInfo(doc, data);
        this.generateItemsTable(doc, data);
        this.generateTotalsSection(doc, data);
        this.generateFooter(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sauvegarde le PDF dans le système de fichiers
   * Structure: uploads/invoices/{tenantId}/{year}/{invoiceNumber}.pdf
   */
  async savePDF(
    tenantId: number,
    invoiceNumber: string,
    pdfBuffer: Buffer
  ): Promise<string> {
    const year = new Date().getFullYear();
    const dirPath = path.join(this.uploadsDir, String(tenantId), String(year));
    
    this.ensureDirectoryExists(dirPath);

    const fileName = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
    const filePath = path.join(dirPath, fileName);

    await fs.promises.writeFile(filePath, pdfBuffer);

    // Retourner le chemin relatif pour stockage en base
    return path.relative(this.uploadsDir, filePath).replace(/\\/g, '/');
  }

  /**
   * Récupère un PDF existant
   */
  async getPDF(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadsDir, relativePath);
    return await fs.promises.readFile(fullPath);
  }

  /**
   * Génère l'en-tête du document avec logo et infos entreprise
   */
  private generateHeader(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    const startY = doc.y;

    // Logo entreprise (si disponible)
    if (data.company.logoUrl) {
      try {
        const logoPath = path.join(__dirname, '../', data.company.logoUrl);
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, startY, { width: 80, height: 80 });
        }
      } catch (error) {
        console.error('Erreur chargement logo:', error);
      }
    }

    // Informations entreprise (droite)
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(data.company.name, 300, startY, { align: 'right' })
       .font('Helvetica')
       .fontSize(9)
       .text(data.company.address, { align: 'right' })
       .text(`Tél: ${data.company.phone}`, { align: 'right' })
       .text(`Email: ${data.company.email}`, { align: 'right' });

    if (data.company.ncc) {
      doc.text(`NCC: ${data.company.ncc}`, { align: 'right' });
    }

    doc.moveDown(2);

    // Type de document en grand
    const documentLabel = this.getDocumentLabel(data.invoice);
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(documentLabel, 50, doc.y, { align: 'center' });

    doc.moveDown(0.5);

    // Numéro de document
    doc.fontSize(12)
       .font('Helvetica')
       .text(`N° ${data.invoice.invoiceNumber}`, { align: 'center' });

    doc.moveDown(2);
  }

  /**
   * Génère la section informations du document
   */
  private generateDocumentInfo(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    const startY = doc.y;

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Date d\'émission:', 50, startY)
       .font('Helvetica')
       .text(this.formatDate(data.invoice.date), 150, startY);

    if (data.invoice.dueDate) {
      doc.font('Helvetica-Bold')
         .text('Date d\'échéance:', 50, doc.y)
         .font('Helvetica')
         .text(this.formatDate(data.invoice.dueDate), 150, doc.y);
    }

    doc.font('Helvetica-Bold')
       .text('Mode de paiement:', 50, doc.y)
       .font('Helvetica')
       .text(data.invoice.paymentMethod, 150, doc.y);

    doc.moveDown(2);
  }

  /**
   * Génère la section informations client
   */
  private generateCustomerInfo(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Client:', 50, doc.y);

    doc.fontSize(9)
       .font('Helvetica')
       .text(data.customer.name, 50, doc.y);

    if (data.customer.ncc) {
      doc.text(`NCC: ${data.customer.ncc}`);
    }

    if (data.customer.phone) {
      doc.text(`Tél: ${data.customer.phone}`);
    }

    if (data.customer.email) {
      doc.text(`Email: ${data.customer.email}`);
    }

    if (data.customer.address) {
      doc.text(`Adresse: ${data.customer.address}`);
    }

    doc.moveDown(2);
  }

  /**
   * Génère le tableau des articles
   */
  private generateItemsTable(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    const tableTop = doc.y;
    const tableHeaders = ['N°', 'Description', 'Qté', 'Prix HT', 'Rem.', 'Total HT', 'TVA', 'Total TTC'];
    const columnWidths = [30, 150, 40, 60, 40, 60, 40, 70];
    const columnPositions = [50, 80, 230, 270, 330, 370, 430, 470];

    // En-têtes de tableau
    doc.fontSize(8)
       .font('Helvetica-Bold');

    tableHeaders.forEach((header, i) => {
      doc.text(header, columnPositions[i], tableTop, {
        width: columnWidths[i],
        align: i === 1 ? 'left' : 'right'
      });
    });

    // Ligne sous les en-têtes
    doc.moveTo(50, tableTop + 15)
       .lineTo(540, tableTop + 15)
       .stroke();

    let currentY = tableTop + 20;

    // Lignes d'articles
    doc.font('Helvetica').fontSize(8);

    data.items.forEach((item, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const lineNumber = (index + 1).toString();
      const description = `${item.productName} - ${item.variantName}`;
      const quantity = item.quantity.toFixed(2);
      const unitPrice = this.formatCurrency(item.unitPriceHT);
      const discount = item.discountPercent > 0 ? `${item.discountPercent}%` : '-';
      const totalHT = this.formatCurrency(item.totalHT);
      const tva = `${item.tvaRate}%`;
      const totalTTC = this.formatCurrency(item.totalTTC);

      doc.text(lineNumber, columnPositions[0], currentY, { width: columnWidths[0], align: 'right' });
      doc.text(description, columnPositions[1], currentY, { width: columnWidths[1], align: 'left' });
      doc.text(quantity, columnPositions[2], currentY, { width: columnWidths[2], align: 'right' });
      doc.text(unitPrice, columnPositions[3], currentY, { width: columnWidths[3], align: 'right' });
      doc.text(discount, columnPositions[4], currentY, { width: columnWidths[4], align: 'right' });
      doc.text(totalHT, columnPositions[5], currentY, { width: columnWidths[5], align: 'right' });
      doc.text(tva, columnPositions[6], currentY, { width: columnWidths[6], align: 'right' });
      doc.text(totalTTC, columnPositions[7], currentY, { width: columnWidths[7], align: 'right' });

      currentY += 20;
    });

    // Ligne de fin de tableau
    doc.moveTo(50, currentY)
       .lineTo(540, currentY)
       .stroke();

    doc.y = currentY + 10;
  }

  /**
   * Génère la section totaux
   */
  private generateTotalsSection(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    const startX = 350;
    let currentY = doc.y;

    doc.fontSize(9).font('Helvetica');

    // Total HT
    doc.text('Total HT:', startX, currentY);
    doc.text(this.formatCurrency(data.invoice.subtotalHT), 480, currentY, { align: 'right' });
    currentY += 15;

    // Remises
    if (data.invoice.totalDiscounts > 0) {
      doc.text('Remises:', startX, currentY);
      doc.text(`-${this.formatCurrency(data.invoice.totalDiscounts)}`, 480, currentY, { align: 'right' });
      currentY += 15;
    }

    // TVA par taux
    data.tvaSummary.forEach(tva => {
      doc.text(`TVA ${tva.rate}% (base: ${this.formatCurrency(tva.base)}):`, startX, currentY);
      doc.text(this.formatCurrency(tva.amount), 480, currentY, { align: 'right' });
      currentY += 15;
    });

    // Total TVA
    doc.font('Helvetica-Bold');
    doc.text('Total TVA:', startX, currentY);
    doc.text(this.formatCurrency(data.invoice.totalTVA), 480, currentY, { align: 'right' });
    currentY += 15;
    doc.font('Helvetica');

    // Taxes additionnelles
    if (data.additionalTaxes && data.additionalTaxes.length > 0) {
      data.additionalTaxes.forEach(tax => {
        doc.text(`${tax.name}:`, startX, currentY);
        doc.text(this.formatCurrency(tax.amount), 480, currentY, { align: 'right' });
        currentY += 15;
      });
    }

    // Total TTC (en gras et plus grand)
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total TTC:', startX, currentY);
    doc.text(this.formatCurrency(data.invoice.totalTTC), 480, currentY, { align: 'right' });

    doc.moveDown(2);
  }

  /**
   * Génère le pied de page
   */
  private generateFooter(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    // Message commercial
    if (data.invoice.commercialMessage) {
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .text(data.invoice.commercialMessage, 50, doc.y, {
           align: 'center',
           width: 495
         });
      doc.moveDown();
    }

    // Mentions légales
    const pageBottom = doc.page.height - 50;
    doc.fontSize(7)
       .font('Helvetica')
       .text(
         'Document généré par Smart POS - Merci de votre confiance',
         50,
         pageBottom,
         { align: 'center', width: 495 }
       );
  }

  /**
   * Retourne le libellé du document selon le type
   */
  private getDocumentLabel(invoice: any): string {
    if (invoice.documentSubtype === 'avoir') {
      return 'AVOIR';
    } else if (invoice.documentSubtype === 'proforma') {
      return 'FACTURE PROFORMA';
    } else if (invoice.documentType === 'receipt') {
      return 'REÇU';
    } else {
      return 'FACTURE';
    }
  }

  /**
   * Formate une date en français
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formate un montant en FCFA
   */
  private formatCurrency(amount: number): string {
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`;
  }

  /**
   * Crée un dossier s'il n'existe pas
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
