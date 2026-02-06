
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';
import { UserRole } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useStores } from '../contexts/StoreContext';
import { usePWA } from '../hooks/usePWA';

interface HeaderProps {
    onMobileMenuToggle: () => void;
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, onSettingsClick }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { cartItems } = useCart();
  const { settings } = useSettings();
  const { stores, currentStore, setCurrentStore } = useStores();
  const { isInstallable, installApp } = usePWA();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.Admin: return 'bg-red-500 text-white';
      case UserRole.Manager: return 'bg-yellow-500 text-slate-900';
      case UserRole.Cashier: return 'bg-green-500 text-white';
      default: return 'bg-sky-500 text-white';
    }
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const storeId = Number(e.target.value);
      const selected = stores.find(s => s.id === storeId);
      if (selected) setCurrentStore(selected);
  };

  return (
    <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md z-30 sticky top-0">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 overflow-hidden">
            {settings.logoUrl ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                    <img src={settings.logoUrl} alt="Store Logo" className="w-full h-full object-contain p-0.5" />
                </div>
            ) : (
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none truncate">{settings.storeName}</span>
                    {!isOnline && (
                        <span className="inline-block px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase tracking-wide">
                            Offline
                        </span>
                    )}
                </div>
                {currentStore && <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase truncate">{currentStore.name}</span>}
            </div>
        </div>
        
        <div className="flex items-center space-x-2">
            {/* Install Button - Only if app can be installed */}
            {isInstallable && (
                <button
                    onClick={installApp}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-black text-[10px] uppercase tracking-tighter border border-indigo-100 dark:border-indigo-800 animate-pulse hover:animate-none"
                    title="Installer l'application"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">Installer</span>
                </button>
            )}

            {/* Store Switcher - Global Context */}
            {user && (user.role === UserRole.Owner || user.role === UserRole.Admin) && stores.length > 1 && (
                <div className="hidden md:block">
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1 text-center">
                        Magasin Actif
                    </div>
                    <select 
                        value={currentStore?.id || ''} 
                        onChange={handleStoreChange}
                        className="text-xs bg-slate-100 dark:bg-slate-700 border-none rounded-lg px-3 py-2 font-black uppercase focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white max-w-[150px] truncate cursor-pointer transition-all"
                        title="Changer le magasin actif pour toute l'application"
                    >
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label={t('theme')}
            >
                {theme === 'light' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
            </button>
            
          {user && (
            <>
              {/* Desktop controls */}
              <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight">{user.username}</div>
                      <div className={`text-[9px] px-2 py-0.5 rounded-full inline-block mt-1 font-black uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                          {t(user.role)}
                      </div>
                  </div>
                   <button
                        onClick={onSettingsClick}
                        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title={t('settings')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                  <button
                      onClick={logout}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      title={t('logout')}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                  </button>
              </div>

              {/* Mobile controls */}
              <div className="lg:hidden flex items-center space-x-1">
                  <button
                      onClick={logout}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      aria-label={t('logout')}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                  </button>
                  <button
                      onClick={onMobileMenuToggle}
                      className="relative p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      aria-label={t('openCart')}
                  >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cartItems.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg border-2 border-white dark:border-slate-800">
                                {cartItems.length}
                            </span>
                        )}
                  </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
