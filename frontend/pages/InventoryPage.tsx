
import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../hooks/useLanguage';
import { useStores } from '../contexts/StoreContext';
import { Product, ProductVariant, getVariantName, StockChangeReason } from '../types';
import RestockModal from '../components/RestockModal';
import StockTransferModal from '../components/StockTransferModal';
import StockHistoryModal from '../components/StockHistoryModal';
import InventoryAdjustmentModal from '../components/InventoryAdjustmentModal';

const InventoryPage: React.FC = () => {
    const { products } = useProducts();
    const { stores, currentStore, setCurrentStore } = useStores();
    const { t } = useLanguage();
    
    const [selectedStoreId, setSelectedStoreId] = useState<number | 'all'>(() => {
        // Si l'utilisateur n'a accès qu'à un seul magasin, l'utiliser par défaut
        if (stores.length === 1) {
            return stores[0].id;
        }
        return currentStore?.id || 'all';
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [productToRestock, setProductToRestock] = useState<Product | null>(null);
    const [productToTransfer, setProductToTransfer] = useState<Product | null>(null);
    const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
    const [historyData, setHistoryData] = useState<{ productName: string, variant: ProductVariant } | null>(null);

    // Ajuster automatiquement le magasin sélectionné selon les permissions et le contexte global
    useEffect(() => {
        if (stores.length === 1) {
            setSelectedStoreId(stores[0].id);
        } else if (stores.length > 1 && currentStore) {
            // Synchroniser avec le magasin sélectionné dans l'en-tête
            setSelectedStoreId(currentStore.id);
        }
    }, [stores, currentStore]);

    // Synchroniser le contexte global quand on change le magasin dans cette page
    const handleStoreChange = (storeId: number | 'all') => {
        setSelectedStoreId(storeId);
        if (storeId !== 'all' && typeof storeId === 'number') {
            const store = stores.find(s => s.id === storeId);
            if (store) {
                setCurrentStore(store);
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
    };

    const inventoryData = useMemo(() => {
        const rows: any[] = [];
        let totalValue = 0;
        let totalCost = 0;
        let totalItems = 0;

        products.forEach(product => {
            product.variants.forEach(variant => {
                const stockInStore = selectedStoreId === 'all' 
                    ? (Object.values(variant.quantityByStore || {}) as number[]).reduce((a, b) => a + b, 0)
                    : (variant.quantityByStore?.[selectedStoreId] || 0);
                
                // Calcul du stock initial pour le magasin sélectionné
                let initialStock = 0;
                if (selectedStoreId === 'all') {
                    // Pour "tous les magasins", on additionne les premières entrées "Initial" de chaque magasin
                    const initialEntriesByStore: Record<number, number> = {};
                    [...(variant.stock_history || [])].reverse().forEach(h => {
                        if (h.reason === StockChangeReason.Initial && h.storeId !== undefined) {
                            if (!initialEntriesByStore[h.storeId]) initialEntriesByStore[h.storeId] = h.change;
                        }
                    });
                    initialStock = Object.values(initialEntriesByStore).reduce((a, b) => a + b, 0);
                    // Si aucune entrée historique n'est trouvée, on prend le plus vieux stock connu
                    if (initialStock === 0 && variant.stock_history && variant.stock_history.length > 0) {
                        initialStock = variant.stock_history[variant.stock_history.length - 1].newStock - variant.stock_history[variant.stock_history.length - 1].change;
                    }
                } else {
                    const initialEntry = [...(variant.stock_history || [])].reverse().find(h => 
                        h.reason === StockChangeReason.Initial && h.storeId === selectedStoreId
                    );
                    if (initialEntry) {
                        initialStock = initialEntry.change;
                    } else if (variant.stock_history) {
                        const storeEntries = variant.stock_history.filter(h => h.storeId === selectedStoreId);
                        if (storeEntries.length > 0) {
                            initialStock = storeEntries[storeEntries.length - 1].newStock - storeEntries[storeEntries.length - 1].change;
                        }
                    }
                }

                const query = searchTerm.toLowerCase();
                const matchesSearch = !searchTerm || 
                    product.name.toLowerCase().includes(query) || 
                    variant.sku?.toLowerCase().includes(query) || 
                    variant.barcode?.toLowerCase().includes(query);

                if (!matchesSearch) return;

                totalItems += stockInStore;
                totalValue += stockInStore * variant.price;
                totalCost += stockInStore * (variant.costPrice || 0);

                const margin = variant.price > 0 ? ((variant.price - (variant.costPrice || 0)) / variant.price) * 100 : 0;

                rows.push({
                    productId: product.id,
                    productName: product.name,
                    variantName: getVariantName(variant),
                    sku: variant.sku || '-',
                    price: variant.price,
                    cost: variant.costPrice || 0,
                    stock: stockInStore,
                    initialStock: initialStock,
                    threshold: product.low_stock_threshold || 5,
                    value: stockInStore * variant.price,
                    potentialProfit: stockInStore * (variant.price - (variant.costPrice || 0)),
                    margin: margin.toFixed(1),
                    product: product,
                    variant: variant
                });
            });
        });

        return { rows, totalValue, totalCost, totalItems };
    }, [products, selectedStoreId, searchTerm]);

    const getStatusBadge = (stock: number, threshold: number) => {
        if (stock <= 0) return { text: t('outOfStock'), className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
        if (stock <= threshold) return { text: t('warning'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
        return { text: t('healthy'), className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('inventoryAudit')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analyse financière et gestion des actifs.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Afficher le filtre des magasins seulement s'il y a plus d'un magasin */}
                    {stores.length > 1 && (
                        <select 
                            value={selectedStoreId} 
                            onChange={(e) => {
                                const newStoreId = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                handleStoreChange(newStoreId);
                            }}
                            className="flex-grow lg:flex-grow-0 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm shadow-sm"
                        >
                            <option value="all">{t('allStores')}</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    <input 
                        type="text" 
                        placeholder="Nom, SKU ou code-barres..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow lg:w-80 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{t('inventoryValue')} (PV)</p>
                    <p className="text-2xl font-black">{formatCurrency(inventoryData.totalValue)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('costValue')} (PA)</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(inventoryData.totalCost)}</p>
                </div>
                <div className="bg-emerald-500 p-6 rounded-3xl shadow-xl text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{t('potentialProfit')}</p>
                    <p className="text-2xl font-black">{formatCurrency(inventoryData.totalValue - inventoryData.totalCost)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Marge Globale</p>
                    <p className="text-2xl font-black text-indigo-600">
                        {inventoryData.totalValue > 0 ? (((inventoryData.totalValue - inventoryData.totalCost) / inventoryData.totalValue) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase font-black tracking-widest bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">{t('productName')}</th>
                                <th className="px-6 py-4 text-center">S. Initial</th>
                                <th className="px-6 py-4 text-center">{t('stock')}</th>
                                <th className="px-6 py-4 text-center">{t('costPrice')}</th>
                                <th className="px-6 py-4 text-center">{t('price')}</th>
                                <th className="px-6 py-4 text-center">{t('margin')} %</th>
                                <th className="px-6 py-4 text-right">{t('profitValue')}</th>
                                <th className="px-6 py-4 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {inventoryData.rows.map((row, idx) => {
                                const status = getStatusBadge(row.stock, row.threshold);
                                return (
                                    <tr key={`${row.productId}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{row.productName}</p>
                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black">{row.variantName}</p>
                                            <p className="text-[9px] text-slate-400 mt-1">SKU: {row.sku} {row.variant?.barcode ? `| CB: ${row.variant.barcode}` : ''}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-400 font-bold">{row.initialStock}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-slate-900 dark:text-white text-base">{row.stock}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${status.className}`}>
                                                    {status.text}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">{formatCurrency(row.cost)}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">{formatCurrency(row.price)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-black ${Number(row.margin) > 40 ? 'text-emerald-500' : 'text-indigo-600'}`}>{row.margin}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            {formatCurrency(row.potentialProfit)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button 
                                                    onClick={() => setHistoryData({ productName: row.productName, variant: row.variant })}
                                                    className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title={t('stockHistory')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => setProductToAdjust(row.product)}
                                                    className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                                    title="Inventaire Physique"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => setProductToTransfer(row.product)}
                                                    className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title={t('stockTransfer')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => setProductToRestock(row.product)}
                                                    className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title={t('restock')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {productToRestock && (
                <RestockModal 
                    product={productToRestock} 
                    onClose={() => setProductToRestock(null)} 
                    targetStoreId={selectedStoreId === 'all' ? (currentStore?.id || 1) : selectedStoreId}
                />
            )}

            {productToTransfer && (
                <StockTransferModal
                    product={productToTransfer}
                    onClose={() => setProductToTransfer(null)}
                    initialSourceStoreId={selectedStoreId}
                />
            )}

            {productToAdjust && (
                <InventoryAdjustmentModal
                    product={productToAdjust}
                    onClose={() => setProductToAdjust(null)}
                    targetStoreId={selectedStoreId === 'all' ? (currentStore?.id || 1) : selectedStoreId}
                />
            )}

            {historyData && (
                <StockHistoryModal 
                    productName={historyData.productName} 
                    variant={historyData.variant} 
                    onClose={() => setHistoryData(null)} 
                />
            )}
        </div>
    );
};

export default InventoryPage;
