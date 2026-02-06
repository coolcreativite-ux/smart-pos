
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useStores } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSuppliers } from '../contexts/SupplierContext';
import { PurchaseOrder, PurchaseOrderItem, StockChangeReason, getVariantName, Product, ProductVariant } from '../types';
import Spinner from '../components/Spinner';

const PurchaseOrderPage: React.FC = () => {
    const { t, language } = useLanguage();
    const { products, updateVariantStock } = useProducts();
    const { currentStore } = useStores();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { suppliers } = useSuppliers();

    const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
        const saved = localStorage.getItem('purchaseOrders');
        return saved ? JSON.parse(saved).map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })) : [];
    });

    const [isCreating, setIsCreating] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState<number>(suppliers[0]?.id || 0);
    const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // States for product search
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveOrders = (newOrders: PurchaseOrder[]) => {
        setOrders(newOrders);
        localStorage.setItem('purchaseOrders', JSON.stringify(newOrders));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
    };

    const handleAddItem = (productId: number, variantId: number) => {
        const product = products.find(p => p.id === productId);
        const variant = product?.variants.find(v => v.id === variantId);
        if (!product || !variant) return;

        setOrderItems(prev => {
            const exists = prev.find(i => i.variantId === variantId);
            if (exists) return prev.map(i => i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, {
                productId,
                variantId,
                productName: product.name,
                variantName: getVariantName(variant),
                quantity: 1,
                costPrice: variant.costPrice || 0
            }];
        });
        
        setSearchTerm('');
        setShowResults(false);
    };

    const handleCreateOrder = () => {
        if (orderItems.length === 0 || !currentStore || !selectedSupplierId) {
            addToast("Sélectionnez un fournisseur et des articles", "error");
            return;
        }

        const newOrder: PurchaseOrder = {
            id: `PO-${Date.now()}`,
            // Add missing tenantId
            tenantId: user?.tenantId || 0,
            supplierId: selectedSupplierId,
            storeId: currentStore.id,
            items: orderItems,
            status: 'ordered',
            createdAt: new Date(),
            totalAmount: orderItems.reduce((acc, i) => acc + (i.quantity * i.costPrice), 0)
        };

        saveOrders([newOrder, ...orders]);
        setIsCreating(false);
        setOrderItems([]);
        addToast("Bon de commande envoyé", "success");
    };

    const handleReceiveOrder = async (orderId: string) => {
        if (!user) return;
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 1000));

        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.items.forEach(item => {
                updateVariantStock(
                    item.productId, 
                    item.variantId, 
                    item.quantity, 
                    StockChangeReason.PurchaseOrder, 
                    user, 
                    `Réception BC: ${order.id}`,
                    order.storeId
                );
            });

            const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'received' as const, receivedAt: new Date() } : o);
            saveOrders(updatedOrders);
            addToast("Stock mis à jour avec succès", "success");
        }
        setIsProcessing(false);
    };

    const filteredProductResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const query = searchTerm.toLowerCase();
        const results: { product: Product, variant: ProductVariant }[] = [];
        
        products.forEach(p => {
            p.variants.forEach(v => {
                const matches = p.name.toLowerCase().includes(query) || 
                                (v.sku && v.sku.toLowerCase().includes(query)) ||
                                (v.barcode && v.barcode.toLowerCase().includes(query));
                if (matches) {
                    results.push({ product: p, variant: v });
                }
            });
        });
        
        return results.slice(0, 10); // Limit to 10 results for performance
    }, [searchTerm, products]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('purchaseOrders')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos approvisionnements fournisseurs.</p>
                </div>
                <button 
                    onClick={() => {
                        if (suppliers.length === 0) {
                            addToast("Ajoutez d'abord un fournisseur dans l'onglet dédié.", "error");
                            return;
                        }
                        setIsCreating(true);
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
                >
                    {t('addPurchaseOrder')}
                </button>
            </div>

            {isCreating ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30">
                    <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Nouveau Bon de Commande</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">{t('selectSupplier')}</label>
                            <select 
                                value={selectedSupplierId} 
                                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl font-bold"
                            >
                                <option value="0">Choisir un fournisseur...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="relative" ref={searchRef}>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Rechercher un article</label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="Nom, SKU ou code-barres..."
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl font-bold pr-12 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && filteredProductResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden max-h-72 overflow-y-auto">
                                    {filteredProductResults.map(({ product, variant }) => (
                                        <button
                                            key={`${product.id}-${variant.id}`}
                                            onClick={() => handleAddItem(product.id, variant.id)}
                                            className="w-full text-left p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-b border-slate-50 dark:border-slate-700/50 last:border-none transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm uppercase">{product.name}</p>
                                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-tighter">
                                                        {getVariantName(variant)} 
                                                        {variant.sku ? ` • SKU: ${variant.sku}` : ''}
                                                        {variant.barcode ? ` • CB: ${variant.barcode}` : ''}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(variant.costPrice || 0)}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">PA Unitaire</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showResults && searchTerm.trim() !== '' && filteredProductResults.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 p-6 text-center text-slate-400 italic text-sm">
                                    Aucun produit trouvé pour "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-3xl mb-8">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Article</th>
                                    <th className="px-6 py-4 text-center">Quantité</th>
                                    <th className="px-6 py-4 text-right">Prix d'Achat</th>
                                    <th className="px-6 py-4 text-right">Sous-total</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {orderItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 font-bold">{item.productName} <span className="text-[10px] block text-slate-400 uppercase">{item.variantName}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="number" value={item.quantity} 
                                                onChange={(e) => setOrderItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it))}
                                                className="w-16 text-center bg-slate-100 dark:bg-slate-700 rounded-lg py-1 font-black"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.costPrice)}</td>
                                        <td className="px-6 py-4 text-right font-black">{formatCurrency(item.quantity * item.costPrice)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setOrderItems(prev => prev.filter((_, i) => i !== idx))} className="text-rose-500 hover:scale-110 transition-transform">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400">Total Commande</p>
                            <p className="text-3xl font-black text-indigo-600">{formatCurrency(orderItems.reduce((acc, i) => acc + (i.quantity * i.costPrice), 0))}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsCreating(false); setOrderItems([]); setSearchTerm(''); }} className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-xs">Annuler</button>
                            <button onClick={handleCreateOrder} disabled={orderItems.length === 0} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20">Envoyer le Bon</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {orders.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 p-20 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-400 font-bold italic">Aucun bon de commande en cours.</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                                        BC
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-black text-slate-900 dark:text-white uppercase">{order.id}</span>
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                                order.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {t(order.status)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-500">{suppliers.find(s => s.id === order.supplierId)?.name || 'Inconnu'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{new Intl.DateTimeFormat(language).format(order.createdAt)} • {order.items.length} articles</p>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col md:items-end gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Montant Total</p>
                                        <p className="text-2xl font-black text-indigo-600">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                    {order.status === 'ordered' && (
                                        <button 
                                            onClick={() => handleReceiveOrder(order.id)}
                                            disabled={isProcessing}
                                            className="px-6 py-2.5 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                                        >
                                            {isProcessing && <Spinner size="sm" />}
                                            {t('markAsReceived')}
                                        </button>
                                    )}
                                    {order.status === 'received' && (
                                        <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            Stock Injecté le {new Intl.DateTimeFormat(language).format(order.receivedAt || new Date())}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderPage;
