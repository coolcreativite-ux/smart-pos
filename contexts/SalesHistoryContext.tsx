
import React, { createContext, useState, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import { Sale, Installment, UserRole } from '../types';
import { useAuth } from './AuthContext';
import { useActionLog } from './ActionLogContext';

interface SalesHistoryContextType {
  sales: Sale[];
  addSale: (sale: Sale) => void;
  clearSalesHistory: () => void;
  addReturnToSale: (saleId: string, returnedItems: { cartItemId: string; quantity: number }[]) => void;
  addInstallmentToSale: (saleId: string, installment: Installment) => void;
}

export const SalesHistoryContext = createContext<SalesHistoryContextType | undefined>(undefined);

export const SalesHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { logAction } = useActionLog();
  const [allSales, setAllSales] = useState<Sale[]>(() => {
      try {
          const saved = localStorage.getItem('globalSalesHistory');
          if (saved) {
              const parsed = JSON.parse(saved);
              return parsed.map((s: any) => ({
                  ...s,
                  timestamp: new Date(s.timestamp),
                  installments: s.installments ? s.installments.map((i: any) => ({ ...i, timestamp: new Date(i.timestamp) })) : []
              }));
          }
          return [];
      } catch (e) {
          return [];
      }
  });

  // Multi-Tenant Filter
  const sales = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.SuperAdmin) return allSales;
    return allSales.filter(s => s.tenantId === user.tenantId);
  }, [allSales, user]);

  const saveToGlobal = (newList: Sale[]) => {
      setAllSales(newList);
      localStorage.setItem('globalSalesHistory', JSON.stringify(newList));
  };

  const addSale = useCallback(async (sale: Sale) => {
    if (!user) return;
    const saleWithTenant: Sale = {
      ...sale,
      tenantId: user.tenantId,
      items: sale.items.map(item => ({ ...item, returnedQuantity: item.returnedQuantity || 0 })),
      installments: sale.installments || []
    };
    saveToGlobal([saleWithTenant, ...allSales]);
    
    // Log de l'activité de vente
    const totalAmount = sale.total.toFixed(0);
    const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    await logAction(
      user.id, 
      user.username, 
      'Sale Completed', 
      `Sale #${sale.id.substring(0, 8)} - ${itemCount} items - ${totalAmount} FCFA`, 
      user.tenantId
    );
  }, [allSales, user, logAction]);

  const clearSalesHistory = useCallback(() => {
    if (!user) return;
    saveToGlobal(allSales.filter(s => s.tenantId !== user.tenantId));
  }, [allSales, user]);

  const addReturnToSale = useCallback((saleId: string, returnedItems: { cartItemId: string; quantity: number }[]) => {
    saveToGlobal(allSales.map(sale => {
      if (sale.id === saleId) {
        const updatedItems = sale.items.map(item => {
          const returnedInfo = returnedItems.find(r => r.cartItemId === item.id);
          if (returnedInfo) {
            return {
              ...item,
              returnedQuantity: (item.returnedQuantity || 0) + returnedInfo.quantity,
            };
          }
          return item;
        });
        return { ...sale, items: updatedItems };
      }
      return sale;
    }));
  }, [allSales]);

  const addInstallmentToSale = useCallback((saleId: string, installment: Installment) => {
    saveToGlobal(allSales.map(sale => {
      if (sale.id === saleId) {
        return {
          ...sale,
          totalPaid: sale.totalPaid + installment.amount,
          installments: [...sale.installments, installment]
        };
      }
      return sale;
    }));
  }, [allSales]);

  return (
    <SalesHistoryContext.Provider value={{ sales, addSale, clearSalesHistory, addReturnToSale, addInstallmentToSale }}>
      {children}
    </SalesHistoryContext.Provider>
  );
};

// Export useSalesHistory hook to fix module missing member errors
export const useSalesHistory = () => {
    const context = useContext(SalesHistoryContext);
    if (context === undefined) {
        throw new Error('useSalesHistory must be used within a SalesHistoryProvider');
    }
    return context;
};
