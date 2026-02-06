
import React, { useState, useEffect } from 'react';
import { Product, StockChangeReason, getVariantName } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';
import { useAuth } from '../contexts/AuthContext';

interface InventoryAdjustmentModalProps {
  product: Product;
  onClose: () => void;
  targetStoreId?: number;
}

const InventoryAdjustmentModal: React.FC<InventoryAdjustmentModalProps> = ({ product, onClose, targetStoreId }) => {
  const { t } = useLanguage();
  const { setVariantStock } = useProducts();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [selectedVariantId, setSelectedVariantId] = useState<number>(product.variants[0]?.id || 0);
  const [actualQuantity, setActualQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
  const currentStock = selectedVariant?.quantityByStore?.[targetStoreId || 1] || 0;
  const difference = actualQuantity !== '' ? actualQuantity - currentStock : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !user || actualQuantity === '') return;

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    setVariantStock(
        product.id, 
        selectedVariantId, 
        Number(actualQuantity), 
        StockChangeReason.Correction, 
        user, 
        notes || `Ajustement d'inventaire (Écart: ${difference > 0 ? '+' : ''}${difference})`,
        targetStoreId
    );
    
    addToast("Inventaire mis à jour", "success");
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Inventaire Physique</h2>
        </div>
        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-6 uppercase tracking-widest">{product.name}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">{t('selectVariant')}</label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {product.variants.map(v => (
                <option key={v.id} value={v.id}>{getVariantName(v)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Stock Système</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{currentStock}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${difference === 0 ? 'bg-slate-50 border-slate-100' : (difference > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100')} dark:bg-opacity-10 transition-colors`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Écart</p>
                  <p className={`text-xl font-black ${difference === 0 ? 'text-slate-900' : (difference > 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
                      {difference > 0 ? '+' : ''}{difference}
                  </p>
              </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Quantité Réelle Comptée</label>
            <input
              type="number"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              required
              autoFocus
              placeholder="0"
              className="w-full px-5 py-5 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800 rounded-2xl text-3xl font-black text-indigo-600 dark:text-indigo-400 text-center focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">{t('notes')}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Casse, erreur de saisie..."
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-700 border-none rounded-2xl text-sm font-bold"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Annuler</button>
            <button 
                type="submit" 
                disabled={isSaving || actualQuantity === ''} 
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {isSaving && <Spinner size="sm" />}
              Valider l'Inventaire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryAdjustmentModal;
