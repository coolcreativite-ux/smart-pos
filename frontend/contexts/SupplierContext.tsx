
import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext, useMemo } from 'react';
import { Supplier, UserRole } from '../types';
import { MOCK_SUPPLIERS } from '../constants';
import { useAuth } from './AuthContext';

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'tenantId'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: number) => void;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('globalSuppliers');
    return saved ? JSON.parse(saved) : MOCK_SUPPLIERS;
  });

  const suppliers = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.SuperAdmin) return allSuppliers;
    return allSuppliers.filter(s => s.tenantId === user.tenantId);
  }, [allSuppliers, user]);

  const saveToGlobal = (newList: Supplier[]) => {
      setAllSuppliers(newList);
      localStorage.setItem('globalSuppliers', JSON.stringify(newList));
  };

  const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'tenantId'>) => {
    if (!user) return;
    const newSupplier: Supplier = {
      id: Math.max(0, ...allSuppliers.map(s => s.id)) + 1,
      tenantId: user.tenantId,
      ...supplierData
    };
    saveToGlobal([...allSuppliers, newSupplier]);
  }, [allSuppliers, user]);

  const updateSupplier = useCallback((updatedSupplier: Supplier) => {
    saveToGlobal(allSuppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  }, [allSuppliers]);

  const deleteSupplier = useCallback((supplierId: number) => {
    saveToGlobal(allSuppliers.filter(s => s.id !== supplierId));
  }, [allSuppliers]);

  return (
    <SupplierContext.Provider value={{ suppliers, addSupplier, updateSupplier, deleteSupplier }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSuppliers = () => {
    const context = useContext(SupplierContext);
    if (!context) throw new Error('useSuppliers must be used within SupplierProvider');
    return context;
};
