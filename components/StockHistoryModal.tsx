
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ProductVariant, getVariantName, StockChangeReason, StockHistoryEntry } from '../types';
import { useStores } from '../contexts/StoreContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface StockHistoryModalProps {
  productName: string;
  variant: ProductVariant;
  onClose: () => void;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ productName, variant, onClose }) => {
  const { t, language } = useLanguage();
  const { stores, currentStore } = useStores();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | 'all'>(() => {
    // Par défaut, filtrer par le magasin actuel
    return currentStore?.id || 'all';
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  const getStoreName = (storeId?: number) => {
      if (!storeId) return '-';
      const store = stores.find(s => s.id === storeId);
      return store ? store.name : `ID: ${storeId}`;
  };

  const history = useMemo(() => {
    return [...(variant.stock_history || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [variant.stock_history]);

  const filteredHistory = useMemo(() => {
    let filtered = [...history].reverse();
    
    // Filtrer par magasin si un magasin spécifique est sélectionné
    if (selectedStoreId !== 'all') {
      filtered = filtered.filter(entry => entry.storeId === selectedStoreId);
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.notes?.toLowerCase().includes(query) || 
        entry.username?.toLowerCase().includes(query) ||
        getStoreName(entry.storeId).toLowerCase().includes(query) ||
        t(entry.reason).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [history, searchTerm, selectedStoreId, t, stores]);

  // Data for the chart
  const chartData = useMemo(() => {
    return history.map(entry => ({
      time: new Date(entry.timestamp).toLocaleDateString(language, { day: '2-digit', month: '2-digit' }),
      stock: entry.newStock,
      fullDate: formatDate(entry.timestamp)
    }));
  }, [history, language]);

  const stats = useMemo(() => {
    const totalAdded = history.reduce((acc, curr) => curr.change > 0 ? acc + curr.change : acc, 0);
    const totalRemoved = history.reduce((acc, curr) => curr.change < 0 ? acc + Math.abs(curr.change) : acc, 0);
    return { totalAdded, totalRemoved };
  }, [history]);

  const getReasonBadge = (reason: StockChangeReason | string) => {
    switch (reason) {
      case StockChangeReason.Initial:
      case StockChangeReason.Restock:
      case StockChangeReason.Return:
      case StockChangeReason.TransferIn:
      case StockChangeReason.PurchaseOrder:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case StockChangeReason.Sale:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
      case StockChangeReason.Damage:
      case StockChangeReason.Loss:
      case StockChangeReason.TransferOut:
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      case StockChangeReason.Correction:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-6xl p-0 relative flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Historique de Stock
              </h2>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
                {productName} <span className="text-slate-400 mx-2">/</span> {getVariantName(variant)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full transition-all hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-8">
          {/* Top Summary Widgets & Chart */}
          {history.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Stats column */}
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stock Actuel</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {currentStore ? (variant.quantityByStore?.[currentStore.id] || 0) : variant.stock_quantity}
                  </p>
                  {currentStore && (
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{currentStore.name}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">+{stats.totalAdded}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">-{stats.totalRemoved}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Volume Total</span>
                  </div>
                </div>
                
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Valeur Stockée</p>
                  <p className="text-2xl font-black">
                    {formatCurrency((currentStore ? (variant.quantityByStore?.[currentStore.id] || 0) : variant.stock_quantity) * variant.price)}
                  </p>
                  <p className="text-[10px] font-bold opacity-60 mt-2 italic">Basé sur le prix de vente actuel</p>
                </div>
              </div>

              {/* Chart column */}
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Évolution des niveaux</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={180}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: '#1e293b', color: '#fff' }} 
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Area type="monotone" dataKey="stock" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}

          {/* Search & Table Section */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Journal des mouvements</h3>
              <div className="flex items-center gap-3">
                {/* Sélecteur de magasin */}
                {stores.length > 1 && (
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="all">Tous les magasins</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                )}
                <div className="relative w-full md:w-80">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par note, magasin, utilisateur..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                {filteredHistory.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase font-black tracking-widest bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Date & Heure</th>
                        <th className="px-6 py-4">Magasin</th>
                        <th className="px-6 py-4">Utilisateur</th>
                        <th className="px-6 py-4">Motif</th>
                        <th className="px-6 py-4">Détails / Notes</th>
                        <th className="px-6 py-4 text-center">Mouv.</th>
                        <th className="px-6 py-4 text-right">Nouveau Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {filteredHistory.map((entry, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">{formatDate(entry.timestamp)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{getStoreName(entry.storeId)}</span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{entry.username || 'Système'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${getReasonBadge(entry.reason)}`}>
                                {t(entry.reason)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 italic max-w-[200px] truncate" title={entry.notes}>{entry.notes || '-'}</td>
                          <td className={`px-6 py-4 text-center font-black ${entry.change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {entry.change > 0 ? `+${entry.change}` : entry.change}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">{entry.newStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-bold italic">Aucun mouvement enregistré.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fin de l'historique disponible</p>
          <button onClick={onClose} className="px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95">Fermer</button>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;
