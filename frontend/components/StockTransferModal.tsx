
import React, { useState, useEffect } from 'react';
import { Product, getVariantName } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useStores } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

interface StockTransferModalProps {
  product: Product;
  onClose: () => void;
  initialSourceStoreId?: number | 'all';
}

const StockTransferModal: React.FC<StockTransferModalProps> = ({ product, onClose, initialSourceStoreId }) => {
  const { t } = useLanguage();
  const { transferStock } = useProducts();
  const { stores, currentStore } = useStores();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [variantId, setVariantId] = useState<number>(product.variants[0]?.id || 0);
  const [sourceStoreId, setSourceStoreId] = useState<number>(
    typeof initialSourceStoreId === 'number' ? initialSourceStoreId : (currentStore?.id || stores[0]?.id || 0)
  );
  const [destStoreId, setDestStoreId] = useState<number>(
    stores.find(s => s.id !== sourceStoreId)?.id || 0
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedVariant = product.variants.find(v => v.id === variantId);
  const availableStock = selectedVariant?.quantityByStore?.[sourceStoreId] || 0;

  useEffect(() => {
    // If source and dest are the same, pick another dest
    if (sourceStoreId === destStoreId) {
        const otherStore = stores.find(s => s.id !== sourceStoreId);
        if (otherStore) setDestStoreId(otherStore.id);
    }
  }, [sourceStoreId, stores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    if (quantity <= 0) {
      addToast(t('quantityMustBePositive'), 'error');
      return;
    }

    if (quantity > availableStock) {
      addToast(t('insufficientStock'), 'error');
      return;
    }

    if (sourceStoreId === destStoreId) {
        addToast("Le magasin source et destination doivent être différents.", 'error');
        return;
    }

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));

    const success = transferStock(product.id, variantId, quantity, sourceStoreId, destStoreId, user, notes);
    
    if (success) {
      addToast(t('transferSuccess'), 'success');
      onClose();
    } else {
      addToast(t('insufficientStock'), 'error');
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
          {t('stockTransfer')}
        </h2>
        <p className="text-indigo-600 dark:text-indigo-400 font-bold mb-6 truncate">{product.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t('selectVariant')}</label>
            <select
              value={variantId}
              onChange={(e) => setVariantId(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
            >
              {product.variants.map(v => (
                <option key={v.id} value={v.id}>{getVariantName(v)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t('sourceStore')}</label>
              <select
                value={sourceStoreId}
                onChange={(e) => setSourceStoreId(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] font-bold text-slate-500">Stock dispo: <span className="text-indigo-600">{availableStock}</span></p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t('destinationStore')}</label>
              <select
                value={destStoreId}
                onChange={(e) => setDestStoreId(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t('transferQuantity')}</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              max={availableStock}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-black text-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{t('transferNotes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm"
              rows={2}
              placeholder="Ex: Rééquilibrage succursale..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black uppercase text-xs rounded-xl">{t('cancel')}</button>
            <button 
                type="submit" 
                disabled={isSaving || availableStock === 0}
                className="flex-[2] py-3 bg-indigo-600 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-indigo-500/20 disabled:bg-slate-400"
            >
              {isSaving ? <Spinner size="sm" /> : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTransferModal;
