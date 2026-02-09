
import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext, useMemo } from 'react';
import { Supplier, UserRole } from '../types';
import { MOCK_SUPPLIERS } from '../constants';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'tenantId'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (supplierId: number) => Promise<void>;
  loadSuppliers: () => Promise<void>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

  const suppliers = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.SuperAdmin) return allSuppliers;
    return allSuppliers.filter(s => s.tenantId === user.tenantId);
  }, [allSuppliers, user]);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/suppliers`);
      
      if (!response.ok) {
        throw new Error('Erreur chargement fournisseurs');
      }

      const data = await response.json();
      
      const dbSuppliers: Supplier[] = data.map((s: any) => ({
        id: s.id,
        tenantId: s.tenant_id,
        name: s.name,
        contactPerson: s.contact_person,
        email: s.email,
        phone: s.phone,
        address: s.address
      }));

      setAllSuppliers(dbSuppliers);
      console.log('✅ Fournisseurs chargés depuis la DB:', dbSuppliers.length);
    } catch (error) {
      console.warn('⚠️ Erreur chargement fournisseurs, fallback localStorage:', error);
      const saved = localStorage.getItem('globalSuppliers');
      if (saved) {
        setAllSuppliers(JSON.parse(saved));
      } else {
        setAllSuppliers(MOCK_SUPPLIERS);
      }
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const addSupplier = useCallback(async (supplierData: Omit<Supplier, 'id' | 'tenantId'>) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: user.tenantId,
          name: supplierData.name,
          contact_person: supplierData.contactPerson,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address
        })
      });

      if (!response.ok) {
        throw new Error('Erreur création fournisseur');
      }

      const result = await response.json();
      const newSupplier: Supplier = {
        id: result.id,
        tenantId: result.tenant_id,
        name: result.name,
        contactPerson: result.contact_person,
        email: result.email,
        phone: result.phone,
        address: result.address
      };

      setAllSuppliers(prev => [...prev, newSupplier]);
      localStorage.setItem('globalSuppliers', JSON.stringify([...allSuppliers, newSupplier]));
      console.log('✅ Fournisseur créé:', newSupplier);
    } catch (error) {
      console.error('❌ Erreur création fournisseur:', error);
      // Fallback localStorage
      const newSupplier: Supplier = {
        id: Math.max(0, ...allSuppliers.map(s => s.id)) + 1,
        tenantId: user.tenantId,
        ...supplierData
      };
      setAllSuppliers(prev => [...prev, newSupplier]);
      localStorage.setItem('globalSuppliers', JSON.stringify([...allSuppliers, newSupplier]));
    }
  }, [allSuppliers, user]);

  const updateSupplier = useCallback(async (updatedSupplier: Supplier) => {
    try {
      const response = await fetch(`${API_URL}/api/suppliers/${updatedSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedSupplier.name,
          contact_person: updatedSupplier.contactPerson,
          email: updatedSupplier.email,
          phone: updatedSupplier.phone,
          address: updatedSupplier.address
        })
      });

      if (!response.ok) {
        throw new Error('Erreur mise à jour fournisseur');
      }

      const newList = allSuppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s);
      setAllSuppliers(newList);
      localStorage.setItem('globalSuppliers', JSON.stringify(newList));
      console.log('✅ Fournisseur mis à jour:', updatedSupplier);
    } catch (error) {
      console.error('❌ Erreur mise à jour fournisseur:', error);
      // Fallback localStorage
      const newList = allSuppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s);
      setAllSuppliers(newList);
      localStorage.setItem('globalSuppliers', JSON.stringify(newList));
    }
  }, [allSuppliers]);

  const deleteSupplier = useCallback(async (supplierId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/suppliers/${supplierId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur suppression fournisseur');
      }

      const newList = allSuppliers.filter(s => s.id !== supplierId);
      setAllSuppliers(newList);
      localStorage.setItem('globalSuppliers', JSON.stringify(newList));
      console.log('✅ Fournisseur supprimé:', supplierId);
    } catch (error) {
      console.error('❌ Erreur suppression fournisseur:', error);
      // Fallback localStorage
      const newList = allSuppliers.filter(s => s.id !== supplierId);
      setAllSuppliers(newList);
      localStorage.setItem('globalSuppliers', JSON.stringify(newList));
    }
  }, [allSuppliers]);

  return (
    <SupplierContext.Provider value={{ suppliers, addSupplier, updateSupplier, deleteSupplier, loadSuppliers }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSuppliers = () => {
    const context = useContext(SupplierContext);
    if (!context) throw new Error('useSuppliers must be used within SupplierProvider');
    return context;
};
