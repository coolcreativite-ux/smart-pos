/**
 * Types TypeScript pour le système de facturation FNE
 * Définit toutes les interfaces pour les factures, reçus, et leurs composants
 */

// ============================================================================
// Types de base
// ============================================================================

export type DocumentType = 'invoice' | 'receipt';
export type InvoiceType = 'B2B' | 'B2C' | 'B2F' | 'B2G';
export type DocumentSubtype = 'standard' | 'avoir' | 'proforma';
export type PaymentMethod = 
  | 'Carte bancaire' 
  | 'Chèque' 
  | 'Espèces' 
  | 'Mobile money' 
  | 'Virement' 
  | 'A terme';

// ============================================================================
// Entités de base de données
// ============================================================================

export interface Invoice {
  id: string;
  tenantId: number;
  invoiceNumber: string;
  documentType: DocumentType;
  invoiceType: InvoiceType;
  documentSubtype: DocumentSubtype;
  customerId: number;
  date: Date;
  dueDate?: Date;
  paymentMethod: PaymentMethod;
  subtotalHT: number;
  totalDiscounts: number;
  totalTVA: number;
  totalAdditionalTaxes: number;
  totalTTC: number;
  globalDiscountPercent: number;
  commercialMessage?: string;
  pdfPath?: string;
  csvPath?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  createdByName?: string; // Nom du vendeur pour affichage
  createdByEmail?: string; // Email du vendeur pour affichage
  createdByPhone?: string; // Téléphone du vendeur pour affichage
}

export interface InvoiceItem {
  id: number;
  invoiceId: string;
  lineNumber: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  quantity: number;
  unitPriceHT: number;
  discountPercent: number;
  totalHT: number;
  tvaRate: 0 | 9 | 18;
  tvaAmount: number;
  totalTTC: number;
}

export interface InvoiceTax {
  id: number;
  invoiceId: string;
  taxName: string;
  taxAmount: number;
}

export interface InvoiceSequence {
  id: number;
  tenantId: number;
  year: number;
  documentSubtype: DocumentSubtype;
  lastNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Types pour les requêtes API
// ============================================================================

export interface CreateInvoiceRequest {
  documentType: DocumentType;
  invoiceType: InvoiceType;
  documentSubtype: DocumentSubtype;
  customerId?: number;
  customerData: {
    name: string;
    ncc?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  dueDate?: string; // ISO date string
  paymentMethod: PaymentMethod;
  items: Array<{
    productId: number;
    variantId: number;
    quantity: number;
    unitPriceHT: number;
    discountPercent: number;
    tvaRate: 0 | 9 | 18;
  }>;
  globalDiscountPercent?: number;
  additionalTaxes?: Array<{
    name: string;
    amount: number;
  }>;
  commercialMessage?: string;
}

export interface ListInvoicesQuery {
  page?: number;
  limit?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  customerName?: string;
  invoiceNumber?: string;
  documentType?: DocumentType;
  invoiceType?: InvoiceType;
  minAmount?: number;
  maxAmount?: number;
}

export interface GetNextNumberQuery {
  documentSubtype: DocumentSubtype;
}

// ============================================================================
// Types pour les réponses API
// ============================================================================

export interface CreateInvoiceResponse {
  success: boolean;
  invoice: {
    id: string;
    invoiceNumber: string;
    pdfUrl: string;
    csvUrl: string;
  };
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  documentType: DocumentType;
  invoiceType: InvoiceType;
  documentSubtype: DocumentSubtype;
  customerName: string;
  date: string; // ISO date string
  totalTTC: number;
  pdfUrl: string;
  csvUrl: string;
}

export interface ListInvoicesResponse {
  success: boolean;
  invoices: InvoiceListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerInfo {
  id: number;
  name: string;
  ncc?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface InvoiceItemDetail {
  id: number;
  productName: string;
  variantName: string;
  quantity: number;
  unitPriceHT: number;
  discountPercent: number;
  totalHT: number;
  tvaRate: number;
  tvaAmount: number;
  totalTTC: number;
}

export interface TVASummaryItem {
  rate: number;
  base: number;
  amount: number;
}

export interface AdditionalTaxItem {
  name: string;
  amount: number;
}

export interface InvoiceDetailsResponse {
  success: boolean;
  invoice: {
    id: string;
    invoiceNumber: string;
    documentType: DocumentType;
    invoiceType: InvoiceType;
    documentSubtype: DocumentSubtype;
    date: string; // ISO date string
    dueDate?: string; // ISO date string
    customer: CustomerInfo;
    items: InvoiceItemDetail[];
    subtotalHT: number;
    totalDiscounts: number;
    tvaSummary: TVASummaryItem[];
    totalTVA: number;
    additionalTaxes: AdditionalTaxItem[];
    totalTTC: number;
    paymentMethod: PaymentMethod;
    commercialMessage?: string;
    pdfUrl: string;
    csvUrl: string;
  };
}

export interface GetNextNumberResponse {
  success: boolean;
  nextNumber: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

// ============================================================================
// Types pour les calculs
// ============================================================================

export interface InvoiceCalculationInput {
  items: Array<{
    quantity: number;
    unitPriceHT: number;
    discountPercent: number;
    tvaRate: 0 | 9 | 18;
  }>;
  globalDiscountPercent: number;
  additionalTaxes: Array<{
    name: string;
    amount: number;
  }>;
}

export interface InvoiceCalculationResult {
  subtotalHT: number;
  totalDiscounts: number;
  totalHTAfterDiscount: number;
  tvaSummary: TVASummaryItem[];
  totalTVA: number;
  totalAdditionalTaxes: number;
  totalTTC: number;
}

// ============================================================================
// Types pour la génération de documents
// ============================================================================

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  ncc: string;
  rccm?: string;
  logoUrl?: string;
}

export interface InvoiceDocumentData {
  invoice: Invoice;
  customer: CustomerInfo;
  items: InvoiceItemDetail[];
  tvaSummary: TVASummaryItem[];
  additionalTaxes: AdditionalTaxItem[];
  company: CompanyInfo;
}

// ============================================================================
// Types pour la validation
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
