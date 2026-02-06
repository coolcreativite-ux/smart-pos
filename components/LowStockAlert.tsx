
import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../hooks/useLanguage';
import { useStores } from '../contexts/StoreContext';
import { Product, ProductVariant, getVariantName } from '../types';
import RestockModal from './RestockModal';

interface AlertItem {
    product: Product;
    variant: ProductVariant;
    storeId: number;
    currentStock: number;
    threshold: number;
    type: 'out-of-stock' | 'low-stock';
}

const LowStockAlert: React.FC = () => {
    const { products } = useProducts();
    const { stores } = useStores();
    const { t, language } = useLanguage();
    
    const [isLowStockVisible, setIsLowStockVisible] = useState(true);
    const [restockTarget, setRestockTarget] = useState<{ product: Product, storeId: number } | null>(null);
    
    const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);

    // Calcul des alertes par magasin
    const storeAlerts = useMemo(() => {
        const alertsByStore: Record<number, AlertItem[]> = {};

        stores.forEach(store => {
            const storeId = store.id;
            const items: AlertItem[] = [];

            products.forEach(product => {
                product.variants.forEach(variant => {
                    const stockInStore = variant.quantityByStore?.[storeId] ?? 0;
                    const threshold = product.low_stock_threshold ?? 5;

                    if (stockInStore <= 0) {
                        items.push({
                            product,
                            variant,
                            storeId,
                            currentStock: stockInStore,
                            threshold,
                            type: 'out-of-stock'
                        });
                    } else if (stockInStore <= threshold) {
                        items.push({
                            product,
                            variant,
                            storeId,
                            currentStock: stockInStore,
                            threshold,
                            type: 'low-stock'
                        });
                    }
                });
            });

            if (items.length > 0) {
                alertsByStore[storeId] = items;
            }
        });

        return alertsByStore;
    }, [products, stores]);

    const hasAlerts = Object.keys(storeAlerts).length > 0;

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat(language, {
            dateStyle: 'medium',
        }).format(new Date(dateString));
    };

    if (!isLowStockVisible || !hasAlerts) {
        return null;
    }

    return (
        <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Alertes Stock Critique</h3>
                </div>
                <button 
                    onClick={() => setIsLowStockVisible(false)}
                    className="text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors"
                >
                    Masquer
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* FIX: Explicitly cast Object.entries to allow accessing .length and .map on 'alerts' which was being inferred as unknown */}
                {(Object.entries(storeAlerts) as [string, AlertItem[]][]).map(([storeIdStr, alerts]) => {
                    const storeId = Number(storeIdStr);
                    const store = stores.find(s => s.id === storeId);
                    
                    return (
                        <div key={storeId} className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">{store?.name}</span>
                                </div>
                                <span className="px-2 py-1 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase">{alerts.length} alertes</span>
                            </div>
                            
                            <div className="p-4 space-y-3">
                                {alerts.map((alert, idx) => (
                                    <div key={`${alert.product.id}-${alert.variant.id}-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <img src={alert.product.imageUrl} alt="" className="w-10 h-10 object-cover rounded-xl shadow-sm" />
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight">{alert.product.name}</p>
                                                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-tighter">{getVariantName(alert.variant)}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-black uppercase ${alert.type === 'out-of-stock' ? 'text-rose-500' : 'text-amber-500'}`}>
                                                        Stock: {alert.currentStock}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">/ Seuil: {alert.threshold}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setRestockTarget({ product: alert.product, storeId: alert.storeId })}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                                        >
                                            {t('restock')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {restockTarget && (
                <RestockModal 
                    product={restockTarget.product} 
                    onClose={() => setRestockTarget(null)} 
                    targetStoreId={restockTarget.storeId}
                />
            )}
        </div>
    );
};

export default LowStockAlert;
