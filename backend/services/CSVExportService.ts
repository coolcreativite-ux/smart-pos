import fs from 'fs';
import path from 'path';
import { InvoiceDocumentData } from '../types/invoice.types';

/**
 * Service d'export CSV pour factures et reçus
 * Génère des fichiers CSV structurés pour comptabilité et saisie FNE
 */
export class CSVExportService {
  private uploadsDir: string;

  constructor(uploadsDir: string = path.join(__dirname, '../uploads/invoices')) {
    this.uploadsDir = uploadsDir;
    this.ensureDirectoryExists(this.uploadsDir);
  }

  /**
   * Génère un export CSV d'une facture ou reçu
   * Format structuré en 3 sections: header, items, totals
   */
  async generateInvoiceCSV(data: InvoiceDocumentData): Promise<string> {
    const lines: string[] = [];

    // Section 1: En-tête du document
    lines.push('# INFORMATIONS DOCUMENT');
    lines.push(this.createCSVLine([
      'Type',
      'Numéro',
      'Date',
      'Date échéance',
      'Mode paiement'
    ]));
    lines.push(this.createCSVLine([
      this.getDocumentLabel(data.invoice),
      data.invoice.invoiceNumber,
      this.formatDate(data.invoice.date),
      data.invoice.dueDate ? this.formatDate(data.invoice.dueDate) : '',
      data.invoice.paymentMethod
    ]));
    lines.push('');

    // Section 2: Informations client
    lines.push('# INFORMATIONS CLIENT');
    lines.push(this.createCSVLine([
      'Nom',
      'NCC',
      'Téléphone',
      'Email',
      'Adresse'
    ]));
    lines.push(this.createCSVLine([
      data.customer.name,
      data.customer.ncc || '',
      data.customer.phone || '',
      data.customer.email || '',
      data.customer.address || ''
    ]));
    lines.push('');

    // Section 3: Articles
    lines.push('# ARTICLES');
    lines.push(this.createCSVLine([
      'N°',
      'Description',
      'Quantité',
      'Prix Unit. HT',
      'Remise %',
      'Total HT',
      'TVA %',
      'Montant TVA',
      'Total TTC'
    ]));

    data.items.forEach((item, index) => {
      lines.push(this.createCSVLine([
        (index + 1).toString(),
        `${item.productName} - ${item.variantName}`,
        item.quantity.toString(),
        item.unitPriceHT.toString(),
        item.discountPercent.toString(),
        item.totalHT.toString(),
        item.tvaRate.toString(),
        item.tvaAmount.toString(),
        item.totalTTC.toString()
      ]));
    });
    lines.push('');

    // Section 4: Totaux
    lines.push('# TOTAUX');
    lines.push(this.createCSVLine(['Libellé', 'Montant']));
    
    lines.push(this.createCSVLine([
      'Total HT',
      data.invoice.subtotalHT.toString()
    ]));

    if (data.invoice.totalDiscounts > 0) {
      lines.push(this.createCSVLine([
        'Total Remises',
        data.invoice.totalDiscounts.toString()
      ]));
    }

    // TVA par taux
    data.tvaSummary.forEach(tva => {
      lines.push(this.createCSVLine([
        `TVA ${tva.rate}% (base: ${tva.base})`,
        tva.amount.toString()
      ]));
    });

    lines.push(this.createCSVLine([
      'Total TVA',
      data.invoice.totalTVA.toString()
    ]));

    // Taxes additionnelles
    if (data.additionalTaxes && data.additionalTaxes.length > 0) {
      data.additionalTaxes.forEach(tax => {
        lines.push(this.createCSVLine([
          tax.name,
          tax.amount.toString()
        ]));
      });
    }

    lines.push(this.createCSVLine([
      'Total TTC',
      data.invoice.totalTTC.toString()
    ]));
    lines.push('');

    // Section 5: Message commercial (si présent)
    if (data.invoice.commercialMessage) {
      lines.push('# MESSAGE COMMERCIAL');
      lines.push(this.escapeCSVValue(data.invoice.commercialMessage));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Sauvegarde le CSV dans le système de fichiers
   * Structure: uploads/invoices/{tenantId}/{year}/{invoiceNumber}.csv
   */
  async saveCSV(
    tenantId: number,
    invoiceNumber: string,
    csvContent: string
  ): Promise<string> {
    const year = new Date().getFullYear();
    const dirPath = path.join(this.uploadsDir, String(tenantId), String(year));
    
    this.ensureDirectoryExists(dirPath);

    const fileName = `${invoiceNumber.replace(/\//g, '-')}.csv`;
    const filePath = path.join(dirPath, fileName);

    await fs.promises.writeFile(filePath, csvContent, 'utf-8');

    // Retourner le chemin relatif pour stockage en base
    return path.relative(this.uploadsDir, filePath).replace(/\\/g, '/');
  }

  /**
   * Récupère un CSV existant
   */
  async getCSV(relativePath: string): Promise<string> {
    const fullPath = path.join(this.uploadsDir, relativePath);
    return await fs.promises.readFile(fullPath, 'utf-8');
  }

  /**
   * Crée une ligne CSV à partir d'un tableau de valeurs
   */
  private createCSVLine(values: string[]): string {
    return values.map(v => this.escapeCSVValue(v)).join(',');
  }

  /**
   * Échappe une valeur pour CSV (gère guillemets, virgules, retours à la ligne)
   */
  private escapeCSVValue(value: string): string {
    if (!value) return '';
    
    // Convertir en string si ce n'est pas déjà le cas
    const strValue = String(value);
    
    // Si la valeur contient des guillemets, virgules ou retours à la ligne, l'entourer de guillemets
    if (strValue.includes('"') || strValue.includes(',') || strValue.includes('\n')) {
      // Doubler les guillemets internes
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    
    return strValue;
  }

  /**
   * Retourne le libellé du document selon le type
   */
  private getDocumentLabel(invoice: any): string {
    if (invoice.documentSubtype === 'avoir') {
      return 'Avoir';
    } else if (invoice.documentSubtype === 'proforma') {
      return 'Facture Proforma';
    } else if (invoice.documentType === 'receipt') {
      return 'Reçu';
    } else {
      return 'Facture';
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
   * Crée un dossier s'il n'existe pas
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
