
import React, { useState, useMemo } from 'react';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useLanguage } from '../hooks/useLanguage';
import { useCustomers } from '../hooks/useCustomers';
import { useAuth } from '../contexts/AuthContext';
import { useCashDrawer } from '../contexts/CashDrawerContext';
import { useToast } from '../contexts/ToastContext';
import { useStores } from '../contexts/StoreContext';
import { Sale, Installment, getVariantName } from '../types';
import Spinner from '../components/Spinner';

const DebtManagementPage: React.FC = () => {
    const { sales, addInstallmentToSale } = useSalesHistory();
    const { customers } = useCustomers();
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { recordSale } = useCashDrawer();
    const { addToast } = useToast();
    const { stores, currentStore } = useStores();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState<number | 'all'>(() => {
        // Par défaut, filtrer par le magasin actuel
        return currentStore?.id || 'all';
    });
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [installmentAmount, setInstallmentAmount] = useState<number | ''>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const creditSales = useMemo(() => {
        let filtered = sales.filter(s => s.isCredit && (s.total - s.totalPaid > 0.01));
        
        // Filtrer par magasin si un magasin spécifique est sélectionné
        if (selectedStoreId !== 'all') {
            filtered = filtered.filter(s => s.storeId === selectedStoreId);
        }
        
        return filtered;
    }, [sales, selectedStoreId]);

    const filteredDebts = useMemo(() => {
        if (!searchTerm) return creditSales;
        const query = searchTerm.toLowerCase();
        return creditSales.filter(s => {
            const customer = customers.find(c => c.id === s.customerId);
            const customerName = customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
            return s.id.toLowerCase().includes(query) || customerName.includes(query);
        });
    }, [creditSales, customers, searchTerm]);

    const getStoreName = (storeId?: number) => {
        if (!storeId) return 'Magasin inconnu';
        return stores.find(s => s.id === storeId)?.name || 'Magasin inconnu';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
    };

    const handleAddInstallment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSale || !user || !installmentAmount || Number(installmentAmount) <= 0) return;

        const amount = Number(installmentAmount);
        const remaining = selectedSale.total - selectedSale.totalPaid;

        if (amount > remaining + 0.01) {
            addToast("Le montant dépasse le reste à payer.", "error");
            return;
        }

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 800));

        const installment: Installment = {
            id: `inst_${Date.now()}`,
            timestamp: new Date(),
            amount,
            method: 'cash',
            userId: user.id,
            username: user.username
        };

        addInstallmentToSale(selectedSale.id, installment);
        recordSale(amount, user);
        addToast(t('installmentSuccess'), 'success');
        
        setIsProcessing(false);
        setInstallmentAmount('');
        setSelectedSale(null);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('debtManagement')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des paiements échelonnés et créances.</p>
                    {selectedStoreId !== 'all' && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Dettes du magasin : <span className="font-bold text-indigo-600 dark:text-indigo-400">{getStoreName(selectedStoreId)}</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {/* Sélecteur de magasin */}
                    {stores.length > 1 && (
                        <select
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">Tous les magasins</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    )}
                    <input 
                        type="text" 
                        placeholder="Chercher par client ou ID vente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full lg:w-80 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-rose-600 p-6 rounded-3xl shadow-xl text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{t('totalDebt')}</p>
                    <p className="text-3xl font-black">{formatCurrency(creditSales.reduce((acc, s) => acc + (s.total - s.totalPaid), 0))}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Dossiers en cours</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{creditSales.length}</p>
                </div>
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Articles Réservés</p>
                    <p className="text-3xl font-black">{creditSales.filter(s => s.itemStatus === 'reserved').length}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase font-black tracking-widest bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Client / Vente</th>
                                <th className="px-6 py-4 text-center">Magasin</th>
                                <th className="px-6 py-4 text-center">Statut Items</th>
                                <th className="px-6 py-4 text-center">Total Vente</th>
                                <th className="px-6 py-4 text-center">{t('amountPaid')}</th>
                                <th className="px-6 py-4 text-center">{t('remainingBalance')}</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-medium">
                            {filteredDebts.length > 0 ? filteredDebts.map(sale => {
                                const customer = customers.find(c => c.id === sale.customerId);
                                const remaining = sale.total - sale.totalPaid;
                                return (
                                    <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                                {customer ? `${customer.firstName} ${customer.lastName}` : 'Anonyme'}
                                            </p>
                                            <p className="text-[10px] text-indigo-600 font-black">ID: #{sale.id.slice(-8).toUpperCase()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                                                {getStoreName(sale.storeId)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                                sale.itemStatus === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {t(sale.itemStatus === 'reserved' ? 'statusReserved' : 'statusTaken')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-400">{formatCurrency(sale.total)}</td>
                                        <td className="px-6 py-4 text-center font-bold text-emerald-600">{formatCurrency(sale.totalPaid)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="font-black text-rose-600 text-base">{formatCurrency(remaining)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedSale(sale)}
                                                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            >
                                                Versement
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold italic">{t('noDebts')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSale && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setSelectedSale(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Nouvel Encaissement</h2>
                        <p className="text-sm font-bold text-indigo-600 mb-6 uppercase">Vente #{selectedSale.id.slice(-8).toUpperCase()}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Déjà Payé</p>
                                <p className="text-lg font-black text-emerald-600">{formatCurrency(selectedSale.totalPaid)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reste à payer</p>
                                <p className="text-lg font-black text-rose-600">{formatCurrency(selectedSale.total - selectedSale.totalPaid)}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddInstallment} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">{t('installmentAmount')}</label>
                                <input 
                                    type="number" 
                                    value={installmentAmount} 
                                    onChange={(e) => setInstallmentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                    required 
                                    autoFocus
                                    className="w-full px-5 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800 rounded-2xl text-2xl font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelectedSale(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px]">Annuler</button>
                                <button 
                                    type="submit" 
                                    disabled={isProcessing || !installmentAmount}
                                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessing && <Spinner size="sm" />}
                                    Valider Versement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtManagementPage;
