
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { ProductProvider } from './contexts/ProductContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SalesHistoryProvider } from './contexts/SalesHistoryContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { UserProvider } from './contexts/UserContext';
import { LicenseProvider } from './contexts/LicenseContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { SaasBrandingProvider } from './contexts/SaasBrandingContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import { ToastProvider } from './contexts/ToastContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { PromoCodeProvider } from './contexts/PromoCodeContext';
import { ActionLogProvider } from './contexts/ActionLogContext';
import { StoreProvider } from './contexts/StoreContext';
import { CashDrawerProvider } from './contexts/CashDrawerContext';
import { SupplierProvider } from './contexts/SupplierContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { UpdateNotification } from './components/UpdateNotification';
import { useDynamicFavicon } from './hooks/useDynamicFavicon';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    
    // Mettre à jour le favicon dynamiquement
    useDynamicFavicon();

    if (user) {
        return <DashboardPage />;
    }

    return showLogin ? (
        <LoginPage />
    ) : (
        <LandingPage onLoginClick={() => setShowLogin(true)} />
    );
};

const App: React.FC = () => {
  return (
    <AppSettingsProvider>
      <LanguageProvider>
        <ActionLogProvider>
          <LicenseProvider>
            <UserProvider>
              <AuthProvider>
                <SaasBrandingProvider>
                  <StoreProvider>
                    <SupplierProvider>
                      <SettingsProvider>
                        <ProductProvider>
                          <CustomerProvider>
                            <InvoiceProvider>
                              <SalesHistoryProvider>
                                <PromoCodeProvider>
                                  <CashDrawerProvider>
                                    <CartProvider>
                                      <ThemeProvider>
                                        <ToastProvider>
                                          <div className="min-h-screen font-sans">
                                            <AppContent />
                                            <UpdateNotification />
                                          </div>
                                        </ToastProvider>
                                      </ThemeProvider>
                                    </CartProvider>
                                  </CashDrawerProvider>
                                </PromoCodeProvider>
                              </SalesHistoryProvider>
                            </InvoiceProvider>
                          </CustomerProvider>
                        </ProductProvider>
                      </SettingsProvider>
                    </SupplierProvider>
                  </StoreProvider>
                </SaasBrandingProvider>
              </AuthProvider>
            </UserProvider>
          </LicenseProvider>
        </ActionLogProvider>
      </LanguageProvider>
    </AppSettingsProvider>
  );
};

export default App;
