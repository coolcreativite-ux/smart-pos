
import React, { createContext, useState, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Fixe la langue sur 'fr' (Français) pour toute l'application
  const [language] = useState<Language>('fr');

  const setLanguage = (newLanguage: Language) => {
    // Désactivé pour forcer le français
    console.warn("Language switching is disabled in this version. Current: fr");
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
