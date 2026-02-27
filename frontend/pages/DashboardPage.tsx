
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ProductGrid from '../components/ProductGrid';
import SalesCart from '../components/SalesCart';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ProductManagement from '../components/ProductManagement';
import SettingsModal from '../components/SettingsModal';
import SalesHistory from './SalesHistory';
import LowStockAlert from '../components/LowStockAlert';
import SettingsPage from './SettingsPage';
import SuperAdminPage from './SuperAdminPage';
import InventoryPage from './InventoryPage';
import PurchaseOrderPage from './PurchaseOrderPage';
import SupplierManagement from '../components/SupplierManagement';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import CustomerManagementPage from './CustomerManagementPage';
import StoreManagement from '../components/StoreManagement';
import DebtManagementPage from './DebtManagementPage';
import InvoicesPage from './InvoicesPage';
import { useCart } from '../contexts/CartContext';
import CashDrawerModal from '../components/CashDrawerModal';
import { useCashDrawer } from '../contexts/CashDrawerContext';
import { useStores } from '../contexts/StoreContext';
import ActivationOverlay from '../components/ActivationOverlay';
import TenantLicensePage from './TenantLicensePage';

type View = 'pos' | 'analytics' | 'products' | 'customers' | 'history' | 'settings' | 'stores' | 'superadmin' | 'inventory' | 'purchases' | 'suppliers' | 'debts' | 'license' | 'invoices';

