
import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from './ProductCard';
import { useLanguage } from '../hooks/useLanguage';
import BarcodeScannerModal from './BarcodeScannerModal';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useStores } from '../contexts/StoreContext';

const ProductGrid: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();
    const { products } = useProducts();
    const { currentStore } = useStores();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    const filteredProducts = products.filter(p => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(lowerSearchTerm) ||
               p.category.toLowerCase().includes(lowerSearchTerm) ||
               p.variants.some(v => 
                 v.sku?.toLowerCase().includes(lowerSearchTerm) || 
                 v.barcode?.toLowerCase().includes(lowerSearchTerm)
               );
    });

    const handleScan = (barcode: string) => {
        for (const product of products) {
            for (const variant of product.variants) {
                if (variant.barcode === barcode) {
                    // Vérifier le stock du magasin actuel
                    const storeStock = currentStore 
                        ? (variant.quantityByStore?.[currentStore.id] || 0)
                        : variant.stock_quantity; // Fallback si pas de magasin sélectionné
                    
                    if (storeStock > 0) {
                        addToCart(product, variant);
                        addToast(t('productAdded'), 'success');
                    } else {
                        addToast(t('outOfStock'), 'error');
                    }
                    return; // Exit after finding the first match
                }
            }
        }
        addToast(t('productNotFound'), 'error');
    };

    return (
        <div className="pb-24 lg:pb-0">
            <div className="mb-4 lg:mb-6 flex gap-3 lg:gap-4 items-center sticky top-0 z-20 bg-slate-100 dark:bg-slate-900 py-2 -mx-2 px-2 lg:static lg:py-0 lg:mx-0 lg:px-0 lg:bg-transparent">
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('searchProducts')}
                    className="flex-grow px-4 py-2 text-sm lg:text-base text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <button
                    onClick={() => setIsScannerOpen(true)}
                    className="flex-shrink-0 p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    aria-label={t('scanBarcode')}
                    title={t('scanBarcode')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M0 4a2 2 0 0 1 2-2h4v2H2v4H0V4zm0 16v-4h2v4h4v2H2a2 2 0 0 1-2-2zM20 2h-4V0h4a2 2 0 0 1 2 2v4h-2V2zM22 20a2 2 0 0 1-2 2h-4v-2h4v-4h2v4zM3 11h18v2H3z"/>
                    </svg>
                </button>
            </div>
            {/* Changed from grid-cols-1 to grid-cols-2 on mobile (sm) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
            {isScannerOpen && (
                <BarcodeScannerModal
                    onClose={() => setIsScannerOpen(false)}
                    onScan={handleScan}
                />
            )}
        </div>
    );
};

export default ProductGrid;
