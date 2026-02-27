
import React, { createContext, useState, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import { Sale, Installment, UserRole } from '../types';
import { useAuth } from './AuthContext';
import { useActionLog } from './ActionLogContext';
import { API_URL } from '../config';

interface SalesHistoryContextType {
  sales: Sale[];
  addSale: (sale: Sale) => Promise<void>;
  clearSalesHistory: () => Promise<void>;
  addReturnToSale: (saleId: string, returnedItems: { cartItemId: string; quantity: number }[]) => Promise<void>;
  addInstallmentToSale: (saleId: string, installment: Installment) => void;
  loadSales: () => Promise<void>;
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

  // Charger les ventes depuis la base de données
  const loadSales = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/sales`);
      
      if (!response.ok) {
        console.warn('Erreur lors du chargement des ventes depuis l\'API');
        return;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Convertir les données de la DB au format attendu
        const dbSales: Sale[] = data.map((dbSale: any) => ({
          id: dbSale.id,
          tenantId: dbSale.tenant_id,
          storeId: dbSale.store_id,
          userId: dbSale.user_id,
          customerId: dbSale.customer_id,
          timestamp: new Date(dbSale.created_at),
          items: dbSale.items || [],
          subtotal: parseFloat(dbSale.subtotal),
          discount: parseFloat(dbSale.discount || 0),
          loyaltyDiscount: parseFloat(dbSale.loyalty_discount || 0),
          tax: parseFloat(dbSale.tax || 0),
          total: parseFloat(dbSale.total),
          promoCode: dbSale.promo_code,
          loyaltyPointsEarned: dbSale.loyalty_points_earned || 0,
          loyaltyPointsUsed: dbSale.loyalty_points_used || 0,
          paymentMethod: dbSale.payment_method,
          isCredit: dbSale.is_credit || false,
          totalPaid: parseFloat(dbSale.total_paid || 0),
          itemStatus: dbSale.item_status || 'taken',
          installments: [] // TODO: Charger les installments si nécessaire
        }));

        setAllSales(dbSales);
        localStorage.setItem('globalSalesHistory', JSON.stringify(dbSales));
        console.log('✅ Ventes chargées depuis l\'API:', dbSales.length);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des ventes:', error);
    }
  }, []);

  // Charger les ventes au démarrage
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const addSale = useCallback(async (sale: Sale) => {
    if (!user) return;
    
    try {
      const saleWithTenant: Sale = {
        ...sale,
        tenantId: user.tenantId,
        items: sale.items.map(item => ({ ...item, returnedQuantity: item.returnedQuantity || 0 })),
        installments: sale.installments || []
      };

      // Préparer les données pour l'API
      const saleData = {
        tenant_id: saleWithTenant.tenantId,
        store_id: saleWithTenant.storeId,
        user_id: saleWithTenant.user.id,
        customer_id: saleWithTenant.customerId,
        subtotal: saleWithTenant.subtotal,
        discount: saleWithTenant.discount,
        loyalty_discount: saleWithTenant.loyaltyDiscount,
        tax: saleWithTenant.tax,
        total: saleWithTenant.total,
        promo_code: saleWithTenant.promoCode,
        loyalty_points_earned: saleWithTenant.loyaltyPointsEarned,
        loyalty_points_used: saleWithTenant.loyaltyPointsUsed,
        payment_method: saleWithTenant.paymentMethod,
        is_credit: saleWithTenant.isCredit,
        total_paid: saleWithTenant.totalPaid,
        item_status: saleWithTenant.itemStatus || 'taken',
        items: saleWithTenant.items.map(item => ({
          product_id: item.productId,
          variant_id: item.variant.id,
          quantity: item.quantity,
          unit_price: item.variant.price,
          total_price: item.variant.price * item.quantity
        }))
      };

      // Envoyer à l'API
      const response = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la vente');
      }

      const createdSale = await response.json();
      console.log('✅ Vente créée dans la DB:', createdSale.id);

      // Mettre à jour le state local avec l'ID de la DB
      const saleWithDbId: Sale = {
        ...saleWithTenant,
        id: createdSale.id  // Utiliser l'UUID de la DB au lieu de l'ID temporaire
      };
      saveToGlobal([saleWithDbId, ...allSales]);
      
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
    } catch (error) {
      console.error('❌ Erreur création vente:', error);
      // Fallback: sauvegarder en localStorage uniquement
      const saleWithTenant: Sale = {
        ...sale,
        tenantId: user.tenantId,
        items: sale.items.map(item => ({ ...item, returnedQuantity: item.returnedQuantity || 0 })),
        installments: sale.installments || []
      };
      saveToGlobal([saleWithTenant, ...allSales]);
    }
  }, [allSales, user, logAction]);

  const clearSalesHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      // Supprimer de la DB via l'API
      const response = await fetch(`${API_URL}/api/sales`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'historique');
      }

      console.log('✅ Historique des ventes supprimé de la DB');
      
      // Mettre à jour le state local
      saveToGlobal(allSales.filter(s => s.tenantId !== user.tenantId));
    } catch (error) {
      console.error('❌ Erreur suppression historique:', error);
      // Fallback: supprimer uniquement du localStorage
      saveToGlobal(allSales.filter(s => s.tenantId !== user.tenantId));
    }
  }, [allSales, user]);

  const addReturnToSale = useCallback(async (saleId: string, returnedItems: { cartItemId: string; quantity: number }[], returnDetails?: any) => {
    try {
      // Préparer les données pour l'API
      const returned_items = returnedItems.map(item => ({
        id: item.cartItemId,
        returned_quantity: item.quantity
      }));

      // Envoyer à l'API avec les détails du retour
      const response = await fetch(`${API_URL}/api/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          returned_items,
          return_details: returnDetails 
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement du retour');
      }

      const result = await response.json();
      console.log('✅ Retour enregistré dans la DB');
      console.log('📊 Nouveaux totaux:', result.updatedTotals);

      // Mettre à jour le state local avec les nouveaux totaux
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
          
          // Ajouter le retour à l'historique
          const returns = sale.returns || [];
          if (returnDetails) {
            returns.push({
              id: `return_${Date.now()}`,
              saleId,
              timestamp: new Date(),
              ...returnDetails
            });
          }
          
          // Mettre à jour les totaux avec les valeurs recalculées par le backend
          const updatedTotals = result.updatedTotals || {};
          
          return { 
            ...sale, 
            items: updatedItems,
            returns,
            hasReturns: true,
            // Mettre à jour les totaux si fournis par le backend
            subtotal: updatedTotals.subtotal ? parseFloat(updatedTotals.subtotal) : sale.subtotal,
            discount: updatedTotals.discount ? parseFloat(updatedTotals.discount) : sale.discount,
            loyaltyDiscount: updatedTotals.loyaltyDiscount ? parseFloat(updatedTotals.loyaltyDiscount) : sale.loyaltyDiscount,
            tax: updatedTotals.tax ? parseFloat(updatedTotals.tax) : sale.tax,
            total: updatedTotals.total ? parseFloat(updatedTotals.total) : sale.total
          };
        }
        return sale;
      }));
    } catch (error) {
      console.error('❌ Erreur enregistrement retour:', error);
      // Fallback: mettre à jour uniquement le localStorage
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
          return { ...sale, items: updatedItems, hasReturns: true };
        }
        return sale;
      }));
    }
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
    <SalesHistoryContext.Provider value={{ sales, addSale, clearSalesHistory, addReturnToSale, addInstallmentToSale, loadSales }}>
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
