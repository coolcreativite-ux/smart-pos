import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSaasBranding, SAAS_BRANDING } from '../constants';

interface SaasBrandingContextType {
  branding: typeof SAAS_BRANDING;
  refreshBranding: () => Promise<void>;
  isLoading: boolean;
}

const SaasBrandingContext = createContext<SaasBrandingContextType | undefined>(undefined);

const CACHE_KEY = 'saas_branding_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const SaasBrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState(() => {
    // Charger depuis le cache au démarrage pour éviter le flash
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        // Cache expiré, le supprimer
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      // Cache corrompu ou quota dépassé, le supprimer
      console.warn('⚠️ Cache branding invalide, suppression');
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch (e) {
        // Ignorer les erreurs de suppression
      }
    }
    return SAAS_BRANDING;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshBranding = async () => {
    setIsLoading(true);
    try {
      const newBranding = await getSaasBranding();
      setBranding(newBranding);
      
      // Mettre en cache (si pas trop volumineux)
      try {
        const cacheData = JSON.stringify({
          data: newBranding,
          timestamp: Date.now()
        });
        
        // Vérifier la taille approximative (en caractères)
        if (cacheData.length < 4000000) { // ~4MB limite sécuritaire
          localStorage.setItem(CACHE_KEY, cacheData);
        } else {
          console.warn('⚠️ Logo trop volumineux pour le cache localStorage');
          // Supprimer l'ancien cache s'il existe
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (cacheError) {
        // QuotaExceededError - le logo est trop gros pour localStorage
        console.warn('⚠️ Impossible de mettre en cache le branding (quota dépassé)');
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      console.error('Erreur refresh branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBranding();
  }, []);

  return (
    <SaasBrandingContext.Provider value={{ branding, refreshBranding, isLoading }}>
      {children}
    </SaasBrandingContext.Provider>
  );
};

export const useSaasBranding = () => {
  const context = useContext(SaasBrandingContext);
  if (context === undefined) {
    throw new Error('useSaasBranding must be used within a SaasBrandingProvider');
  }
  return context;
};
