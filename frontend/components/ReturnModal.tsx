
import React, { useState, useMemo } from 'react';
import { Sale, StockChangeReason, getVariantName, ReturnReason } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

interface ReturnModalProps {
  sale: Sale;
  onClose: () => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ sale, onClose }) => {
  const { t } = useLanguage();
  const { addReturnToSale } = useSalesHistory();
  const { updateVariantStock } = useProducts();
  const { addStoreCredit } = useCustomers();
  const { startExchange } = useCart();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { settings } = useSettings();
  
  const [itemsToReturn, setItemsToReturn] = useState<{ [cartItemId: string]: number }>({});
  const [returnReason, setReturnReason] = useState<ReturnReason>(ReturnReason.Other);
  const [returnNotes, setReturnNotes] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);

  // Seuil de validation (configurable - pour l'instant 50000 FCFA)
  const APPROVAL_THRESHOLD = 50000;

  const handleQuantityChange = (itemId: string, value: string, max: number) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 0) {
      setItemsToReturn(prev => ({ ...prev, [itemId]: 0 }));
    } else {
      setItemsToReturn(prev => ({ ...prev, [itemId]: Math.min(quantity, max) }));
    }
  };

  const handleSelectAll = () => {
    const allItems: { [key: string]: number } = {};
    sale.items.forEach(item => {
      const maxReturnable = item.quantity - (item.returnedQuantity || 0);
      if (maxReturnable > 0) {
        allItems[item.id] = maxReturnable;
      }
    });
    setItemsToReturn(allItems);
  };

  const handleClearAll = () => {
    setItemsToReturn({});
  };

  const totalRefundValue = useMemo(() => {
    return sale.items.reduce((total, item) => {
      const returnQty = itemsToReturn[item.id] || 0;
      return total + (returnQty * item.variant.price);
    }, 0);
  }, [itemsToReturn, sale.items]);

  // Calculer les points de fidélité à déduire proportionnellement
  const loyaltyPointsToDeduct = useMemo(() => {
    if (!sale.loyaltyPointsEarned || sale.loyaltyPointsEarned === 0) return 0;
    
    // Calculer le ratio du montant retourné par rapport au subtotal original
    const returnRatio = sale.subtotal > 0 ? totalRefundValue / sale.subtotal : 0;
    
    // Déduire proportionnellement les points
    return Math.floor(sale.loyaltyPointsEarned * returnRatio);
  }, [totalRefundValue, sale.subtotal, sale.loyaltyPointsEarned]);

  // Vérifier si validation superviseur nécessaire
  useMemo(() => {
    setNeedsApproval(totalRefundValue > APPROVAL_THRESHOLD);
  }, [totalRefundValue]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  const getReturnReasonLabel = (reason: ReturnReason) => {
    const labels = {
      [ReturnReason.Defective]: 'Produit défectueux',
      [ReturnReason.WrongSize]: 'Mauvaise taille',
      [ReturnReason.WrongColor]: 'Mauvaise couleur',
      [ReturnReason.Unsatisfied]: 'Client insatisfait',
      [ReturnReason.OrderError]: 'Erreur de commande',
      [ReturnReason.Other]: 'Autre raison'
    };
    return labels[reason];
  };

  const processReturn = (refundMethod: 'store_credit' | 'cash' | 'exchange') => {
    if (!user) return;

    const returnedItems = Object.entries(itemsToReturn)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([cartItemId, quantity]) => ({ cartItemId, quantity: Number(quantity) }));

    if (returnedItems.length === 0) {
      addToast('Aucun article sélectionné', 'error');
      return;
    }

    // Validation superviseur si nécessaire
    if (needsApproval && user.role === 'cashier') {
      addToast('Ce retour nécessite une validation superviseur', 'warning');
      // TODO: Implémenter système de notification superviseur
      return;
    }

    // Préparer les détails du retour
    const returnDetails = {
      reason: returnReason,
      notes: returnNotes,
      refundMethod,
      items: returnedItems.map(({ cartItemId, quantity }) => {
        const item = sale.items.find(i => i.id === cartItemId)!;
        return {
          cartItemId,
          productName: item.productName,
          variantName: item.variantName,
          quantity,
          unitPrice: item.variant.price,
          totalRefund: quantity * item.variant.price
        };
      }),
      totalRefundAmount: totalRefundValue,
      processedBy: user.id,
      processedByName: user.username
    };

    // 1. Update the original sale record with returned quantities
    addReturnToSale(sale.id, returnedItems, returnDetails);

    // 2. Restock the items
    returnedItems.forEach(({ cartItemId, quantity }) => {
        const originalItem = sale.items.find(i => i.id === cartItemId);
        if (originalItem) {
            updateVariantStock(
                originalItem.productId, 
                originalItem.variant.id, 
                quantity, 
                StockChangeReason.Return, 
                user, 
                `Retour: ${getReturnReasonLabel(returnReason)} - Vente ${sale.id.slice(-8)}`
            );
        }
    });

    return returnDetails;
  };

  const handleIssueStoreCredit = () => {
    if (!sale.customerId) {
        addToast(t('noCustomerForCredit'), 'error');
        return;
    }
    
    const returnDetails = processReturn('store_credit');
    if (!returnDetails) return;

    // Ajouter le crédit magasin
    addStoreCredit(sale.customerId, totalRefundValue);
    
    // Déduire les points de fidélité si applicable
    if (loyaltyPointsToDeduct > 0) {
      updateCustomerAfterSale(sale.customerId, sale.id, -loyaltyPointsToDeduct, 0);
      addToast(`Crédit magasin de ${formatCurrency(totalRefundValue)} émis. ${loyaltyPointsToDeduct} points déduits.`, 'success');
    } else {
      addToast(`Crédit magasin de ${formatCurrency(totalRefundValue)} émis`, 'success');
    }
    
    onClose();
  };

  const handleCashRefund = () => {
    const returnDetails = processReturn('cash');
    if (!returnDetails) return;

    // Déduire les points de fidélité si applicable
    if (sale.customerId && loyaltyPointsToDeduct > 0) {
      updateCustomerAfterSale(sale.customerId, sale.id, -loyaltyPointsToDeduct, 0);
      addToast(`Remboursement cash de ${formatCurrency(totalRefundValue)} effectué. ${loyaltyPointsToDeduct} points déduits.`, 'success');
    } else {
      addToast(`Remboursement cash de ${formatCurrency(totalRefundValue)} effectué`, 'success');
    }
    
    onClose();
  };

  const handleStartExchange = () => {
    if (!sale.customerId) {
        addToast(t('noCustomerForCredit'), 'error'); 
        return;
    }
    
    const returnDetails = processReturn('exchange');
    if (!returnDetails) return;

    // Déduire les points de fidélité si applicable
    if (loyaltyPointsToDeduct > 0) {
      updateCustomerAfterSale(sale.customerId, sale.id, -loyaltyPointsToDeduct, 0);
    }

    startExchange(sale.id, totalRefundValue);
    addToast(t('exchangeStarted'), 'info');
    onClose();
  };

  const returnedItemsCount = Object.values(itemsToReturn).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl p-6 relative flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('returnExchange')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vente ID: ...{sale.id.slice(-8)}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Raison du retour */}
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Raison du retour *
            </label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm"
            >
              {Object.values(ReturnReason).map(reason => (
                <option key={reason} value={reason}>{getReturnReasonLabel(reason)}</option>
              ))}
            </select>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mt-3 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Détails supplémentaires..."
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 border-t border-b border-slate-200 dark:border-slate-700 py-4 my-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Articles ({returnedItemsCount} sélectionné{returnedItemsCount > 1 ? 's' : ''})
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-200 font-bold"
              >
                Tout sélectionner
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-200 font-bold"
              >
                Effacer
              </button>
            </div>
          </div>

          <ul className="space-y-3">
            {sale.items.map(item => {
              const maxReturnable = item.quantity - (item.returnedQuantity || 0);
              if (maxReturnable <= 0) return null;

              const currentQty = itemsToReturn[item.id] || 0;

              return (
                <li key={item.id} className="flex items-center gap-4 text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <img src={item.imageUrl} alt={item.productName} className="w-14 h-14 object-cover rounded-md" />
                  <div className="flex-grow">
                    <p className="font-bold text-slate-800 dark:text-white uppercase">{item.productName}</p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">{getVariantName(item.variant)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Acheté: {item.quantity} • Max retournable: {maxReturnable}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600">
                      <button
                        onClick={() => handleQuantityChange(item.id, String(Math.max(0, currentQty - 1)), maxReturnable)}
                        className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-md"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        value={currentQty || ''}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value, maxReturnable)}
                        min="0"
                        max={maxReturnable}
                        className="w-12 p-1 text-center font-bold bg-transparent border-none focus:outline-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, String(Math.min(maxReturnable, currentQty + 1)), maxReturnable)}
                        className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-md"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 w-24 text-right">
                      {formatCurrency(currentQty * item.variant.price)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="flex-shrink-0 pt-4">
            <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <span className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">Total à rembourser:</span>
                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalRefundValue)}</span>
                </div>
                
                {/* Afficher les points de fidélité à déduire */}
                {loyaltyPointsToDeduct > 0 && (
                    <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Points fidélité à déduire</p>
                                <p className="text-[10px] text-amber-700 dark:text-amber-500">Proportionnel au montant retourné</p>
                            </div>
                        </div>
                        <span className="text-xl font-black text-amber-600 dark:text-amber-400">-{loyaltyPointsToDeduct} pts</span>
                    </div>
                )}
            </div>

            {needsApproval && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs">
                  <p className="font-bold text-amber-800 dark:text-amber-400">Validation superviseur requise</p>
                  <p className="text-amber-700 dark:text-amber-500 mt-1">
                    Montant supérieur à {formatCurrency(APPROVAL_THRESHOLD)}. Un superviseur doit approuver ce retour.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                    onClick={onClose} 
                    className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-300 transition-colors"
                >
                    Annuler
                </button>
                <button 
                    onClick={handleCashRefund}
                    disabled={totalRefundValue <= 0 || (needsApproval && user?.role === 'cashier')}
                    className="w-full px-4 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                    💵 Cash
                </button>
                <button 
                    onClick={handleIssueStoreCredit}
                    disabled={totalRefundValue <= 0 || !sale.customerId || (needsApproval && user?.role === 'cashier')}
                    className="w-full px-4 py-3 bg-teal-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-teal-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
                >
                    💳 Crédit
                </button>
                <button 
                    onClick={handleStartExchange}
                    disabled={totalRefundValue <= 0 || !sale.customerId || (needsApproval && user?.role === 'cashier')}
                    className="w-full px-4 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                    🔄 Échanger
                </button>
            </div>
            {!sale.customerId && (
                <p className="text-xs text-red-500 font-bold mt-3 text-center uppercase tracking-tight">
                    <svg className="w-3 h-3 inline mr-1 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Client requis pour crédit/échange
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;