const DashboardPage: React.FC = () => {
    const { user, isActivated } = useAuth();
    const { t } = useLanguage();
    const { cartItems, total } = useCart();
    const { currentSession } = useCashDrawer();
    const { stores, currentStore, setCurrentStore } = useStores();
    
    const isSuperAdmin = user?.role === UserRole.SuperAdmin;
    const isOwner = user?.role === UserRole.Owner;
    const isAdmin = user?.role === UserRole.Admin;
    const canSell = user?.role === UserRole.Manager || user?.role === UserRole.Cashier;
    
    // Default view: SuperAdmin -> superadmin, Seller -> pos, Admin/Owner -> analytics
    const [view, setView] = useState<View>(
        isSuperAdmin ? 'superadmin' : (canSell ? 'pos' : 'analytics')
    );
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

    const canViewAnalytics = user?.permissions.viewAnalytics;
    const canManageProducts = user?.permissions.manageProducts;
    const canManageCustomers = user?.permissions.manageProducts;
    const canViewHistory = user?.permissions.viewHistory;
    const canViewSettings = user?.permissions.accessSettings;
    const canManageStores = user?.permissions.manageStores;
    const canManageInvoices = isOwner || isAdmin; // Seuls Owner et Admin peuvent gérer les factures

    useEffect(() => {
        if (user?.assignedStoreId && !currentStore) {
            const assigned = stores.find(s => s.id === user.assignedStoreId);
            if (assigned) {
                setCurrentStore(assigned);
            }
        } else if (stores.length > 0 && !currentStore) {
            setCurrentStore(stores[0]);
        }
    }, [user, stores, currentStore, setCurrentStore]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
    };

    const navItems = [
        { id: 'pos', label: t('posTerminal'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>, show: canSell },
        { id: 'analytics', label: t('analytics'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, show: canViewAnalytics },
        { id: 'invoices', label: 'Factures', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, show: canManageInvoices },
        { id: 'debts', label: t('debts'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, show: canViewHistory },
        { id: 'products', label: t('products'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, show: canManageProducts },
        { id: 'inventory', label: t('inventory'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, show: canManageProducts },
        { id: 'purchases', label: t('purchaseOrders'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, show: canManageProducts },
        { id: 'suppliers', label: t('suppliers'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, show: canManageProducts },
        { id: 'customers', label: t('customers'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, show: canManageCustomers },
        { id: 'stores', label: t('stores'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, show: canManageStores },
        { id: 'history', label: t('viewHistory'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, show: canViewHistory },
        { id: 'license', label: "Licence", icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>, show: isOwner },
        { id: 'settings', label: t('appSettings'), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, show: canViewSettings },
    ];

    const handleStoreSwitch = (store: any) => {
        setCurrentStore(store);
        setIsNavMenuOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {!isActivated && <ActivationOverlay />}
            
            <Header 
                onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                onSettingsClick={() => setIsSettingsModalOpen(true)}
            />
            
            <main className="flex-grow flex flex-col lg:flex-row p-0 lg:p-6 lg:gap-6 overflow-hidden">
                <div className="flex-grow flex flex-col bg-slate-100 lg:bg-white/50 dark:bg-slate-900 lg:dark:bg-slate-900/50 lg:rounded-[2rem] overflow-hidden lg:shadow-2xl relative border-slate-200 dark:border-slate-800">
                    
                    <div className="hidden lg:flex px-6 py-4 justify-between items-center border-b border-slate-200 dark:border-slate-800">
                        <nav className="flex space-x-6">
                            {isSuperAdmin ? (
                                <button onClick={() => setView('superadmin')} className={`whitespace-nowrap py-2 px-1 font-black text-xs uppercase tracking-widest transition-colors ${view === 'superadmin' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}>{t('superAdmin')}</button>
                            ) : (
                                navItems.filter(i => i.show).map(item => (
                                    <button 
                                        key={item.id}
                                        onClick={() => setView(item.id as View)} 
                                        className={`whitespace-nowrap py-2 px-1 font-black text-[10px] md:text-xs uppercase tracking-widest transition-colors ${view === item.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))
                            )}
                        </nav>
                        
                        {canSell && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsCashDrawerOpen(true)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentSession ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                >
                                    {currentSession ? 'Caisse Ouverte' : 'Ouvrir Caisse'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6 custom-scrollbar">
                        {!isSuperAdmin && canManageProducts && view !== 'license' && view !== 'invoices' && <LowStockAlert />}
                        {view === 'pos' && canSell && <ProductGrid />}
                        {view === 'analytics' && canViewAnalytics && <AnalyticsDashboard />}
                        {view === 'invoices' && canManageInvoices && <InvoicesPage />}
                        {view === 'products' && canManageProducts && <ProductManagement />}
                        {view === 'inventory' && canManageProducts && <InventoryPage />}
                        {view === 'purchases' && canManageProducts && <PurchaseOrderPage />}
                        {view === 'suppliers' && canManageProducts && <SupplierManagement />}
                        {view === 'customers' && canManageCustomers && <CustomerManagementPage />}
                        {view === 'stores' && canManageStores && <StoreManagement />}
                        {view === 'history' && canViewHistory && <SalesHistory />}
                        {view === 'debts' && canViewHistory && <DebtManagementPage />}
                        {view === 'settings' && canViewSettings && <SettingsPage />}
                        {view === 'superadmin' && isSuperAdmin && <SuperAdminPage />}
                        {view === 'license' && isOwner && <TenantLicensePage />}
                    </div>

                    {cartItems.length > 0 && view === 'pos' && canSell && (
                        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-30">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="w-full bg-indigo-600 text-white rounded-2xl shadow-2xl p-4 flex justify-between items-center animate-in slide-in-from-bottom duration-500 border-2 border-indigo-500/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-black uppercase">{cartItems.length} {t('itemsCount')}</div>
                                    <span className="font-black text-sm uppercase tracking-widest">{t('salesCart')}</span>
                                </div>
                                <span className="font-black text-lg">{formatCurrency(total)}</span>
                            </button>
                        </div>
                    )}
                </div>

                {canSell && view === 'pos' && (
                    <div className="hidden lg:flex w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
                        <SalesCart />
                    </div>
                )}
            </main>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe z-40 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex justify-around items-center h-16">
                    {canSell && (
                        <button onClick={() => setView('pos')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${view === 'pos' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            <span className="text-[9px] font-black uppercase tracking-tighter">Vendre</span>
                        </button>
                    )}
                    {!canSell && canViewAnalytics && (
                        <button onClick={() => setView('analytics')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${view === 'analytics' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            <span className="text-[9px] font-black uppercase tracking-tighter">Analyses</span>
                        </button>
                    )}
                    <button onClick={() => setView('debts')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${view === 'debts' ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Dettes</span>
                    </button>
                    <button onClick={() => setView('history')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${view === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Ventes</span>
                    </button>
                    <button onClick={() => setIsNavMenuOpen(true)} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 active:text-indigo-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Menu</span>
                    </button>
                </div>
            </div>

            {isNavMenuOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsNavMenuOpen(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom duration-500 border-t border-indigo-100/20 max-h-[90vh] overflow-y-auto">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                        
                        <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black uppercase shadow-lg shadow-indigo-500/20">
                                {user?.username[0]}
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.username}</p>
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t(user?.role || 'cashier')}</p>
                            </div>
                        </div>

                        {canSell && (
                            <button 
                                onClick={() => { setIsCashDrawerOpen(true); setIsNavMenuOpen(false); }}
                                className={`w-full mb-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${currentSession ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
                                {currentSession ? 'Session Ouverte' : 'Ouvrir la Caisse'}
                            </button>
                        )}

                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Navigation</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center pb-8">
                            {navItems.filter(i => i.show).map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setView(item.id as View); setIsNavMenuOpen(false); }}
                                    className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/40 border-2 border-transparent hover:border-indigo-500 active:bg-indigo-50 dark:active:bg-indigo-900/20 transition-all active:scale-95"
                                >
                                    <div className={`p-4 rounded-2xl shadow-sm ${view === item.id ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-300">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!isSuperAdmin && canSell && isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-[2.5rem] shadow-2xl h-[92vh] animate-in slide-in-from-bottom duration-500 overflow-hidden flex flex-col">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-2 flex-shrink-0"></div>
                        <div className="flex-grow overflow-hidden">
                            <SalesCart isMobileView={true} onClose={() => setIsMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
            
            {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />}
            {isCashDrawerOpen && <CashDrawerModal onClose={() => setIsCashDrawerOpen(false)} />}
        </div>
    );
};

export default DashboardPage;
