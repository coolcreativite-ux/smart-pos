
import React, { useState, useMemo } from 'react';
import { Sale, StockChangeReason, getVariantName } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

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
  
  const [itemsToReturn, setItemsToReturn] = useState<{ [cartItemId: string]: number }>({});

  const handleQuantityChange = (itemId: string, value: string, max: number) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 0) {
      setItemsToReturn(prev => ({ ...prev, [itemId]: 0 }));
    } else {
      setItemsToReturn(prev => ({ ...prev, [itemId]: Math.min(quantity, max) }));
    }
  };

  const totalRefundValue = useMemo(() => {
    return sale.items.reduce((total, item) => {
      const returnQty = itemsToReturn[item.id] || 0;
      return total + (returnQty * item.variant.price);
    }, 0);
  }, [itemsToReturn, sale.items]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  const processReturn = () => {
    if (!user) return;

    const returnedItems = Object.entries(itemsToReturn)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([cartItemId, quantity]) => ({ cartItemId, quantity: Number(quantity) }));

    if (returnedItems.length === 0) return;

    // 1. Update the original sale record with returned quantities
    addReturnToSale(sale.id, returnedItems);

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
                `Retour de la Vente ID: ${sale.id}`
            );
        }
    });
  };

  const handleIssueStoreCredit = () => {
    if (!sale.customerId) {
        addToast(t('noCustomerForCredit'), 'error');
        return;
    }
    processReturn();
    addStoreCredit(sale.customerId, totalRefundValue);
    addToast(t('storeCreditIssued'), 'success');
    onClose();
  };

  const handleStartExchange = () => {
    if (!sale.customerId) {
        addToast(t('noCustomerForCredit'), 'error'); 
        return;
    }
    processReturn();
    startExchange(sale.id, totalRefundValue);
    addToast(t('exchangeStarted'), 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('returnExchange')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('selectItemsToReturn')} (Vente ID: ...{sale.id.slice(-6)})</p>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 border-t border-b border-slate-200 dark:border-slate-700 py-4 my-4">
          <ul className="space-y-4">
            {sale.items.map(item => {
              const maxReturnable = item.quantity - (item.returnedQuantity || 0);
              if (maxReturnable <= 0) return null;

              return (
                <li key={item.id} className="flex items-center gap-4 text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                  <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 object-cover rounded-md" />
                  <div className="flex-grow">
                    <p className="font-semibold text-slate-800 dark:text-white uppercase">{item.productName}</p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold">{getVariantName(item.variant)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t('purchased')}: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor={`return-qty-${item.id}`} className="text-[10px] font-black uppercase text-slate-400">{t('returnQuantity')}:</label>
                    <input
                      type="number"
                      id={`return-qty-${item.id}`}
                      value={itemsToReturn[item.id] || ''}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value, maxReturnable)}
                      min="0"
                      max={maxReturnable}
                      className="w-16 p-1.5 text-center font-bold rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{t('max')}: {maxReturnable}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="flex-shrink-0 pt-4">
            <div className="text-right mb-4">
                <span className="text-sm font-black uppercase text-slate-400">{t('totalRefundValue')}: </span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 ml-2">{formatCurrency(totalRefundValue)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                    onClick={onClose} 
                    className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-300 transition-colors"
                >
                    {t('cancel')}
                </button>
                <button 
                    onClick={handleIssueStoreCredit}
                    disabled={totalRefundValue <= 0 || !sale.customerId}
                    className="w-full px-4 py-3 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
                >
                    {t('issueStoreCredit')}
                </button>
                <button 
                    onClick={handleStartExchange}
                    disabled={totalRefundValue <= 0 || !sale.customerId}
                    className="w-full px-4 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                    {t('startExchange')}
                </button>
            </div>
            {!sale.customerId && (
                <p className="text-[10px] text-red-500 font-bold mt-3 text-center uppercase tracking-tight">
                    <svg className="w-3 h-3 inline mr-1 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t('noCustomerForCredit')}
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;
