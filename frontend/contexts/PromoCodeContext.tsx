
import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { PromoCode } from '../types';
import { MOCK_PROMO_CODES } from '../constants';
import { useAuth } from './AuthContext';

interface PromoCodeContextType {
  promoCodes: PromoCode[];
  // Omit tenantId from creation data
  addPromoCode: (promoCodeData: Omit<PromoCode, 'id' | 'isActive' | 'tenantId'>) => boolean;
  updatePromoCode: (promoCode: PromoCode) => void;
  deletePromoCode: (promoCodeId: number) => void;
}

export const PromoCodeContext = createContext<PromoCodeContextType | undefined>(undefined);

export const PromoCodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(MOCK_PROMO_CODES);
  // Get current user for tenantId
  const { user } = useAuth();

  const addPromoCode = useCallback((promoCodeData: Omit<PromoCode, 'id' | 'isActive' | 'tenantId'>): boolean => {
    if (!user) return false;
    
    const codeExists = promoCodes.some(p => p.code.toUpperCase() === promoCodeData.code.toUpperCase() && p.tenantId === user.tenantId);
    if (codeExists) {
        return false;
    }

    setPromoCodes(prev => {
      const newPromoCode: PromoCode = {
        id: Math.max(0, ...prev.map(p => p.id)) + 1,
        // Automatically inject tenantId
        tenantId: user.tenantId,
        ...promoCodeData,
        isActive: true,
      };
      return [...prev, newPromoCode];
    });
    return true;
  }, [promoCodes, user]);

  const updatePromoCode = useCallback((updatedPromoCode: PromoCode) => {
    setPromoCodes(prev =>
      prev.map(p => (p.id === updatedPromoCode.id ? updatedPromoCode : p))
    );
  }, []);

  const deletePromoCode = useCallback((promoCodeId: number) => {
    setPromoCodes(prev => prev.filter(p => p.id !== promoCodeId));
  }, []);

  return (
    <PromoCodeContext.Provider value={{ promoCodes, addPromoCode, updatePromoCode, deletePromoCode }}>
      {children}
    </PromoCodeContext.Provider>
  );
};
