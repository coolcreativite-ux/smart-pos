
import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../contexts/ToastContext';
import { useStores } from '../contexts/StoreContext';
import { Product, ProductVariant } from '../types';
import StockHistoryModal from './StockHistoryModal';

interface VariantSelectionModalProps {
  product: Product;
  onClose: () => void;
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({ product, onClose }) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { currentStore } = useStores();

  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [historyVariant, setHistoryVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    // Pre-select the first available option for each attribute
    const initialSelection = product.attributes.reduce((acc, attr) => {
        if (attr.values.length > 0) {
            acc[attr.name] = attr.values[0];
        }
        return acc;
    }, {} as { [key: string]: string });
    setSelectedOptions(initialSelection);
  }, [product.attributes]);

  const handleSelectOption = (attributeName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [attributeName]: value }));
  };

  const isObjectsEqual = (obj1: object, obj2: object) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (obj1[key as keyof typeof obj1] !== obj2[key as keyof typeof obj2]) return false;
    }
    return true;
  };
  
  const currentVariant = useMemo(() => {
    if (product.attributes.length === 0 && product.variants.length === 1) {
        return product.variants[0];
    }
    return product.variants.find(v => isObjectsEqual(v.selectedOptions, selectedOptions));
  }, [product.variants, product.attributes, selectedOptions]);


  // Helper pour calculer le stock du magasin actuel
  const getStoreStock = (variant: ProductVariant) => {
    return currentStore 
      ? (variant.quantityByStore?.[currentStore.id] || 0)
      : variant.stock_quantity; // Fallback si pas de magasin sélectionné
  };

  const handleAddToCart = () => {
    if (currentVariant && getStoreStock(currentVariant) > 0) {
      addToCart(product, currentVariant);
      addToast(t('productAdded'), 'success');
      // onClose(); // Supprimé pour rester dans le modal comme demandé
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };
  
  // Handle case for products without attributes (single variant)
  if (product.attributes.length === 0) {
      if (product.variants.length === 1) {
          const variant = product.variants[0];
          if (getStoreStock(variant) > 0) {
              addToCart(product, variant);
              addToast(t('productAdded'), 'success');
          }
      }
      onClose();
      return null;
  }

  return (
    <>
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{product.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('selectVariant')}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {product.attributes.map(attribute => (
                <div key={attribute.name}>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{attribute.name}</h3>
                <div className="flex flex-wrap gap-2">
                    {attribute.values.map(value => {
                    const isSelected = selectedOptions[attribute.name] === value;
                    return (
                        <button 
                        key={value}
                        onClick={() => handleSelectOption(attribute.name, value)}
                        className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-colors ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-indigo-500'}`}
                        >
                        {value}
                        </button>
                    );
                    })}
                </div>
                </div>
            ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {currentVariant ? formatCurrency(currentVariant.price) : '--'}
                    </p>
                    <p className={`text-sm ${currentVariant && getStoreStock(currentVariant) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {currentVariant ? (getStoreStock(currentVariant) > 0 ? `${getStoreStock(currentVariant)} ${t('inStock')}` : t('outOfStock')) : t('selectVariant')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setHistoryVariant(currentVariant)}
                        disabled={!currentVariant}
                        className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('stockHistory')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleAddToCart}
                        disabled={!currentVariant || getStoreStock(currentVariant) <= 0}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg transition-colors hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {t('addToCart')}
                    </button>
                </div>
            </div>
            </div>
        </div>
        </div>
        {historyVariant && (
            <StockHistoryModal 
                productName={product.name} 
                variant={historyVariant} 
                onClose={() => setHistoryVariant(null)} 
            />
        )}
    </>
  );
};

export default VariantSelectionModal;
