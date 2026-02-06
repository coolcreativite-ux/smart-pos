
import React, { useState, useMemo } from 'react';
import { Product, ProductVariant } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import VariantSelectionModal from './VariantSelectionModal';
import StockHistoryModal from './StockHistoryModal';
import ProductQuickViewModal from './ProductQuickViewModal';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useStores } from '../contexts/StoreContext';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { t } = useLanguage();
    const { currentStore } = useStores();
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [historyVariant, setHistoryVariant] = useState<ProductVariant | null>(null);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    // Calculer le stock total pour le magasin actuel
    const totalStock = useMemo(() => {
        if (!currentStore) {
            // Si pas de magasin sélectionné, utiliser le stock total
            return product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
        }
        
        // Utiliser le stock du magasin spécifique
        return product.variants.reduce((sum, v) => {
            const storeStock = v.quantityByStore?.[currentStore.id] || 0;
            return sum + storeStock;
        }, 0);
    }, [product.variants, currentStore]);

    const stockStatus = useMemo(() => {
        if (totalStock <= 0) return 'out-of-stock';
        if (product.low_stock_threshold !== undefined && totalStock <= product.low_stock_threshold) {
            return 'low-stock';
        }
        return 'in-stock';
    }, [totalStock, product.low_stock_threshold]);

    const isOutOfStock = stockStatus === 'out-of-stock';

    const stockInfo = useMemo(() => {
        switch(stockStatus) {
            case 'out-of-stock':
                return { 
                    text: t('outOfStock'), 
                    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800',
                    icon: (
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                };
            case 'low-stock':
                return { 
                    text: t('lowStock'), 
                    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
                    icon: (
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )
                };
            default:
                return { 
                    text: `${totalStock}`, 
                    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
                    icon: (
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    )
                };
        }
    }, [stockStatus, totalStock, t]);

    const priceDisplay = useMemo(() => {
        const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });
        if (product.variants.length === 0) return formatter.format(0);
        const prices = product.variants.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (product.variants.length === 1 || minPrice === maxPrice) return formatter.format(minPrice);
        return `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
    }, [product.variants]);

    const handleAddToCartClick = () => {
        if (product.variants.length > 1) {
            setIsVariantModalOpen(true);
        } else if (product.variants.length === 1) {
            addToCart(product, product.variants[0]);
            addToast(t('productAdded'), 'success');
        }
    };

    const handleHistoryClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (product.variants.length === 1) {
            setHistoryVariant(product.variants[0]);
        } else {
            setIsVariantModalOpen(true);
        }
    };
    
    return (
        <>
            <div 
                className={`group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-700/50 hover:scale-[1.04] hover:z-20 cursor-pointer`}
                onClick={() => setIsQuickViewOpen(true)}
            >
                {/* Image Container */}
                <div className="relative h-40 sm:h-52 bg-slate-50 dark:bg-slate-700/30 p-4 flex items-center justify-center overflow-hidden">
                    <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className={`max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`} 
                    />
                    
                    {/* Stock History Icon (Top Left) */}
                    <button 
                        onClick={handleHistoryClick}
                        className="absolute top-2 left-2 z-20 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100"
                        title={t('stockHistory')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* Quick View Button Overlay (Desktop Only) */}
                    <div className="hidden lg:flex absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <div className="flex flex-col gap-2 p-4 w-full items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsQuickViewOpen(true);
                                }}
                                className="w-4/5 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white text-slate-900 font-bold py-2.5 px-4 rounded-xl shadow-xl hover:bg-indigo-50 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {t('quickView')}
                            </button>
                            
                            {!isOutOfStock && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCartClick();
                                    }}
                                    className="w-4/5 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-xl hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    {t('addToCartAction')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Out of Stock Ribbon */}
                    {isOutOfStock && (
                        <div className="absolute top-4 right-[-35px] bg-red-500 text-white px-10 py-1 rotate-45 text-[10px] font-bold shadow-lg uppercase tracking-tighter border-y border-white/20">
                            {t('outOfStock')}
                        </div>
                    )}
                </div>
                
                <div className="p-4">
                    <div className="mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1 block">{product.category}</span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={product.name}>{product.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-col">
                            <p className={`text-base sm:text-lg font-black tracking-tight ${isOutOfStock ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                {priceDisplay}
                            </p>
                            <div className={`flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold self-start border ${stockInfo.className}`}>
                                {stockInfo.icon}
                                {stockInfo.text}
                            </div>
                        </div>

                        {/* Mobile Add Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCartClick();
                            }}
                            className={`lg:hidden p-2.5 rounded-xl shadow-lg transition-all active:scale-90 ${isOutOfStock ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white active:bg-indigo-700'}`}
                            disabled={isOutOfStock}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isVariantModalOpen && (
                <VariantSelectionModal
                    product={product}
                    onClose={() => setIsVariantModalOpen(false)}
                />
            )}

            {isQuickViewOpen && (
                <ProductQuickViewModal
                    product={product}
                    onClose={() => setIsQuickViewOpen(false)}
                    onAddToCart={() => {
                        setIsQuickViewOpen(false);
                        handleAddToCartClick();
                    }}
                />
            )}
            
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

export default ProductCard;
