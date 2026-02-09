
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { PromoCode } from '../types';
import { MOCK_PROMO_CODES } from '../constants';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

interface PromoCodeContextType {
  promoCodes: PromoCode[];
  addPromoCode: (promoCodeData: Omit<PromoCode, 'id' | 'isActive' | 'tenantId'>) => Promise<boolean>;
  updatePromoCode: (promoCode: PromoCode) => Promise<void>;
  deletePromoCode: (promoCodeId: number) => Promise<void>;
  loadPromoCodes: () => Promise<void>;
}

export const PromoCodeContext = createContext<PromoCodeContextType | undefined>(undefined);

export const PromoCodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const { user } = useAuth();

  const loadPromoCodes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/promo-codes`);
      
      if (!response.ok) {
        throw new Error('Erreur chargement codes promo');
      }

      const data = await response.json();
      
      const dbPromoCodes: PromoCode[] = data.map((p: any) => ({
        id: p.id,
        tenantId: p.tenant_id,
        code: p.code,
        type: p.type,
        value: parseFloat(p.value),
        isActive: p.is_active,
        expiresAt: p.expires_at ? new Date(p.expires_at) : undefined
      }));

      // Filtrer par tenant
      const filtered = user 
        ? dbPromoCodes.filter(p => p.tenantId === user.tenantId)
        : dbPromoCodes;

      setPromoCodes(filtered);
      console.log('✅ Codes promo chargés depuis la DB:', filtered.length);
    } catch (error) {
      console.warn('⚠️ Erreur chargement codes promo, fallback mock:', error);
      setPromoCodes(MOCK_PROMO_CODES);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPromoCodes();
    }
  }, [loadPromoCodes, user]);

  const addPromoCode = useCallback(async (promoCodeData: Omit<PromoCode, 'id' | 'isActive' | 'tenantId'>): Promise<boolean> => {
    if (!user) return false;
    
    // Vérifier si le code existe déjà localement
    const codeExists = promoCodes.some(p => p.code.toUpperCase() === promoCodeData.code.toUpperCase());
    if (codeExists) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/promo-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: user.tenantId,
          code: promoCodeData.code,
          type: promoCodeData.type,
          value: promoCodeData.value,
          expires_at: promoCodeData.expiresAt || null
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          return false; // Code existe déjà
        }
        throw new Error('Erreur création code promo');
      }

      const result = await response.json();
      const newPromoCode: PromoCode = {
        id: result.id,
        tenantId: result.tenant_id,
        code: result.code,
        type: result.type,
        value: parseFloat(result.value),
        isActive: result.is_active,
        expiresAt: result.expires_at ? new Date(result.expires_at) : undefined
      };

      setPromoCodes(prev => [...prev, newPromoCode]);
      console.log('✅ Code promo créé:', newPromoCode);
      return true;
    } catch (error) {
      console.error('❌ Erreur création code promo:', error);
      return false;
    }
  }, [promoCodes, user]);

  const updatePromoCode = useCallback(async (updatedPromoCode: PromoCode) => {
    try {
      const response = await fetch(`${API_URL}/api/promo-codes/${updatedPromoCode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: updatedPromoCode.code,
          type: updatedPromoCode.type,
          value: updatedPromoCode.value,
          is_active: updatedPromoCode.isActive,
          expires_at: updatedPromoCode.expiresAt || null
        })
      });

      if (!response.ok) {
        throw new Error('Erreur mise à jour code promo');
      }

      setPromoCodes(prev => prev.map(p => p.id === updatedPromoCode.id ? updatedPromoCode : p));
      console.log('✅ Code promo mis à jour:', updatedPromoCode);
    } catch (error) {
      console.error('❌ Erreur mise à jour code promo:', error);
      // Fallback local
      setPromoCodes(prev => prev.map(p => p.id === updatedPromoCode.id ? updatedPromoCode : p));
    }
  }, []);

  const deletePromoCode = useCallback(async (promoCodeId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/promo-codes/${promoCodeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur suppression code promo');
      }

      setPromoCodes(prev => prev.filter(p => p.id !== promoCodeId));
      console.log('✅ Code promo supprimé:', promoCodeId);
    } catch (error) {
      console.error('❌ Erreur suppression code promo:', error);
      // Fallback local
      setPromoCodes(prev => prev.filter(p => p.id !== promoCodeId));
    }
  }, []);

  return (
    <PromoCodeContext.Provider value={{ promoCodes, addPromoCode, updatePromoCode, deletePromoCode, loadPromoCodes }}>
      {children}
    </PromoCodeContext.Provider>
  );
};
