
import React, { useState, useEffect } from 'react';
import { Product, StockChangeReason, getVariantName } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';
import { useAuth } from '../contexts/AuthContext';

interface RestockModalProps {
  product: Product;
  onClose: () => void;
  targetStoreId?: number; // Nouveau: Magasin cible spécifique
}

const RestockModal: React.FC<RestockModalProps> = ({ product, onClose, targetStoreId }) => {
  const { t } = useLanguage();
  const { updateVariantStock } = useProducts();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Pre-select the first variant if available
    if (product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || selectedVariantId === null || !user) return;
    
    const quantityValue = Number(quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      addToast(t('quantityMustBePositive'), 'error');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation

    updateVariantStock(
        product.id, 
        selectedVariantId, 
        quantityValue, 
        StockChangeReason.Restock, 
        user, 
        notes,
        targetStoreId // Utilise le magasin spécifié
    );
    
    addToast(t('productRestockedSuccess'), 'success');
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t('restockProduct')}
        </h2>
        <p className="text-indigo-600 dark:text-indigo-400 mb-6">{product.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="variant" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('selectVariant')}</label>
            <select
              id="variant"
              name="variant"
              value={selectedVariantId ?? ''}
              onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              required
              className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {product.variants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {getVariantName(variant)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quantityToAdd')}</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              min="1"
              className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('restockNotes')}</label>
            <input
              type="text"
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('stockChangePlaceholder')}
              className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 flex items-center justify-center min-w-[110px]">
              {isSaving && <Spinner size="sm" className="mr-2" />}
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestockModal;
