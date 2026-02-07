
import React, { createContext, useState, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import { User, UserRole } from '../types';
import { useUsers } from './UserContext';
import { useLicenses } from './LicenseContext';
import { API_URL } from '../config';

interface AuthContextType {
  user: User | null;
  isActivated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  activateApp: (key: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Restaurer l'utilisateur depuis localStorage au démarrage
    try {
      const savedSession = localStorage.getItem('currentUserSession');
      if (!savedSession) return null;
      
      const session = JSON.parse(savedSession);
      const now = Date.now();
      const sessionAge = now - session.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      
      // Vérifier si la session n'a pas expiré
      if (sessionAge > maxAge) {
        localStorage.removeItem('currentUserSession');
        return null;
      }
      
      return session.user;
    } catch (error) {
      console.warn('Erreur lors de la restauration de la session:', error);
      localStorage.removeItem('currentUserSession');
      return null;
    }
  });
  const { users } = useUsers();
  const { activateLicenseForTenant, isTenantActivated } = useLicenses();

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // Appeler l'API backend pour l'authentification
      const response = await fetch('${API_URL}/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        // Si l'API n'est pas disponible, utiliser l'authentification locale
        console.warn('API backend non disponible, utilisation de l\'authentification locale');
        const foundUser = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === password
        );
        
        if (!foundUser) return false;
        
        setUser(foundUser);
        // Sauvegarder la session avec timestamp
        const session = {
          user: foundUser,
          timestamp: Date.now()
        };
        localStorage.setItem('currentUserSession', JSON.stringify(session));
        return true;
      }

      const result = await response.json();
      
      if (result.success && result.user) {
        setUser(result.user);
        // Sauvegarder la session avec timestamp
        const session = {
          user: result.user,
          timestamp: Date.now()
        };
        localStorage.setItem('currentUserSession', JSON.stringify(session));
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Erreur lors de l\'authentification:', error);
      
      // Fallback vers l'authentification locale
      const foundUser = users.find(u => 
          u.username.toLowerCase() === username.toLowerCase() && 
          u.password === password
      );
      
      if (!foundUser) return false;
      
      setUser(foundUser);
      // Sauvegarder la session avec timestamp
      const session = {
        user: foundUser,
        timestamp: Date.now()
      };
      localStorage.setItem('currentUserSession', JSON.stringify(session));
      return true;
    }
  }, [users]);

  const activateApp = useCallback(async (key: string): Promise<boolean> => {
    if (!user) return false;
    
    const success = await activateLicenseForTenant(key, user.tenantId);
    return success;
  }, [user, activateLicenseForTenant]);

  const logout = useCallback(() => {
    setUser(null);
    // Supprimer la session sauvegardée
    localStorage.removeItem('currentUserSession');
  }, []);

  // Valider la session au démarrage
  useEffect(() => {
    const validateSession = async () => {
      const savedSession = localStorage.getItem('currentUserSession');
      if (!savedSession) return;

      try {
        const session = JSON.parse(savedSession);
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        
        // Vérifier si la session n'a pas expiré
        if (sessionAge > maxAge) {
          localStorage.removeItem('currentUserSession');
          setUser(null);
          return;
        }
        
        // Session valide, restaurer l'utilisateur
        setUser(session.user);
        
      } catch (error) {
        console.warn('Session invalide, déconnexion:', error);
        localStorage.removeItem('currentUserSession');
        setUser(null);
      }
    };

    // Ne valider que si on n'a pas déjà un utilisateur
    if (!user) {
      validateSession();
    }
  }, [user]);

  // Détermination de l'activation basée sur le tenant de l'utilisateur connecté
  const finalActivationStatus = useMemo(() => {
      if (!user) return false;
      if (user.role === UserRole.SuperAdmin) return true;
      return isTenantActivated(user.tenantId);
  }, [user, isTenantActivated]);

  return (
    <AuthContext.Provider value={{ 
        user, 
        isActivated: finalActivationStatus, 
        login, 
        logout, 
        activateApp 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
