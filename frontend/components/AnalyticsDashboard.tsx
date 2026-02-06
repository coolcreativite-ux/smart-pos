
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { getSalesInsights } from '../services/geminiService';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { Sale, CartItem, getVariantName, Store } from '../types';
import Spinner from './Spinner';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useCustomers } from '../hooks/useCustomers';
import { useStores } from '../contexts/StoreContext';
import { useSettings } from '../contexts/SettingsContext';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const AnalyticsDashboard: React.FC = () => {
    const { sales } = useSalesHistory();
    const { customers } = useCustomers();
    const { stores, currentStore } = useStores();
    const { settings } = useSettings();
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    
    const getMonthRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    const [dateRange, setDateRange] = useState(getMonthRange());
    const [activeRange, setActiveRange] = useState<'week' | 'month' | 'custom'>('month');

    const handleSetThisWeek = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        setDateRange({ start, end });
        setActiveRange('week');
    };

    const handleSetThisMonth = () => {
        setDateRange(getMonthRange());
        setActiveRange('month');
    };

    const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setActiveRange('custom');
        const { name, value } = e.target;
        if (!value) return;
        
        const [year, month, day] = value.split('-').map(Number);
        const newDate = new Date(year, month - 1, day);

        setDateRange(prev => {
            const updatedRange = { ...prev, [name]: newDate };
            if (name === 'end') {
                updatedRange.end.setHours(23, 59, 59, 999);
            } else {
                updatedRange.start.setHours(0, 0, 0, 0);
            }
            return updatedRange;
        });
    };

    const filteredSales = useMemo(() => {
        let filtered = sales;
        
        // Filtrer par date
        if (dateRange.start && dateRange.end) {
            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.timestamp);
                return saleDate >= dateRange.start && saleDate <= dateRange.end;
            });
        }
        
        // Toujours filtrer par magasin si un magasin spécifique est sélectionné
        if (currentStore) {
            filtered = filtered.filter(sale => sale.storeId === currentStore.id);
        }
        
        return filtered;
    }, [sales, dateRange, currentStore]);

    const totalSalesValue = useMemo(() => filteredSales.reduce((sum, sale) => sum + sale.total, 0), [filteredSales]);
    const avgOrderValue = useMemo(() => filteredSales.length > 0 ? totalSalesValue / filteredSales.length : 0, [filteredSales, totalSalesValue]);

    const salesByProduct = useMemo(() => {
        const data: {[key: string]: number} = {};
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const key = `${item.productName}`;
                if(!data[key]) data[key] = 0;
                data[key] += item.quantity;
            });
        });
        return Object.entries(data).map(([name, quantity]) => ({name, quantity})).sort((a,b) => b.quantity - a.quantity).slice(0, 8);
    }, [filteredSales]);

    const salesByCategory = useMemo(() => {
        const data: {[key: string]: number} = {};
        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const key_cat = item.productName.includes('T-Shirt') ? 'Vêtements' : 
                                item.productName.includes('Portefeuille') ? 'Accessoires' :
                                item.productName.includes('Bougie') ? 'Maison' : 'Papeterie';
                
                if(!data[key_cat]) data[key_cat] = 0;
                data[key_cat] += item.variant.price * item.quantity;
            });
        });
        return Object.entries(data).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);
    }, [filteredSales]);

    const salesByStore = useMemo(() => {
        const data: {[key: string]: number} = {};
        filteredSales.forEach(sale => {
            const store = stores.find(s => s.id === sale.storeId);
            const key = store ? store.name : 'Inconnu';
            if(!data[key]) data[key] = 0;
            data[key] += sale.total;
        });
        return Object.entries(data).map(([name, total]) => ({name, total})).sort((a,b) => b.total - a.total);
    }, [filteredSales, stores]);

    const dailyStoreTrend = useMemo(() => {
        const data: { [key: string]: { [storeName: string]: number } } = {};
        const storeNames = stores.map(s => s.name);
        
        if (dateRange.start && dateRange.end) {
            const current = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            while (current <= end) {
                const key = current.toISOString().split('T')[0];
                data[key] = {};
                storeNames.forEach(name => data[key][name] = 0);
                current.setDate(current.getDate() + 1);
            }
        }
        
        filteredSales.forEach(sale => {
            const key = sale.timestamp.toISOString().split('T')[0];
            const store = stores.find(s => s.id === sale.storeId);
            const storeName = store ? store.name : 'Inconnu';
            if (data[key]) {
                if (!data[key][storeName]) data[key][storeName] = 0;
                data[key][storeName] += sale.total;
            }
        });

        return Object.entries(data)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, values]) => ({
                name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                ...values
            }));
    }, [filteredSales, dateRange, stores]);

    const topCustomersBySpend = useMemo(() => {
        return customers.map(c => {
            const customerSales = filteredSales.filter(s => s.customerId === c.id);
            const totalSpent = customerSales.reduce((sum, s) => sum + s.total, 0);
            const visits = customerSales.length;
            return { name: `${c.firstName} ${c.lastName}`, totalSpent, visits };
        }).filter(c => c.totalSpent > 0).sort((a,b) => b.totalSpent - a.totalSpent).slice(0, 5);
    }, [filteredSales, customers]);

    const handleGetInsights = async () => {
        setIsLoading(true);
        setInsights('');
        try {
            const salesSummary = JSON.stringify({
                period: `${dateRange.start.toLocaleDateString()} au ${dateRange.end.toLocaleDateString()}`,
                totalRevenue: totalSalesValue,
                averageOrder: avgOrderValue,
                topProducts: salesByProduct,
                categoryPerformance: salesByCategory,
                storePerformance: salesByStore,
                loyaltyEngagement: {
                    activeCustomers: topCustomersBySpend.length,
                    topCustomers: topCustomersBySpend
                }
            }, null, 2);

            const result = await getSalesInsights(salesSummary);
            setInsights(result);
        } catch (error) {
            console.error("Error fetching Gemini insights:", error);
            setInsights("Échec de la récupération des analyses. Veuillez vérifier votre connexion.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(amount) + ' Fcfa';
    };

    const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('salesAnalytics')}</h2>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={handleGetInsights}
                        disabled={isLoading || filteredSales.length === 0}
                        className="px-6 py-2 bg-indigo-600 text-white font-black rounded-xl transition-all hover:bg-indigo-700 disabled:bg-slate-400 flex items-center shadow-lg shadow-indigo-500/20 uppercase text-xs tracking-widest"
                    >
                        {isLoading && <Spinner size="sm" className="mr-2"/>}
                        {isLoading ? t('loadingInsights') : t('getInsights')}
                    </button>
                </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border-b-4 border-indigo-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('totalSales')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalSalesValue)}</p>
                    <p className="text-xs text-indigo-500 mt-2 font-bold uppercase">{filteredSales.length} transactions</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border-b-4 border-emerald-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('avgOrderValue')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(avgOrderValue)}</p>
                    <p className="text-xs text-emerald-500 mt-2 font-bold uppercase">par client</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border-b-4 border-amber-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Catégorie</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white truncate uppercase">{salesByCategory[0]?.name || 'N/A'}</p>
                    <p className="text-xs text-amber-500 mt-2 font-bold uppercase">{formatCurrency(salesByCategory[0]?.value || 0)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border-b-4 border-rose-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Magasin</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white truncate uppercase">{salesByStore[0]?.name || 'N/A'}</p>
                    <p className="text-xs text-rose-500 mt-2 font-bold uppercase">{formatCurrency(salesByStore[0]?.total || 0)}</p>
                </div>
            </div>

            {/* Date Range Selection */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-6">
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                    <button onClick={handleSetThisWeek} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeRange === 'week' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{t('thisWeek')}</button>
                    <button onClick={handleSetThisMonth} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeRange === 'month' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{t('thisMonth')}</button>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{t('from')}</span>
                        <input type="date" value={formatDateForInput(dateRange.start)} onChange={handleCustomDateChange} name="start" className="bg-transparent border-b border-slate-300 dark:border-slate-600 text-xs font-bold outline-none pb-1" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{t('to')}</span>
                        <input type="date" value={formatDateForInput(dateRange.end)} onChange={handleCustomDateChange} name="end" className="bg-transparent border-b border-slate-300 dark:border-slate-600 text-xs font-bold outline-none pb-1" />
                    </div>
                </div>
            </div>

            {/* Ventes Journalières par Magasin */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ventes Journalières par Magasin</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Comparatif dynamique des performances locales</p>
                    </div>
                </div>
                <div className="h-[400px] w-full">
                    {dailyStoreTrend && dailyStoreTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <AreaChart data={dailyStoreTrend}>
                            <defs>
                                {stores.map((s, idx) => (
                                    <linearGradient key={`grad-${s.id}`} id={`color-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} tickFormatter={(val) => `${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', background: theme === 'dark' ? '#1e293b' : '#fff' }} 
                                itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                            {stores.map((s, idx) => (
                                <Area 
                                    key={s.id}
                                    type="monotone" 
                                    dataKey={s.name} 
                                    stroke={COLORS[idx % COLORS.length]} 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill={`url(#color-${s.id})`}
                                    stackId="1"
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Aucune donnée disponible
                        </div>
                    )}
                </div>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Best Selling Products */}
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-50 dark:border-slate-700">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">{t('bestSellingItems')}</h3>
                    {salesByProduct && salesByProduct.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300} minHeight={250}>
                        <BarChart data={salesByProduct} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} width={120} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="quantity" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-slate-500">
                            Aucune donnée disponible
                        </div>
                    )}
                </div>

                {/* Category Breakdown (Pie) */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-50 dark:border-slate-700">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">{t('categorySales')}</h3>
                    {salesByCategory && salesByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300} minHeight={250}>
                        <PieChart>
                            <Pie data={salesByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                {salesByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => formatCurrency(val)} />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                        </PieChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-slate-500">
                            Aucune donnée disponible
                        </div>
                    )}
                </div>
            </div>

            {/* AI Insights & Customer Behavior */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Insights Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {(isLoading || insights) && (
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border-l-8 border-indigo-500 overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                                     <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Analyses Prédictives Gemini</h3>
                            </div>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Spinner size="lg" />
                                    <p className="mt-4 text-slate-500 font-bold animate-pulse uppercase text-xs tracking-widest">{t('loadingInsights')}</p>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none prose-indigo prose-sm sm:prose-base font-medium">
                                    <ReactMarkdown>{insights}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Printing Statistics Panel */}
                {settings.printing?.printStatistics?.enabled && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-50 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-xl">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Statistiques d'Impression</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                                <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">
                                    {settings.printing.printStatistics.totalReceipts}
                                </div>
                                <div className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                    Tickets Imprimés
                                </div>
                            </div>
                            
                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800">
                                <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-2">
                                    {settings.printing.printStatistics.paperSaved.toFixed(1)}m
                                </div>
                                <div className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">
                                    Papier Économisé
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-800">
                                <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-2">
                                    {settings.printing.paperWidth}
                                </div>
                                <div className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                    Format Papier
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                    Impression automatique
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    settings.printing.autoPrint 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                                }`}>
                                    {settings.printing.autoPrint ? 'Activée' : 'Désactivée'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Customers Panel */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-50 dark:border-slate-700">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">{t('topSpendingCustomers')}</h3>
                    <div className="space-y-4">
                        {topCustomersBySpend.length > 0 ? topCustomersBySpend.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white uppercase text-sm">{c.name}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase">{c.visits} {t('visits')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(c.totalSpent)}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-500 py-10 font-bold uppercase text-[10px]">Aucune donnée client.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
