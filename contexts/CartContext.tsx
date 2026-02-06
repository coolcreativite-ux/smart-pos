
import React, { createContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Product, ProductVariant, getVariantName, PromoCode, Customer, SuspendedOrder } from '../types';
import { useSettings } from './SettingsContext';
import { usePromoCodes } from '../hooks/usePromoCodes';
// Import useAuth to access tenantId
import { useAuth } from './AuthContext';
import { useStores } from './StoreContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  
  total: number;
  subtotal: number;
  tax: number;
  promoDiscount: number;
  manualDiscount: number;
  applyManualDiscount: (percent: number) => void;
  loyaltyDiscount: number;
  exchangeCredit: number;
  storeCreditPayment: number;
  pointsToEarn: number;
  
  appliedPromoCode: PromoCode | null;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;

  assignedCustomer: Customer | null;
  assignCustomer: (customer: Customer | null) => void;
  appliedLoyaltyPoints: number;
  applyLoyaltyPoints: () => void;

  exchangeContext: { originalSaleId: string; returnCredit: number } | null;
  startExchange: (originalSaleId: string, returnCredit: number) => void;
  applyStoreCredit: () => void;

  suspendedOrders: SuspendedOrder[];
  suspendCurrentOrder: (label: string) => void;
  resumeOrder: (id: string) => void;
  deleteSuspendedOrder: (id: string) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number>(0);
  const [assignedCustomer, setAssignedCustomer] = useState<Customer | null>(null);
  const [appliedLoyaltyPoints, setAppliedLoyaltyPoints] = useState<number>(0);
  const [exchangeContext, setExchangeContext] = useState<{ originalSaleId: string; returnCredit: number } | null>(null);
  const [storeCreditPayment, setStoreCreditPayment] = useState<number>(0);
  const [suspendedOrders, setSuspendedOrders] = useState<SuspendedOrder[]>(() => {
      const saved = localStorage.getItem('suspendedOrders');
      return saved ? JSON.parse(saved) : [];
  });

  const { settings } = useSettings();
  const { promoCodes } = usePromoCodes();
  // Get current user for tenantId
  const { user } = useAuth();
  const { currentStore } = useStores();

  useEffect(() => {
      localStorage.setItem('suspendedOrders', JSON.stringify(suspendedOrders));
  }, [suspendedOrders]);

  const addToCart = useCallback((product: Product, variant: ProductVariant, quantity: number = 1) => {
    setCartItems(prevItems => {
      const cartItemId = `${product.id}-${variant.id}`;
      const existingItem = prevItems.find(item => item.id === cartItemId);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      const newCartItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        variant: variant,
        variantName: getVariantName(variant),
        quantity: quantity,
      };
      return [...prevItems, newCartItem];
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === cartItemId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeFromCart]);

  const applyPromoCode = useCallback((code: string): boolean => {
    const foundCode = promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
    if (foundCode) {
      setAppliedPromoCode(foundCode);
      return true;
    }
    setAppliedPromoCode(null);
    return false;
  }, [promoCodes]);
  
  const removePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
  }, []);

  const applyManualDiscount = (percent: number) => setManualDiscountPercent(percent);
  
  const assignCustomer = useCallback((customer: Customer | null) => {
      setAssignedCustomer(customer);
      setAppliedLoyaltyPoints(0);
      setStoreCreditPayment(0);
  }, []);

  const applyLoyaltyPoints = useCallback(() => {
    if (assignedCustomer && assignedCustomer.loyaltyPoints > 0) {
        setAppliedLoyaltyPoints(assignedCustomer.loyaltyPoints);
    }
  }, [assignedCustomer]);

  const startExchange = useCallback((originalSaleId: string, returnCredit: number) => {
    setCartItems([]);
    setAppliedPromoCode(null);
    setAppliedLoyaltyPoints(0);
    setStoreCreditPayment(0);
    setExchangeContext({ originalSaleId, returnCredit });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedPromoCode(null);
    setAssignedCustomer(null);
    setAppliedLoyaltyPoints(0);
    setExchangeContext(null);
    setStoreCreditPayment(0);
    setManualDiscountPercent(0);
  }, []);

  // Suspended Orders Logic
  const suspendCurrentOrder = (label: string) => {
      if (cartItems.length === 0) return;
      const newSuspended: SuspendedOrder = {
          id: Date.now().toString(),
          // Add missing tenantId and storeId
          tenantId: user?.tenantId || 0,
          storeId: currentStore?.id,
          label: label || `Commande #${suspendedOrders.length + 1}`,
          items: [...cartItems],
          timestamp: new Date(),
          customerId: assignedCustomer?.id
      };
      setSuspendedOrders(prev => [newSuspended, ...prev]);
      clearCart();
  };

  const resumeOrder = (id: string) => {
      const order = suspendedOrders.find(o => o.id === id);
      if (order) {
          setCartItems(order.items);
          // Note: In a real app we'd re-fetch the customer here
          setSuspendedOrders(prev => prev.filter(o => o.id !== id));
      }
  };

  const deleteSuspendedOrder = (id: string) => {
      setSuspendedOrders(prev => prev.filter(o => o.id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.variant.price * item.quantity, 0), [cartItems]);

  const manualDiscount = useMemo(() => {
      return (subtotal * manualDiscountPercent) / 100;
  }, [subtotal, manualDiscountPercent]);

  const promoDiscount = useMemo(() => {
    if (!appliedPromoCode) return 0;
    let discount = 0;
    if (appliedPromoCode.type === 'percentage') {
      discount = (subtotal - manualDiscount) * (appliedPromoCode.value / 100);
    } else {
      discount = appliedPromoCode.value;
    }
    return Math.min(discount, Math.max(0, subtotal - manualDiscount));
  }, [appliedPromoCode, subtotal, manualDiscount]);

  const subtotalAfterPromo = subtotal - promoDiscount - manualDiscount;
  
  const loyaltyDiscount = useMemo(() => {
    if (!settings.loyaltyProgram.enabled || appliedLoyaltyPoints <= 0) return 0;
    const discount = appliedLoyaltyPoints * settings.loyaltyProgram.pointValue;
    return Math.min(discount, Math.max(0, subtotalAfterPromo));
  }, [settings.loyaltyProgram, appliedLoyaltyPoints, subtotalAfterPromo]);

  const subtotalAfterLoyalty = subtotalAfterPromo - loyaltyDiscount;
  const tax = useMemo(() => Math.max(0, subtotalAfterLoyalty) * (settings.taxRate / 100), [subtotalAfterLoyalty, settings.taxRate]);
  const totalWithTax = subtotalAfterLoyalty + tax;
  const exchangeCredit = useMemo(() => exchangeContext?.returnCredit || 0, [exchangeContext]);
  const totalAfterExchange = totalWithTax - exchangeCredit;

  const applyStoreCredit = useCallback(() => {
    if (assignedCustomer && assignedCustomer.storeCredit > 0) {
      const creditToUse = Math.min(assignedCustomer.storeCredit, Math.max(0, totalAfterExchange));
      setStoreCreditPayment(creditToUse);
    }
  }, [assignedCustomer, totalAfterExchange]);
  
  const total = Math.max(0, totalAfterExchange - storeCreditPayment);

  const pointsToEarn = useMemo(() => {
      if (!settings.loyaltyProgram.enabled || !assignedCustomer) return 0;
      return Math.floor(Math.max(0, subtotalAfterLoyalty) * settings.loyaltyProgram.pointsPerDollar);
  }, [subtotalAfterLoyalty, settings.loyaltyProgram, assignedCustomer]);


  return (
    <CartContext.Provider value={{ 
        cartItems, addToCart, removeFromCart, updateQuantity, clearCart, 
        total, subtotal, tax, promoDiscount, manualDiscount, applyManualDiscount, loyaltyDiscount, exchangeCredit, storeCreditPayment, pointsToEarn,
        appliedPromoCode, applyPromoCode, removePromoCode,
        assignedCustomer, assignCustomer, appliedLoyaltyPoints, applyLoyaltyPoints,
        exchangeContext, startExchange, applyStoreCredit,
        suspendedOrders, suspendCurrentOrder, resumeOrder, deleteSuspendedOrder
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
    const context = React.useContext(CartContext);
    if(context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
