/**
 * Types TypeScript pour le système de facturation FNE - Frontend
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
// Types pour les formulaires
// ============================================================================

export interface InvoiceFormData {
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
  dueDate?: Date;
  paymentMethod: PaymentMethod;
  items: InvoiceItemInput[];
  globalDiscountPercent: number;
  additionalTaxes: AdditionalTax[];
  commercialMessage?: string;
}

export interface InvoiceItemInput {
  tempId?: string; // ID temporaire pour React keys
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  quantity: number;
  unitPriceHT: number;
  discountPercent: number;
  tvaRate: 0 | 9 | 18;
}

export interface AdditionalTax {
  tempId?: string; // ID temporaire pour React keys
  name: string;
  amount: number;
}

// ============================================================================
// Types pour les calculs en temps réel
// ============================================================================

export interface InvoiceItemWithTotals extends InvoiceItemInput {
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
}

export interface TVASummary {
  rate: number;
  base: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotalHT: number;
  totalDiscounts: number;
  totalHTAfterDiscount: number;
  tvaSummary: TVASummary[];
  totalTVA: number;
  totalAdditionalTaxes: number;
  totalTTC: number;
  items: InvoiceItemWithTotals[];
}

// ============================================================================
// Types pour les réponses API
// ============================================================================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  documentType: DocumentType;
  invoiceType: InvoiceType;
  documentSubtype: DocumentSubtype;
  customerName: string;
  date: string;
  totalTTC: number;
  pdfUrl: string;
  csvUrl: string;
}

export interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  documentType: DocumentType;
  invoiceType: InvoiceType;
  documentSubtype: DocumentSubtype;
  date: string;
  dueDate?: string;
  customer: {
    id: number;
    name: string;
    ncc?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: Array<{
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
  }>;
  subtotalHT: number;
  totalDiscounts: number;
  tvaSummary: TVASummary[];
  totalTVA: number;
  additionalTaxes: AdditionalTax[];
  totalTTC: number;
  paymentMethod: PaymentMethod;
  commercialMessage?: string;
  pdfUrl: string;
  csvUrl: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoice: {
    id: string;
    invoiceNumber: string;
    pdfUrl: string;
    csvUrl: string;
  };
}

export interface ListInvoicesResponse {
  success: boolean;
  invoices: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// Types pour les filtres de recherche
// ============================================================================

export interface InvoiceFilters {
  startDate?: Date;
  endDate?: Date;
  customerName?: string;
  invoiceNumber?: string;
  documentType?: DocumentType;
  invoiceType?: InvoiceType;
  minAmount?: number;
  maxAmount?: number;
}

// ============================================================================
// Types pour la validation
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

// ============================================================================
// Types pour les options de sélection
// ============================================================================

export interface InvoiceTypeOption {
  value: InvoiceType;
  label: string;
  description: string;
  icon: string;
}

export const INVOICE_TYPE_OPTIONS: InvoiceTypeOption[] = [
  {
    value: 'B2B',
    label: 'B2B - Entreprise',
    description: 'Facturation entreprise locale (NCC requis)',
    icon: '🏢'
  },
  {
    value: 'B2C',
    label: 'B2C - Particulier',
    description: 'Facturation particulier',
    icon: '👤'
  },
  {
    value: 'B2F',
    label: 'B2F - International',
    description: 'Facturation internationale',
    icon: '🌍'
  },
  {
    value: 'B2G',
    label: 'B2G - Administration',
    description: 'Facturation administration publique',
    icon: '🏛️'
  }
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Carte bancaire',
  'Chèque',
  'Espèces',
  'Mobile money',
  'Virement',
  'A terme'
];

export const TVA_RATES: Array<0 | 9 | 18> = [0, 9, 18];

// ============================================================================
// Types pour l'état du contexte
// ============================================================================

export interface InvoiceContextState {
  invoices: Invoice[];
  currentInvoice: InvoiceDetails | null;
  filters: InvoiceFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}
