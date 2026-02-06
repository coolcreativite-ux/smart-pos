
import React, { useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../hooks/useLanguage';
import { useStores } from '../contexts/StoreContext';

interface SuspendedOrdersModalProps {
    onClose: () => void;
}

const SuspendedOrdersModal: React.FC<SuspendedOrdersModalProps> = ({ onClose }) => {
    const { suspendedOrders, resumeOrder, deleteSuspendedOrder } = useCart();
    const { t, language } = useLanguage();
    const { currentStore, stores } = useStores();

    // Filtrer les commandes suspendues par magasin actuel
    const filteredOrders = useMemo(() => {
        if (!currentStore) return suspendedOrders;
        return suspendedOrders.filter(order => order.storeId === currentStore.id);
    }, [suspendedOrders, currentStore]);

    const getStoreName = (storeId?: number) => {
        if (!storeId) return 'Magasin inconnu';
        return stores.find(s => s.id === storeId)?.name || 'Magasin inconnu';
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(language, { timeStyle: 'short', dateStyle: 'short' }).format(new Date(date));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Commandes en attente</h2>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {filteredOrders.length === 0 ? (
                        <p className="text-center text-slate-400 py-10 font-bold italic">Aucune commande suspendue pour ce magasin.</p>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                                <div>
                                    <p className="text-sm font-black text-indigo-600 uppercase tracking-tighter">{order.label}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{formatDate(order.timestamp)} • {order.items.length} articles</p>
                                    <p className="text-[9px] text-slate-500 font-bold">{getStoreName(order.storeId)}</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{formatCurrency(order.items.reduce((a,b) => a + (b.variant.price * b.quantity), 0))}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { deleteSuspendedOrder(order.id); }} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                    <button onClick={() => { resumeOrder(order.id); onClose(); }} className="px-5 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                                        Reprendre
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button onClick={onClose} className="mt-8 w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white text-xs font-black uppercase rounded-2xl tracking-widest">Fermer</button>
            </div>
        </div>
    );
};

export default SuspendedOrdersModal;
