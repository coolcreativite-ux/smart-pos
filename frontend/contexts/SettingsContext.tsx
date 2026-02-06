import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  loading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Fonction pour migrer les anciens paramètres vers la nouvelle structure
const migrateSettings = (savedSettings: any): Settings => {
  const migrated = { ...DEFAULT_SETTINGS, ...savedSettings };
  
  // S'assurer que les paramètres d'impression existent
  if (!migrated.printing) {
    migrated.printing = DEFAULT_SETTINGS.printing;
  } else {
    // Fusionner avec les valeurs par défaut pour les propriétés manquantes
    migrated.printing = {
      ...DEFAULT_SETTINGS.printing,
      ...migrated.printing
    };
  }
  
  return migrated;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Charger les paramètres depuis l'API
  const loadSettings = useCallback(async () => {
    if (!user?.tenantId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/settings/${user.tenantId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Convertir les données de la DB vers le format Settings
        const dbSettings: Settings = {
          tenantId: user.tenantId,
          storeName: data.store_name || 'Smart POS',
          taxRate: (data.tax_rate || 0) * 100, // Convertir décimal en pourcentage
          loyaltyProgram: {
            enabled: data.loyalty_program_enabled || false,
            pointsPerDollar: data.loyalty_points_per_dollar || 0.01,
            pointValue: data.loyalty_point_value || 1
          },
          printing: data.printing_settings || DEFAULT_SETTINGS.printing
        };
        
        setSettings(dbSettings);
        console.log('✅ Paramètres chargés depuis la base de données');
      } else {
        console.warn('Impossible de charger les paramètres depuis l\'API, utilisation des paramètres par défaut');
        // Fallback vers localStorage si l'API échoue
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(migrateSettings(parsed));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      // Fallback vers localStorage en cas d'erreur
      try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(migrateSettings(parsed));
        }
      } catch (localError) {
        console.error('Erreur localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  // Sauvegarder les paramètres vers l'API et localStorage
  const updateSettings = useCallback(async (newSettings: Settings) => {
    if (!user?.tenantId) {
      console.error('Pas de tenantId disponible pour sauvegarder les paramètres');
      return;
    }

    try {
      // Sauvegarder vers l'API
      const response = await fetch(`http://localhost:5000/api/settings/${user.tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
        console.log('✅ Paramètres sauvegardés dans la base de données');
      } else {
        console.error('❌ Erreur lors de la sauvegarde des paramètres dans l\'API');
        throw new Error('Erreur API');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      
      // Fallback vers localStorage en cas d'erreur API
      try {
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
        setSettings(newSettings);
        console.log('⚠️ Paramètres sauvegardés en local uniquement');
      } catch (localError) {
        console.error('Erreur localStorage:', localError);
      }
    }
  }, [user?.tenantId]);

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Sauvegarder en local comme backup (sans remplacer l'API)
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('appSettings', JSON.stringify(settings));
      } catch (error) {
        console.error("Could not save settings to localStorage", error);
      }
    }
  }, [settings, loading]);

  const value = {
    settings,
    updateSettings,
    loading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};