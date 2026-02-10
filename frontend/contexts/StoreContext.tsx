
import React, { createContext, useState, ReactNode, useCallback, useContext, useMemo, useEffect } from 'react';
import { Store, UserRole } from '../types';
import { MOCK_STORES } from '../constants';
import { useActionLog } from './ActionLogContext';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  addStore: (storeData: Omit<Store, 'id' | 'tenantId'>) => void;
  updateStore: (store: Store) => void;
  deleteStore: (storeId: number) => void;
  loadStores: () => Promise<void>;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allStores, setAllStores] = useState<Store[]>([]);
  const { logAction } = useActionLog();

  // Charger les magasins depuis la base de données via l'API backend
  const loadStores = useCallback(async () => {
    try {
      // Utiliser l'API backend au lieu de Supabase directement
      const response = await fetch(`${API_URL}/api/stores`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Convertir les données de la DB au format attendu
        const dbStores: Store[] = data.map((dbStore: any) => ({
          id: dbStore.id,
          tenantId: dbStore.tenant_id,
          name: dbStore.name,
          location: dbStore.location,
          phone: dbStore.phone
        }));

        setAllStores(dbStores);
        // Mettre à jour le localStorage avec les données de la DB (source de vérité)
        localStorage.setItem('globalStores', JSON.stringify(dbStores));
        console.log('✅ Magasins chargés depuis l\'API:', dbStores.length);
      } else {
        // Si la DB est vide, utiliser les données mock
        console.log('⚠️ Aucun magasin en DB, utilisation des données mock');
        setAllStores(MOCK_STORES);
        localStorage.setItem('globalStores', JSON.stringify(MOCK_STORES));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des magasins depuis l\'API:', error);
      // Fallback vers localStorage
      const saved = localStorage.getItem('globalStores');
      if (saved) {
        console.log('📦 Chargement depuis localStorage');
        setAllStores(JSON.parse(saved));
      } else {
        console.log('📦 Utilisation des données mock');
        setAllStores(MOCK_STORES);
        localStorage.setItem('globalStores', JSON.stringify(MOCK_STORES));
      }
    }
  }, []);

  // Charger les magasins au démarrage
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Filtrage Multi-Tenant avec permissions par rôle
  const stores = useMemo(() => {
    if (!user) return [];
    
    // SuperAdmin voit tous les magasins
    if (user.role === UserRole.SuperAdmin) return allStores;
    
    // Filtrer par tenant d'abord
    const tenantStores = allStores.filter(s => s.tenantId === user.tenantId);
    
    // Si l'utilisateur peut gérer tous les magasins (Owner/Admin)
    if (user.permissions.manageStores) {
      return tenantStores;
    }
    
    // Si l'utilisateur est assigné à un magasin spécifique (Manager/Cashier)
    if (user.assignedStoreId) {
      return tenantStores.filter(s => s.id === user.assignedStoreId);
    }
    
    // Par défaut, aucun magasin visible
    return [];
  }, [allStores, user]);

  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);

  useEffect(() => {
      if (stores.length > 0 && !currentStore) {
          setCurrentStoreState(stores[0]);
      }
  }, [stores, currentStore]);

  const saveToGlobal = (newList: Store[]) => {
      setAllStores(newList);
      localStorage.setItem('globalStores', JSON.stringify(newList));
  };

  const setCurrentStore = useCallback((store: Store) => {
    setCurrentStoreState(store);
  }, []);

  const addStore = useCallback(async (storeData: Omit<Store, 'id' | 'tenantId'>) => {
    if (!user) return;
    
    try {
      // Ajouter en base de données
      const response = await fetch(`${API_URL}/api/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: user.tenantId,
          name: storeData.name,
          location: storeData.location,
          phone: storeData.phone
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Magasin ajouté en DB:', result);
        
        // Recharger tous les magasins depuis la DB pour être sûr d'avoir les données à jour
        await loadStores();
        await logAction(user.id, user.username, 'Add Store', `Added store: ${storeData.name}`, user.tenantId);
        return;
      }
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du magasin en DB:', error);
    }

    // Fallback vers localStorage
    const newStore: Store = {
      id: Date.now(),
      tenantId: user.tenantId,
      ...storeData
    };
    saveToGlobal([...allStores, newStore]);
    await logAction(user.id, user.username, 'Add Store', `Added store: ${newStore.name}`, user.tenantId);
  }, [allStores, user, logAction, loadStores]);

  const updateStore = useCallback(async (updatedStore: Store) => {
    try {
      // Mettre à jour en base de données
      const response = await fetch(`${API_URL}/api/stores/${updatedStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedStore.name,
          location: updatedStore.location,
          phone: updatedStore.phone
        })
      });
      
      if (response.ok) {
        console.log('✅ Magasin mis à jour en DB');
        // Recharger tous les magasins depuis la DB
        await loadStores();
        if (currentStore?.id === updatedStore.id) setCurrentStoreState(updatedStore);
        return;
      }
    } catch (error) {
      console.warn('Erreur lors de la mise à jour du magasin en DB:', error);
    }

    // Fallback: Mettre à jour localement
    saveToGlobal(allStores.map(s => s.id === updatedStore.id ? updatedStore : s));
    if (currentStore?.id === updatedStore.id) setCurrentStoreState(updatedStore);
  }, [allStores, currentStore, loadStores]);

  const deleteStore = useCallback(async (storeId: number) => {
    try {
      // Supprimer en base de données
      const response = await fetch(`${API_URL}/api/stores/${storeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Magasin supprimé de la DB');
        // Recharger tous les magasins depuis la DB
        await loadStores();
        if (currentStore?.id === storeId) setCurrentStoreState(null);
        return;
      }
    } catch (error) {
      console.warn('Erreur lors de la suppression du magasin en DB:', error);
    }

    // Fallback: Supprimer localement
    saveToGlobal(allStores.filter(s => s.id !== storeId));
    if (currentStore?.id === storeId) setCurrentStoreState(null);
  }, [allStores, currentStore, loadStores]);

  return (
    <StoreContext.Provider value={{ 
      stores, 
      currentStore, 
      setCurrentStore, 
      addStore, 
      updateStore, 
      deleteStore,
      loadStores 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStores = () => {
    const context = useContext(StoreContext);
    if(context === undefined) throw new Error('useStores must be used within a StoreProvider');
    return context;
};
