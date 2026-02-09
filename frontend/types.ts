
export interface Customer {
  id: number;
  tenantId: number; // Isolation
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  salesHistoryIds: string[];
  loyaltyPoints: number;
  storeCredit: number;
  storeId?: number;
}

export enum StockChangeReason {
  Sale = 'sale',
  Restock = 'restock',
  Initial = 'initial',
  Correction = 'correction',
  Return = 'return',
  TransferOut = 'transfer_out',
  TransferIn = 'transfer_in',
  PurchaseOrder = 'purchase_order',
  Damage = 'damage',
  Loss = 'loss'
}

export interface Installment {
  id: string;
  timestamp: Date;
  amount: number;
  method: 'cash' | 'card' | 'credit';
  userId: number;
  username: string;
}

export interface Supplier {
    id: number;
    tenantId: number; // Isolation
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface PurchaseOrderItem {
    productId: number;
    variantId: number;
    productName: string;
    variantName: string;
    quantity: number;
    costPrice: number;
}

export interface PurchaseOrder {
    id: string;
    tenantId: number; // Isolation
    supplierId: number;
    storeId: number;
    items: PurchaseOrderItem[];
    status: 'draft' | 'ordered' | 'received' | 'cancelled';
    createdAt: Date;
    receivedAt?: Date;
    totalAmount: number;
    reference?: string;
}

export interface Store {
  id: number;
  tenantId: number; // Isolation
  name: string;
  location: string;
  phone?: string;
}

export interface SuspendedOrder {
    id: string;
    tenantId: number; // Isolation
    storeId?: number; // Magasin où la commande a été suspendue
    label: string;
    items: CartItem[];
    timestamp: Date;
    customerId?: number;
}

export interface CashTransaction {
    id: string;
    type: 'in' | 'out' | 'sale' | 'refund';
    amount: number;
    reason: string;
    timestamp: Date;
    userId: number;
    username: string;
}

export interface CashSession {
    id: string;
    tenantId: number; // Isolation
    startTime: Date;
    endTime?: Date;
    openingCash: number;
    closingCash?: number;
    transactions: CashTransaction[];
    storeId: number;
    status: 'open' | 'closed';
}

export interface StockHistoryEntry {
  timestamp: string;
  change: number;
  newStock: number;
  reason: StockChangeReason;
  notes?: string;
  userId?: number;
  username?: string;
  storeId?: number;
}

export enum UserRole {
  SuperAdmin = 'superadmin',
  Owner = 'owner',
  Admin = 'admin',
  Manager = 'manager',
  Cashier = 'cashier',
}

export interface Permissions {
  viewAnalytics: boolean;
  manageProducts: boolean;
  viewHistory: boolean;
  accessSettings: boolean;
  manageUsers: boolean;
  manageStores?: boolean;
  manageLicenses?: boolean;
}

export interface User {
  id: number;
  tenantId: number; // ID du propriétaire (ou son propre ID si Owner)
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: UserRole;
  permissions: Permissions;
  assignedStoreId?: number;
}

export interface License {
  id: string;
  key: string;
  tenantId?: number; // Lié à un tenant spécifique
  assignedTo: string;
  createdAt: Date;
  expiryDate: Date;
  isActive: boolean;
  plan: 'STARTER' | 'BUSINESS_PRO' | 'ENTERPRISE';
}

export interface ActionLogEntry {
  id: number;
  tenantId: number; // Isolation
  timestamp: Date;
  userId: number;
  username: string;
  action: string;
  details?: string;
}

export interface ProductAttribute {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: number;
  selectedOptions: { [key: string]: string };
  price: number;
  costPrice: number; 
  stock_quantity: number;
  quantityByStore?: { [storeId: number]: number };
  sku?: string;
  barcode?: string;
  stock_history?: StockHistoryEntry[];
}

export interface Product {
  id: number;
  tenantId: number; // Isolation
  name: string;
  category: string;
  description?: string;
  imageUrl: string;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  low_stock_threshold?: number;
  enable_email_alert?: boolean;
  outOfStockSince?: string;
  lowStockSince?: string;
  expectedRestockDate?: string;
}

export interface CartItem {
  id: string;
  productId: number;
  productName: string;
  imageUrl: string;
  variant: ProductVariant;
  variantName: string;
  quantity: number;
  returnedQuantity?: number;
}


export interface PromoCode {
  id: number;
  tenantId: number; // Isolation
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  expiresAt?: Date;
}

export interface Sale {
    id: string;
    tenantId: number; // Isolation
    items: CartItem[];
    subtotal: number;
    discount: number;
    loyaltyDiscount: number;
    tax: number;
    total: number;
    user: User;
    timestamp: Date;
    customerId?: number;
    storeId?: number;
    promoCode?: string;
    loyaltyPointsEarned: number;
    loyaltyPointsUsed: number;
    paymentMethod: 'cash' | 'card' | 'credit';
    isCredit: boolean;
    totalPaid: number;
    itemStatus?: 'taken' | 'reserved';
    installments: Installment[];
    returnDetails?: {
      originalSaleId: string;
      returnedAmount: number;
    };
}

export interface Settings {
  tenantId: number; // Paramètres par tenant
  storeName: string;
  logoUrl?: string;
  taxRate: number;
  loyaltyProgram: {
    enabled: boolean;
    pointsPerDollar: number;
    pointValue: number;
  };
  printing: {
    autoPrint: boolean;
    paperWidth: '58mm' | '80mm';
    showBarcodes: boolean;
    promotionalMessages: string[];
    currentPromotionalMessage?: string;
    printStatistics: {
      enabled: boolean;
      totalReceipts: number;
      paperSaved: number; // en mètres
    };
  };
}

export type Language = 'en' | 'fr';
export type Theme = 'light' | 'dark';

export const getVariantName = (variant: ProductVariant): string => {
  if (!variant.selectedOptions || Object.keys(variant.selectedOptions).length === 0) {
    // @ts-ignore
    return variant.name || 'Standard';
  }
  return Object.keys(variant.selectedOptions).sort().map(key => variant.selectedOptions[key]).join(' / ');
};
