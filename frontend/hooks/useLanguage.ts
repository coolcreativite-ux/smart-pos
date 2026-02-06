
import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { TRANSLATIONS } from '../constants';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const t = (key: string): string => {
    return TRANSLATIONS[context.language][key] || key;
  };

  return { ...context, t };
};
