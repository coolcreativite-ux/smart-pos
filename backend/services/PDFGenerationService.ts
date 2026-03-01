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

    // Bande supérieure indigo
    doc.rect(0, 0, doc.page.width, 4)
       .fillAndStroke('#4F46E5', '#4F46E5');

    doc.y = startY + 10;

    // Section gauche: Logo et infos entreprise
    const leftX = 50;
    let leftY = doc.y;

    if (data.company.logoUrl) {
      try {
        const logoPath = path.join(__dirname, '../', data.company.logoUrl);
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, leftX, leftY, { width: 60, height: 60 });
          leftY += 65;
        }
      } catch (error) {
        console.error('Erreur chargement logo:', error);
      }
    }

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(data.company.name, leftX, leftY);

    leftY = doc.y + 5;

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#64748B');

    if (data.company.ncc) {
      doc.text(`NCC: ${data.company.ncc}`, leftX, leftY);
      leftY = doc.y;
    }

    if (data.company.rccm) {
      doc.text(`RCCM: ${data.company.rccm}`, leftX, leftY);
      leftY = doc.y;
    }

    if (data.company.address) {
      doc.text(data.company.address, leftX, leftY);
      leftY = doc.y;
    }

    if (data.company.phone) {
      doc.text(`Tél: ${data.company.phone}`, leftX, leftY);
      leftY = doc.y;
    }

    if (data.company.email) {
      doc.text(`Email: ${data.company.email}`, leftX, leftY);
    }

    // Section droite: Type de document dans un encadré indigo
    const documentLabel = this.getDocumentLabel(data.invoice);
    const invoiceTypeLabel = this.getInvoiceTypeLabel(data.invoice);
    
    const boxWidth = 140;
    const boxHeight = 35;
    const boxX = doc.page.width - boxWidth - 50;
    const boxY = startY + 10;

    // Rectangle indigo arrondi
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5)
       .fillAndStroke('#4F46E5', '#4F46E5');

    // Texte blanc centré
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF')
       .text(documentLabel, boxX, boxY + 10, {
         width: boxWidth,
         align: 'center'
       });

    // Type de facturation en dessous
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#64748B')
       .text(invoiceTypeLabel, boxX, boxY + boxHeight + 5, {
         width: boxWidth,
         align: 'center'
       });

    doc.y = Math.max(leftY, boxY + boxHeight + 20) + 15;

    // Ligne de séparation
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .strokeColor('#E2E8F0')
       .lineWidth(2)
       .stroke();

    doc.y += 15;
  }

  /**
   * Génère la section informations du document et client (côte à côte)
   * INFORMATIONS DOCUMENT à gauche, INFORMATIONS CLIENT à droite
   */
  private generateDocumentInfo(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    const startY = doc.y;
    const leftX = 50;
    const rightX = 300;
    const boxWidth = 245;

    // ========== SECTION GAUCHE: INFORMATIONS DOCUMENT ==========
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#64748B')
       .text('INFORMATIONS DOCUMENT', leftX, startY);

    // Encadré gris clair pour les infos document
    const docBoxY = startY + 15;
    const docBoxHeight = 143; // Augmenté pour inclure le téléphone du vendeur
    doc.roundedRect(leftX, docBoxY, boxWidth, docBoxHeight, 5)
       .fillAndStroke('#F8FAFC', '#E2E8F0');

    let docY = docBoxY + 10;

    // Numéro
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#64748B')
       .text('Numéro:', leftX + 10, docY);
    doc.font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(data.invoice.invoiceNumber, leftX + 70, docY, { width: boxWidth - 80 });

    docY += 13;

    // Type
    doc.font('Helvetica')
       .fillColor('#64748B')
       .text('Type:', leftX + 10, docY);
    doc.font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(`${this.getDocumentLabel(data.invoice)} - ${data.invoice.invoiceType}`, leftX + 70, docY, { width: boxWidth - 80 });

    docY += 13;

    // Date
    doc.font('Helvetica')
       .fillColor('#64748B')
       .text('Date:', leftX + 10, docY);
    doc.font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(this.formatDate(data.invoice.date), leftX + 70, docY, { width: boxWidth - 80 });

    docY += 13;

    // Date d'échéance / Validité
    if (data.invoice.dueDate) {
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text('Échéance:', leftX + 10, docY);
      doc.font('Helvetica-Bold')
         .fillColor('#1E293B')
         .text(this.formatDate(data.invoice.dueDate), leftX + 70, docY, { width: boxWidth - 80 });
      docY += 13;
    } else {
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text('Validité:', leftX + 10, docY);
      doc.font('Helvetica-Bold')
         .fillColor('#1E293B')
         .text('Immédiate', leftX + 70, docY, { width: boxWidth - 80 });
      docY += 13;
    }

    // Mode de paiement
    doc.font('Helvetica')
       .fillColor('#64748B')
       .text('Paiement:', leftX + 10, docY);
    doc.font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(data.invoice.paymentMethod, leftX + 70, docY, { width: boxWidth - 80 });

    docY += 13;

    // Vendeur
    if (data.invoice.createdByName) {
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text('Vendeur:', leftX + 10, docY);
      doc.font('Helvetica-Bold')
         .fillColor('#1E293B')
         .text(data.invoice.createdByName, leftX + 70, docY, { width: boxWidth - 80 });
      docY += 13;
    }

    // Email du vendeur
    if (data.invoice.createdByEmail) {
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text('Email:', leftX + 10, docY);
      doc.font('Helvetica-Bold')
         .fillColor('#1E293B')
         .text(data.invoice.createdByEmail, leftX + 70, docY, { width: boxWidth - 80 });
      docY += 13;
    }

    // Téléphone du vendeur
    if (data.invoice.createdByPhone) {
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text('Tél:', leftX + 10, docY);
      doc.font('Helvetica-Bold')
         .fillColor('#1E293B')
         .text(data.invoice.createdByPhone, leftX + 70, docY, { width: boxWidth - 80 });
    }

    // ========== SECTION DROITE: INFORMATIONS CLIENT ==========
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#64748B')
       .text('INFORMATIONS CLIENT', rightX, startY);

    // Encadré gris clair pour le client
    const clientBoxY = startY + 15;
    const clientBoxHeight = 90;
    doc.roundedRect(rightX, clientBoxY, boxWidth, clientBoxHeight, 5)
       .fillAndStroke('#F8FAFC', '#E2E8F0');

    let clientY = clientBoxY + 10;

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(data.customer.name, rightX + 10, clientY, { width: boxWidth - 20 });

    clientY = doc.y + 5;

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#64748B');

    if (data.customer.ncc) {
      doc.text(`NCC: ${data.customer.ncc}`, rightX + 10, clientY, { width: boxWidth - 20 });
      clientY = doc.y;
    }

    if (data.customer.address) {
      doc.text(data.customer.address, rightX + 10, clientY, { width: boxWidth - 20 });
      clientY = doc.y;
    }

    if (data.customer.phone) {
      doc.text(`Tél: ${data.customer.phone}`, rightX + 10, clientY, { width: boxWidth - 20 });
      clientY = doc.y;
    }

    if (data.customer.email) {
      doc.text(`Email: ${data.customer.email}`, rightX + 10, clientY, { width: boxWidth - 20 });
    }

    doc.y = Math.max(docBoxY + docBoxHeight, clientBoxY + clientBoxHeight) + 15;
  }

  /**
   * Génère le tableau des articles avec style moderne
   */
  private generateItemsTable(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    // Titre de section
    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#64748B')
       .text('DÉTAIL DES ARTICLES', 50, doc.y);

    doc.y += 15;

    const tableTop = doc.y;
    const tableHeaders = ['Désignation', 'Qté', 'P.U. HT', 'Remise', 'Total HT', 'TVA', 'Total TTC'];
    const columnWidths = [180, 40, 60, 45, 60, 40, 70];
    const columnPositions = [50, 230, 270, 330, 375, 435, 475];

    // En-tête avec fond gris
    doc.rect(50, tableTop, doc.page.width - 100, 20)
       .fillAndStroke('#F1F5F9', '#E2E8F0');

    doc.fontSize(7)
       .font('Helvetica-Bold')
       .fillColor('#475569');

    // En-têtes de colonnes
    doc.text('Désignation', columnPositions[0], tableTop + 6);
    doc.text('Qté', columnPositions[1] + 10, tableTop + 6);
    doc.text('P.U. HT', columnPositions[2] + 20, tableTop + 6);
    doc.text('Remise', columnPositions[3] + 10, tableTop + 6);
    doc.text('Total HT', columnPositions[4] + 15, tableTop + 6);
    doc.text('TVA', columnPositions[5] + 10, tableTop + 6);
    doc.text('Total TTC', columnPositions[6] + 20, tableTop + 6);

    let currentY = tableTop + 25;

    // Lignes d'articles
    data.items.forEach((item, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const rowHeight = 25;

      // Fond alterné
      if (index % 2 === 0) {
        doc.rect(50, currentY - 3, doc.page.width - 100, rowHeight)
           .fillAndStroke('#FAFAFA', '#FAFAFA');
      }

      // Colonne 1: Désignation
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#1E293B');
      doc.text(item.productName, columnPositions[0], currentY);
      
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#64748B');
      doc.text(item.variantName, columnPositions[0], currentY + 10);
      
      // Autres colonnes
      const textY = currentY + 3;
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#1E293B');
      
      // Quantité (centré)
      const qtyText = item.quantity.toFixed(2);
      const qtyWidth = doc.widthOfString(qtyText);
      doc.text(qtyText, columnPositions[1] + (columnWidths[1] - qtyWidth) / 2, textY);
      
      // Prix unitaire HT (aligné à droite)
      const puText = this.formatCurrency(item.unitPriceHT);
      const puWidth = doc.widthOfString(puText);
      doc.text(puText, columnPositions[2] + columnWidths[2] - puWidth, textY);
      
      // Remise (centré)
      const remiseText = item.discountPercent > 0 ? `${item.discountPercent}%` : '-';
      const remiseWidth = doc.widthOfString(remiseText);
      doc.text(remiseText, columnPositions[3] + (columnWidths[3] - remiseWidth) / 2, textY);
      
      // Total HT (aligné à droite, en gras)
      doc.font('Helvetica-Bold');
      const totalHTText = this.formatCurrency(item.totalHT);
      const totalHTWidth = doc.widthOfString(totalHTText);
      doc.text(totalHTText, columnPositions[4] + columnWidths[4] - totalHTWidth, textY);
      
      // TVA (centré)
      doc.font('Helvetica');
      const tvaText = `${item.tvaRate}%`;
      const tvaWidth = doc.widthOfString(tvaText);
      doc.text(tvaText, columnPositions[5] + (columnWidths[5] - tvaWidth) / 2, textY);
      
      // Total TTC (aligné à droite, en gras)
      doc.font('Helvetica-Bold');
      const totalTTCText = this.formatCurrency(item.totalTTC);
      const totalTTCWidth = doc.widthOfString(totalTTCText);
      doc.text(totalTTCText, columnPositions[6] + columnWidths[6] - totalTTCWidth, textY);

      currentY += rowHeight;
    });

    // Ligne de fin
    doc.moveTo(50, currentY)
       .lineTo(doc.page.width - 50, currentY)
       .strokeColor('#E2E8F0')
       .lineWidth(1)
       .stroke();

    doc.y = currentY + 15;
  }

  /**
   * Génère la section totaux avec style moderne
   */
  private generateTotalsSection(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    const startX = 330;
    const boxWidth = 215;
    let currentY = doc.y;

    doc.fontSize(8).font('Helvetica').fillColor('#64748B');

    // Sous-total HT
    doc.text('Sous-total HT:', startX, currentY);
    doc.font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(this.formatCurrency(data.invoice.subtotalHT), startX + 120, currentY, { align: 'right', width: 95 });
    currentY += 15;

    // Ligne de séparation
    doc.moveTo(startX, currentY)
       .lineTo(startX + boxWidth, currentY)
       .strokeColor('#E2E8F0')
       .lineWidth(0.5)
       .stroke();
    currentY += 10;

    // Remise globale
    if (data.invoice.globalDiscountPercent > 0) {
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text(`Remise globale (${data.invoice.globalDiscountPercent}%):`, startX, currentY);
      doc.font('Helvetica-Bold')
         .fillColor('#DC2626')
         .text(`- ${this.formatCurrency(data.invoice.totalDiscounts)}`, startX + 120, currentY, { align: 'right', width: 95 });
      currentY += 15;

      // Total HT après remise
      const totalHTAfterDiscount = data.invoice.subtotalHT - data.invoice.totalDiscounts;
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text('Total HT après remise:', startX, currentY);
      doc.font('Helvetica-Bold')
         .fillColor('#1E293B')
         .text(this.formatCurrency(totalHTAfterDiscount), startX + 120, currentY, { align: 'right', width: 95 });
      currentY += 15;

      // Ligne de séparation
      doc.moveTo(startX, currentY)
         .lineTo(startX + boxWidth, currentY)
         .strokeColor('#E2E8F0')
         .lineWidth(0.5)
         .stroke();
      currentY += 10;
    }

    // Détail TVA par taux
    data.tvaSummary.forEach(tva => {
      doc.font('Helvetica')
         .fillColor('#64748B')
         .text(`TVA ${tva.rate}% (base: ${this.formatCurrency(tva.base)}):`, startX, currentY, { width: 120 });
      doc.font('Helvetica-Bold')
         .fillColor('#1E293B')
         .text(this.formatCurrency(tva.amount), startX + 120, currentY, { align: 'right', width: 95 });
      currentY += 15;
    });

    // Total TVA
    doc.font('Helvetica-Bold')
       .fillColor('#475569')
       .text('Total TVA:', startX, currentY);
    doc.font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text(this.formatCurrency(data.invoice.totalTVA), startX + 120, currentY, { align: 'right', width: 95 });
    currentY += 15;

    // Ligne de séparation
    doc.moveTo(startX, currentY)
       .lineTo(startX + boxWidth, currentY)
       .strokeColor('#E2E8F0')
       .lineWidth(0.5)
       .stroke();
    currentY += 10;

    // Taxes additionnelles
    if (data.additionalTaxes && data.additionalTaxes.length > 0) {
      data.additionalTaxes.forEach(tax => {
        doc.font('Helvetica')
           .fillColor('#64748B')
           .text(`${tax.name}:`, startX, currentY);
        doc.font('Helvetica-Bold')
           .fillColor('#1E293B')
           .text(this.formatCurrency(tax.amount), startX + 120, currentY, { align: 'right', width: 95 });
        currentY += 15;
      });

      // Ligne de séparation
      doc.moveTo(startX, currentY)
         .lineTo(startX + boxWidth, currentY)
         .strokeColor('#E2E8F0')
         .lineWidth(0.5)
         .stroke();
      currentY += 10;
    }

    // Total TTC dans un encadré indigo
    const ttcBoxY = currentY;
    doc.roundedRect(startX, ttcBoxY, boxWidth, 35, 5)
       .fillAndStroke('#EEF2FF', '#C7D2FE');

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#1E293B')
       .text('TOTAL TTC:', startX + 10, ttcBoxY + 10);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#4F46E5')
       .text(this.formatCurrency(data.invoice.totalTTC), startX + 10, ttcBoxY + 10, {
         align: 'right',
         width: boxWidth - 20
       });

    doc.y = ttcBoxY + 50;
  }

  /**
   * Génère le pied de page avec style moderne
   */
  private generateFooter(doc: PDFKit.PDFDocument, data: InvoiceDocumentData): void {
    // Message commercial dans un encadré (si présent)
    if (data.invoice.commercialMessage) {
      doc.moveDown(1);
      
      const messageBoxY = doc.y;
      doc.roundedRect(50, messageBoxY, doc.page.width - 100, 40, 5)
         .fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor('#64748B')
         .text(data.invoice.commercialMessage, 60, messageBoxY + 12, {
           width: doc.page.width - 120,
           align: 'left'
         });

      doc.y = messageBoxY + 50;
    }

    // Espace avant le footer
    doc.moveDown(2);

    // Footer simple sans fond (pour éviter les pages supplémentaires)
    const footerY = doc.y;
    
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#94A3B8')
       .text(
         `Document généré le ${this.formatDate(new Date())} par ${data.company.name}`,
         50,
         footerY,
         { align: 'center', width: doc.page.width - 100 }
       );

    doc.fontSize(6)
       .fillColor('#CBD5E1')
       .text(
         'Merci de votre confiance',
         50,
         footerY + 10,
         { align: 'center', width: doc.page.width - 100 }
       );
  }

  /**
   * Retourne le label du type de facturation
   */
  private getInvoiceTypeLabel(invoice: any): string {
    const labels: Record<string, string> = {
      'B2B': 'Business to Business',
      'B2C': 'Business to Consumer',
      'B2F': 'Business to Freelance',
      'B2G': 'Business to Government'
    };
    return labels[invoice.invoiceType] || invoice.invoiceType;
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
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, ' ')} FCFA`;
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
