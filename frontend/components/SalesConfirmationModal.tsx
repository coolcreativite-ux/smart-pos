
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { CartItem } from '../types';
import Spinner from './Spinner';

interface SalesConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  loyaltyDiscount: number;
  promoCode?: string;
}

const SalesConfirmationModal: React.FC<SalesConfirmationModalProps> = ({ isOpen, onClose, onConfirm, cartItems, subtotal, tax, total, discount, loyaltyDiscount, promoCode }) => {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    if (typeof amountReceived === 'number') {
        setChange(amountReceived - total);
    } else {
        setChange(-total);
    }
  }, [amountReceived, total]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    onConfirm();
  };

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 text-center uppercase tracking-tight">
          {t('confirmSale')}
        </h2>

        {/* Recap Minimaliste */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-8">
            <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{t('total')}</span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
                {cartItems.length} articles au total.
            </div>
        </div>

        {/* Calculatrice de rendu */}
        <div className="space-y-6">
            <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">{t('amountReceived')}</label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Ex: 10000"
                        className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-700 border-none rounded-2xl text-2xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">FCFA</div>
                </div>
            </div>

            {/* Boutons de raccourcis */}
            <div className="grid grid-cols-3 gap-3">
                {[2000, 5000, 10000].map(amt => (
                    <button 
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAmount(amt)}
                        className="py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm font-black hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
                    >
                        {amt.toLocaleString()}
                    </button>
                ))}
            </div>

            {/* Rendu de monnaie */}
            <div className={`p-5 rounded-2xl flex justify-between items-center transition-colors ${change >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-900/20'}`}>
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{t('changeToReturn')}</span>
                <span className={`text-2xl font-black ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {change >= 0 ? formatCurrency(change) : '--'}
                </span>
            </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
                onClick={onClose} 
                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
            >
                {t('cancel')}
            </button>
            <button 
                onClick={handleConfirm}
                disabled={isProcessing || (typeof amountReceived === 'number' && amountReceived < total)}
                className="w-full px-6 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:shadow-none flex items-center justify-center"
            >
                {isProcessing && <Spinner size="sm" className="mr-2" />}
                {t('confirmAndPay')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SalesConfirmationModal;
