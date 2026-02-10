
import React, { createContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Customer, UserRole } from '../types';
import { MOCK_CUSTOMERS } from '../constants';
import { useStores } from './StoreContext';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'tenantId' | 'salesHistoryIds' | 'loyaltyPoints' | 'storeCredit'>) => Customer;
  updateCustomer: (customerData: Customer) => void;
  deleteCustomer: (customerId: number) => Promise<void>;
  updateCustomerAfterSale: (customerId: number, saleId: string, pointsEarned: number, pointsUsed: number) => void;
  addStoreCredit: (customerId: number, amount: number) => void;
  useStoreCredit: (customerId: number, amount: number) => boolean;
  loadCustomers: () => Promise<void>;
}

export const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const { currentStore } = useStores();

  // Charger les clients depuis la base de données via l'API backend
  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/customers`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Convertir les données de la DB au format attendu
        const dbCustomers: Customer[] = data.map((dbCustomer: any) => ({
          id: dbCustomer.id,
          tenantId: dbCustomer.tenant_id,
          firstName: dbCustomer.first_name,
          lastName: dbCustomer.last_name,
          email: dbCustomer.email,
          phone: dbCustomer.phone,
          salesHistoryIds: [], // TODO: Charger depuis les ventes
          loyaltyPoints: dbCustomer.loyalty_points || 0,
          storeCredit: parseFloat(dbCustomer.store_credit || 0),
          storeId: dbCustomer.store_id
        }));

        setAllCustomers(dbCustomers);
        localStorage.setItem('globalCustomers', JSON.stringify(dbCustomers));
        console.log('✅ Clients chargés depuis l\'API:', dbCustomers.length);
      } else {
        console.log('⚠️ Aucun client en DB');
        setAllCustomers([]);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des clients depuis l\'API:', error);
      // Fallback vers localStorage
      const saved = localStorage.getItem('globalCustomers');
      if (saved) {
        console.log('📦 Chargement depuis localStorage');
        setAllCustomers(JSON.parse(saved));
      } else {
        console.log('📦 Utilisation des données mock');
        const initial = MOCK_CUSTOMERS.map(c => ({...c, tenantId: 1}));
        setAllCustomers(initial);
        localStorage.setItem('globalCustomers', JSON.stringify(initial));
      }
    }
  }, []);

  // Charger les clients au démarrage
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Multi-Tenant Filter
  const customers = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.SuperAdmin) return allCustomers;
    return allCustomers.filter(c => c.tenantId === user.tenantId);
  }, [allCustomers, user]);

  const saveToGlobal = (newList: Customer[]) => {
      setAllCustomers(newList);
      localStorage.setItem('globalCustomers', JSON.stringify(newList));
  };

  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'tenantId' | 'salesHistoryIds' | 'loyaltyPoints' | 'storeCredit'>) => {
    if (!user) throw new Error("No user logged in");
    
    try {
      // Ajouter en base de données
      const response = await fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: user.tenantId,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          store_id: currentStore?.id || 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Client ajouté en DB:', result);
        
        // Recharger tous les clients depuis la DB
        await loadCustomers();
        
        // Retourner le client créé
        const newCustomer: Customer = {
          id: result.id,
          tenantId: user.tenantId,
          ...customerData,
          salesHistoryIds: [],
          loyaltyPoints: 0,
          storeCredit: 0,
          storeId: currentStore?.id || 1,
        };
        return newCustomer;
      }
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du client en DB:', error);
    }

    // Fallback vers localStorage
    const newCustomer: Customer = {
      id: Date.now(),
      tenantId: user.tenantId,
      ...customerData,
      salesHistoryIds: [],
      loyaltyPoints: 0,
      storeCredit: 0,
      storeId: currentStore?.id || 1, 
    };
    saveToGlobal([...allCustomers, newCustomer]);
    return newCustomer;
  }, [allCustomers, user, currentStore, loadCustomers]);

  const updateCustomer = useCallback(async (customerData: Customer) => {
    try {
      // Mettre à jour en base de données
      const response = await fetch(`${API_URL}/api/customers/${customerData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          loyalty_points: customerData.loyaltyPoints,
          store_credit: customerData.storeCredit,
          store_id: customerData.storeId
        })
      });
      
      if (response.ok) {
        console.log('✅ Client mis à jour en DB');
        // Recharger tous les clients depuis la DB
        await loadCustomers();
        return;
      }
    } catch (error) {
      console.warn('Erreur lors de la mise à jour du client en DB:', error);
    }

    // Fallback: Mettre à jour localement
    saveToGlobal(allCustomers.map(c => (c.id === customerData.id ? customerData : c)));
  }, [allCustomers, loadCustomers]);

  const deleteCustomer = useCallback(async (customerId: number): Promise<void> => {
    // Supprimer dans la base de données via l'API
    try {
      const response = await fetch(`${API_URL}/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('❌ Erreur lors de la suppression du client dans la DB');
        throw new Error('Erreur lors de la suppression');
      }

      console.log('✅ Client supprimé de la base de données');
      // Recharger tous les clients depuis la DB
      await loadCustomers();
    } catch (error) {
      console.error('❌ Erreur API lors de la suppression du client:', error);
      throw error; // Propager l'erreur pour que l'UI puisse la gérer
    }
  }, [loadCustomers]);
  
  const updateCustomerAfterSale = useCallback((customerId: number, saleId: string, pointsEarned: number, pointsUsed: number) => {
    const updatedCustomers = allCustomers.map(c => {
        if (c.id === customerId) {
            const updatedCustomer = {
                ...c,
                salesHistoryIds: [...c.salesHistoryIds, saleId],
                loyaltyPoints: c.loyaltyPoints + pointsEarned - pointsUsed,
            };
            
            // Mettre à jour en base de données de manière asynchrone
            updateCustomer(updatedCustomer);
            return updatedCustomer;
        }
        return c;
    });
    
    setAllCustomers(updatedCustomers);
  }, [allCustomers, updateCustomer]);

  const addStoreCredit = useCallback(async (customerId: number, amount: number) => {
    const customer = allCustomers.find(c => c.id === customerId);
    if (customer) {
      const updatedCustomer = { ...customer, storeCredit: customer.storeCredit + amount };
      await updateCustomer(updatedCustomer);
    }
  }, [allCustomers, updateCustomer]);

  const useStoreCredit = useCallback(async (customerId: number, amount: number): Promise<boolean> => {
    const customer = allCustomers.find(c => c.id === customerId);
    if (customer && customer.storeCredit >= amount) {
      const updatedCustomer = { ...customer, storeCredit: customer.storeCredit - amount };
      await updateCustomer(updatedCustomer);
      return true;
    }
    return false;
  }, [allCustomers, updateCustomer]);

  return (
    <CustomerContext.Provider value={{ 
      customers, 
      addCustomer, 
      updateCustomer,
      deleteCustomer,
      updateCustomerAfterSale, 
      addStoreCredit, 
      useStoreCredit,
      loadCustomers 
    }}>
      {children}
    </CustomerContext.Provider>
  );
};
