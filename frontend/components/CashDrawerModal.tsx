
import React, { useState } from 'react';
import { useCashDrawer } from '../contexts/CashDrawerContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from './Spinner';

const CashDrawerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { currentSession, openSession, closeSession, addTransaction } = useCashDrawer();
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const [amount, setAmount] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleOpenSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount === '' || !user) return;
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 600));
        openSession(Number(amount), user);
        setIsProcessing(false);
        setAmount('');
    };

    const handleTransaction = async (type: 'in' | 'out') => {
        if (amount === '' || !reason || !user) return;
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 600));
        addTransaction(type, Number(amount), reason, user);
        setIsProcessing(false);
        setAmount('');
        setReason('');
    };

    const handleCloseSession = async () => {
        const cash = prompt("Entrez le montant réel de cash en caisse :");
        if (cash !== null) {
            setIsProcessing(true);
            await new Promise(r => setTimeout(r, 600));
            closeSession(Number(cash));
            setIsProcessing(false);
            onClose();
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);

    const currentCashExpected = currentSession ? currentSession.openingCash + currentSession.transactions.reduce((acc, tx) => {
        if (tx.type === 'in' || tx.type === 'sale') return acc + tx.amount;
        if (tx.type === 'out' || tx.type === 'refund') return acc - tx.amount;
        return acc;
    }, 0) : 0;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-xl p-8 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Gestion de Caisse</h2>

                {!currentSession ? (
                    <form onSubmit={handleOpenSession} className="space-y-6">
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-4 uppercase">Ouverture de session</p>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Fonds de roulement initial</label>
                            <input 
                                type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required autoFocus
                                className="w-full px-5 py-4 bg-white dark:bg-slate-700 border-none rounded-xl text-2xl font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <button type="submit" disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white font-black uppercase rounded-2xl shadow-xl hover:bg-indigo-700 flex items-center justify-center">
                            {isProcessing ? <Spinner size="sm" /> : "Ouvrir la caisse"}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {/* KPI Caisse */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendu en Caisse</p>
                                <p className="text-2xl font-black text-indigo-600">{formatCurrency(currentCashExpected)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mouvements</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{currentSession.transactions.length}</p>
                            </div>
                        </div>

                        {/* Formulaire Transaction Rapide */}
                        <div className="p-6 border-2 border-slate-100 dark:border-slate-700 rounded-3xl space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nouveau Mouvement (Billetage)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input 
                                    type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
                                    className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold" placeholder="Montant"
                                />
                                <input 
                                    type="text" value={reason} onChange={e => setReason(e.target.value)}
                                    className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold" placeholder="Raison (ex: Café, Monnaie...)"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleTransaction('in')} disabled={isProcessing || !amount} className="py-3 bg-emerald-100 text-emerald-700 font-black rounded-xl hover:bg-emerald-200 transition-all uppercase text-[10px]">Dépôt (+)</button>
                                <button onClick={() => handleTransaction('out')} disabled={isProcessing || !amount} className="py-3 bg-rose-100 text-rose-700 font-black rounded-xl hover:bg-rose-200 transition-all uppercase text-[10px]">Retrait (-)</button>
                            </div>
                        </div>

                        {/* Transactions Récentes */}
                        <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Historique de session</p>
                             <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                {currentSession.transactions.slice(-5).reverse().map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${tx.type === 'in' || tx.type === 'sale' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{tx.reason}</span>
                                        </div>
                                        <span className={`font-black ${tx.type === 'in' || tx.type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.type === 'in' || tx.type === 'sale' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <button onClick={handleCloseSession} className="w-full py-4 border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black uppercase text-xs rounded-2xl tracking-widest">Fermer la Caisse</button>
                    </div>
                )}

                <button onClick={onClose} className="mt-4 w-full py-4 text-slate-400 font-bold uppercase text-[10px]">Annuler / Retour</button>
            </div>
        </div>
    );
};

export default CashDrawerModal;
