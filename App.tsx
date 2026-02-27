
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './frontend/contexts/AuthContext';
import { LanguageProvider } from './frontend/contexts/LanguageContext';
import { CartProvider } from './frontend/contexts/CartContext';
import { ProductProvider } from './frontend/contexts/ProductContext';
import { ThemeProvider } from './frontend/contexts/ThemeContext';
import { SalesHistoryProvider } from './frontend/contexts/SalesHistoryContext';
import { SettingsProvider } from './frontend/contexts/SettingsContext';
import { UserProvider } from './frontend/contexts/UserContext';
import { LicenseProvider } from './frontend/contexts/LicenseContext';
import { AppSettingsProvider } from './frontend/contexts/AppSettingsContext';
import { SaasBrandingProvider } from './frontend/contexts/SaasBrandingContext';
import LoginPage from './frontend/pages/LoginPage';
import DashboardPage from './frontend/pages/DashboardPage';
import LandingPage from './frontend/pages/LandingPage';
import { ToastProvider } from './frontend/contexts/ToastContext';
import { CustomerProvider } from './frontend/contexts/CustomerContext';
import { PromoCodeProvider } from './frontend/contexts/PromoCodeContext';
import { ActionLogProvider } from './frontend/contexts/ActionLogContext';
import { StoreProvider } from './frontend/contexts/StoreContext';
import { CashDrawerProvider } from './frontend/contexts/CashDrawerContext';
import { SupplierProvider } from './frontend/contexts/SupplierContext';
import { InvoiceProvider } from './frontend/contexts/InvoiceContext';
import { UpdateNotification } from './frontend/components/UpdateNotification';
import { useDynamicFavicon } from './frontend/hooks/useDynamicFavicon';

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
