import { useContext } from 'react';
import { PromoCodeContext } from '../contexts/PromoCodeContext';

export const usePromoCodes = () => {
  const context = useContext(PromoCodeContext);
  if (!context) {
    throw new Error('usePromoCodes must be used within a PromoCodeProvider');
  }
  return context;
};
