/**
 * Service de validation des données de factures et reçus
 * Valide selon le type de facturation (B2B, B2C, B2F, B2G)
 * Valide les formats (NCC, email, téléphone)
 * Valide les montants et quantités
 */

export interface InvoiceFormData {
  documentType: 'invoice' | 'receipt';
  invoiceType: 'B2B' | 'B2C' | 'B2F' | 'B2G';
  documentSubtype: 'standard' | 'avoir' | 'proforma';
  customerId?: number;
  customerData: {
    name: string;
    ncc?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  dueDate?: Date;
  paymentMethod: string;
  items: Array<{
    productId: number;
    variantId: number;
    quantity: number;
    unitPriceHT: number;
    discountPercent: number;
    tvaRate: number;
  }>;
  globalDiscountPercent: number;
  additionalTaxes?: Array<{
    name: string;
    amount: number;
  }>;
  commercialMessage?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class ValidationService {
  /**
   * Valide les données complètes d'une facture avant génération
   */
  validateInvoice(data: InvoiceFormData): ValidationResult {
    const errors: ValidationError[] = [];

    // Validation type de document
    if (!['invoice', 'receipt'].includes(data.documentType)) {
      errors.push({
        field: 'documentType',
        message: 'Type de document invalide. Doit être "invoice" ou "receipt"'
      });
    }

    // Validation type de facturation
    if (!['B2B', 'B2C', 'B2F', 'B2G'].includes(data.invoiceType)) {
      errors.push({
        field: 'invoiceType',
        message: 'Type de facturation invalide. Doit être B2B, B2C, B2F ou B2G'
      });
    }

    // Validation sous-type de document
    if (!['standard', 'avoir', 'proforma'].includes(data.documentSubtype)) {
      errors.push({
        field: 'documentSubtype',
        message: 'Sous-type de document invalide. Doit être standard, avoir ou proforma'
      });
    }

    // Validation client selon type de facturation
    if (data.invoiceType === 'B2B') {
      // B2B: NCC requis
      if (!data.customerData.ncc) {
        errors.push({
          field: 'customerData.ncc',
          message: 'NCC requis pour facturation B2B'
        });
      } else if (!this.validateNCC(data.customerData.ncc)) {
        errors.push({
          field: 'customerData.ncc',
          message: 'Format NCC invalide. Format attendu: CI-XXX-YYYY-X-NNNNN'
        });
      }
    } else {
      // B2C, B2F, B2G: nom, téléphone, email requis
      if (!data.customerData.name || data.customerData.name.trim() === '') {
        errors.push({
          field: 'customerData.name',
          message: 'Nom du client requis'
        });
      }

      if (!data.customerData.phone || data.customerData.phone.trim() === '') {
        errors.push({
          field: 'customerData.phone',
          message: 'Téléphone du client requis'
        });
      } else if (!this.validatePhone(data.customerData.phone)) {
        errors.push({
          field: 'customerData.phone',
          message: 'Format de téléphone invalide'
        });
      }

      if (!data.customerData.email || data.customerData.email.trim() === '') {
        errors.push({
          field: 'customerData.email',
          message: 'Email du client requis'
        });
      } else if (!this.validateEmail(data.customerData.email)) {
        errors.push({
          field: 'customerData.email',
          message: 'Format d\'email invalide'
        });
      }
    }

    // Validation articles
    if (!data.items || data.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'Au moins un article requis'
      });
    } else {
      data.items.forEach((item, index) => {
        // Validation quantité
        if (!item.quantity || item.quantity <= 0) {
          errors.push({
            field: `items[${index}].quantity`,
            message: 'La quantité doit être positive'
          });
        }

        // Validation prix unitaire
        if (item.unitPriceHT === undefined || item.unitPriceHT < 0) {
          errors.push({
            field: `items[${index}].unitPriceHT`,
            message: 'Le prix unitaire doit être positif ou zéro'
          });
        }

        // Validation taux de TVA
        if (![0, 9, 18].includes(item.tvaRate)) {
          errors.push({
            field: `items[${index}].tvaRate`,
            message: 'Le taux de TVA doit être 0%, 9% ou 18%'
          });
        }

        // Validation remise
        if (item.discountPercent < 0 || item.discountPercent > 100) {
          errors.push({
            field: `items[${index}].discountPercent`,
            message: 'La remise doit être entre 0% et 100%'
          });
        }

        // Validation IDs
        if (!item.productId || item.productId <= 0) {
          errors.push({
            field: `items[${index}].productId`,
            message: 'ID produit invalide'
          });
        }

        if (!item.variantId || item.variantId <= 0) {
          errors.push({
            field: `items[${index}].variantId`,
            message: 'ID variante invalide'
          });
        }
      });
    }

    // Validation remise globale
    if (data.globalDiscountPercent < 0 || data.globalDiscountPercent > 100) {
      errors.push({
        field: 'globalDiscountPercent',
        message: 'La remise globale doit être entre 0% et 100%'
      });
    }

    // Validation mode de paiement
    const validPaymentMethods = [
      'Carte bancaire',
      'Chèque',
      'Espèces',
      'Mobile money',
      'Virement',
      'A terme'
    ];
    if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod)) {
      errors.push({
        field: 'paymentMethod',
        message: `Mode de paiement invalide. Doit être: ${validPaymentMethods.join(', ')}`
      });
    }

    // Validation date d'échéance (si présente)
    if (data.dueDate) {
      const dueDate = new Date(data.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        errors.push({
          field: 'dueDate',
          message: 'La date d\'échéance ne peut pas être dans le passé'
        });
      }
    }

    // Validation taxes additionnelles
    if (data.additionalTaxes) {
      data.additionalTaxes.forEach((tax, index) => {
        if (!tax.name || tax.name.trim() === '') {
          errors.push({
            field: `additionalTaxes[${index}].name`,
            message: 'Le nom de la taxe est requis'
          });
        }

        if (tax.amount === undefined || tax.amount < 0) {
          errors.push({
            field: `additionalTaxes[${index}].amount`,
            message: 'Le montant de la taxe doit être positif ou zéro'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide un NCC ivoirien
   * Format: CI-XXX-YYYY-X-NNNNN
   * Exemple: CI-ABJ-2024-A-12345
   */
  validateNCC(ncc: string): boolean {
    if (!ncc) return false;
    
    const nccRegex = /^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{5}$/;
    return nccRegex.test(ncc.trim());
  }

  /**
   * Valide un email
   */
  validateEmail(email: string): boolean {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Valide un numéro de téléphone ivoirien
   * Formats acceptés:
   * - +225 XX XX XX XX XX
   * - +225XXXXXXXXXX
   * - 0X XX XX XX XX
   * - 0XXXXXXXXX
   */
  validatePhone(phone: string): boolean {
    if (!phone) return false;
    
    // Nettoyer le numéro (enlever espaces)
    const cleanPhone = phone.replace(/\s/g, '');
    
    // Format international: +225 suivi de 10 chiffres
    const internationalRegex = /^\+225\d{10}$/;
    
    // Format local: 0 suivi de 9 chiffres
    const localRegex = /^0\d{9}$/;
    
    return internationalRegex.test(cleanPhone) || localRegex.test(cleanPhone);
  }

  /**
   * Valide qu'un montant est positif
   */
  validatePositiveAmount(amount: number): boolean {
    return amount !== undefined && amount >= 0;
  }

  /**
   * Valide qu'un pourcentage est entre 0 et 100
   */
  validatePercentage(percent: number): boolean {
    return percent !== undefined && percent >= 0 && percent <= 100;
  }
}
