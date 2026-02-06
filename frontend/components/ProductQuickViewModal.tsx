
import React, { useMemo } from 'react';
import { Product } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useStores } from '../contexts/StoreContext';

interface ProductQuickViewModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: () => void;
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, onClose, onAddToCart }) => {
  const { t } = useLanguage();
  const { currentStore } = useStores();

  const priceDisplay = useMemo(() => {
    const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });
    if (product.variants.length === 0) return formatter.format(0);
    const prices = product.variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (product.variants.length === 1 || minPrice === maxPrice) return formatter.format(minPrice);
    return `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
  }, [product.variants]);

  const totalStock = useMemo(() => {
    // Calculer le stock total en fonction du magasin actuel (même logique que ProductCard)
    if (!currentStore) {
      // Si pas de magasin sélectionné, additionner tous les stocks des magasins
      return product.variants.reduce((sum, v) => {
        const allStoreStocks = Object.values(v.quantityByStore || {}) as number[];
        const totalStoreStock = allStoreStocks.reduce((a, b) => a + b, 0);
        return sum + (totalStoreStock || v.stock_quantity); // Fallback sur stock_quantity si pas de quantityByStore
      }, 0);
    }
    
    // Utiliser le stock du magasin spécifique
    return product.variants.reduce((sum, v) => {
      const storeStock = v.quantityByStore?.[currentStore.id] || 0;
      return sum + storeStock;
    }, 0);
  }, [product.variants, currentStore]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-full text-slate-500 dark:text-slate-400 transition-all shadow-lg active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-12 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="max-w-full max-h-[450px] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Content Section */}
        <div className="md:w-1/2 p-10 flex flex-col">
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                    {product.category}
                </span>
                {totalStock <= 0 ? (
                    <span className="text-[11px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">{t('outOfStock')}</span>
                ) : (
                    <span className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">{totalStock} {t('inStock')}</span>
                )}
            </div>

            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{product.name}</h2>
            
            <div className="mb-8">
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{priceDisplay}</p>
              <div className="h-1 w-12 bg-indigo-600 mt-2 rounded-full"></div>
            </div>

            {product.description && (
              <div className="mb-10">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{t('description')}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm lg:text-base font-medium">
                  {product.description}
                </p>
              </div>
            )}

            {product.attributes.length > 0 && (
                <div className="mb-10">
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{t('selectVariant')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {product.attributes.map(attr => (
                            <div key={attr.name} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {attr.name}: {attr.values.join(', ')}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onAddToCart}
              disabled={totalStock <= 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-black py-5 rounded-[1.25rem] shadow-[0_10px_30px_-10px_rgba(79,70,229,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {product.variants.length > 1 ? t('selectVariant') : t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickViewModal;
