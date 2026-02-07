
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
import { UpdateNotification } from './components/UpdateNotification';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

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
    <LanguageProvider>
      <ActionLogProvider>
        <LicenseProvider>
          <UserProvider>
            <AuthProvider>
              <StoreProvider>
                <SupplierProvider>
                  <SettingsProvider>
                    <ProductProvider>
                      <CustomerProvider>
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
                      </CustomerProvider>
                    </ProductProvider>
                  </SettingsProvider>
                </SupplierProvider>
              </StoreProvider>
            </AuthProvider>
          </UserProvider>
        </LicenseProvider>
      </ActionLogProvider>
    </LanguageProvider>
  );
};

export default App;
