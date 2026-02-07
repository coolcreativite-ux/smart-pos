
import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext } from 'react';
import { License } from '../types';
import { VALID_LICENSE_KEY } from '../constants';
import { API_URL } from '../config';

interface LicenseContextType {
  licenses: License[];
  generateLicense: (assignedTo: string, months: number, plan?: License['plan']) => Promise<License>;
  generateTrialLicense: (assignedTo: string) => License;
  revokeLicense: (id: string) => void;
  validateLicense: (key: string, tenantId?: number) => boolean;
  activateLicenseForTenant: (key: string, tenantId: number) => Promise<boolean>;
  isTenantActivated: (tenantId: number) => boolean;
}

export const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les licences depuis la base de données
  useEffect(() => {
    const loadLicenses = async () => {
      try {
        const response = await fetch('${API_URL}/api/licenses');
        if (response.ok) {
          const dbLicenses = await response.json();
          const formattedLicenses = dbLicenses.map((l: any) => ({
            id: l.id,
            key: l.key,
            tenantId: l.tenant_id,
            assignedTo: l.assigned_to,
            createdAt: new Date(l.created_at),
            expiryDate: new Date(l.expiry_date),
            isActive: l.is_active,
            plan: l.plan
          }));
          setLicenses(formattedLicenses);
        } else {
          // Fallback vers localStorage si l'API n'est pas disponible
          const saved = localStorage.getItem('posLicenses');
          if (saved) {
            const parsed = JSON.parse(saved);
            setLicenses(parsed.map((l: any) => ({ 
              ...l, 
              createdAt: new Date(l.createdAt),
              expiryDate: new Date(l.expiryDate)
            })));
          } else {
            // Licence de démo par défaut pour le tenant 1
            const defaultExpiry = new Date();
            defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 10);
            
            setLicenses([{
              id: 'default-demo',
              key: VALID_LICENSE_KEY,
              tenantId: 1,
              assignedTo: 'Demo Store',
              createdAt: new Date(),
              expiryDate: defaultExpiry,
              isActive: true,
              plan: 'ENTERPRISE'
            }]);
          }
        }
      } catch (error) {
        console.warn('Erreur chargement licences, utilisation localStorage:', error);
        // Fallback vers localStorage
        const saved = localStorage.getItem('posLicenses');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLicenses(parsed.map((l: any) => ({ 
            ...l, 
            createdAt: new Date(l.createdAt),
            expiryDate: new Date(l.expiryDate)
          })));
        } else {
          // Licence de démo par défaut pour le tenant 1
          const defaultExpiry = new Date();
          defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 10);
          
          setLicenses([{
            id: 'default-demo',
            key: VALID_LICENSE_KEY,
            tenantId: 1,
            assignedTo: 'Demo Store',
            createdAt: new Date(),
            expiryDate: defaultExpiry,
            isActive: true,
            plan: 'ENTERPRISE'
          }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadLicenses();
  }, []);

  useEffect(() => {
    localStorage.setItem('posLicenses', JSON.stringify(licenses));
  }, [licenses]);

  const generateLicense = useCallback(async (assignedTo: string, months: number, plan: License['plan'] = 'BUSINESS_PRO'): Promise<License> => {
    const segments = Array.from({ length: 4 }, () => 
        Math.random().toString(36).substring(2, 6).toUpperCase()
    );
    const newKey = `G-POS-${segments.join('-')}`;
    
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    
    const newLicense: License = {
        id: Date.now().toString(),
        key: newKey,
        assignedTo,
        createdAt: now,
        expiryDate: expiry,
        isActive: true,
        plan
    };
    
    // Sauvegarder dans la base de données
    try {
      const response = await fetch('${API_URL}/api/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: newKey,
          tenant_id: null, // Sera attribué lors de l'activation
          assigned_to: assignedTo,
          expiry_date: expiry.toISOString(),
          plan: plan
        }),
      });

      if (response.ok) {
        const dbLicense = await response.json();
        console.log('✅ Licence sauvegardée dans la base de données:', dbLicense.id);
        
        // Mettre à jour avec l'ID de la base de données
        newLicense.id = dbLicense.id;
      } else {
        console.error('❌ Erreur lors de la sauvegarde de la licence dans la DB');
      }
    } catch (error) {
      console.error('❌ Erreur API lors de la création de la licence:', error);
    }
    
    setLicenses(prev => [newLicense, ...prev]);
    return newLicense;
  }, []);

  const generateTrialLicense = useCallback((assignedTo: string): License => {
    const segments = Array.from({ length: 4 }, () => 
        Math.random().toString(36).substring(2, 6).toUpperCase()
    );
    const newKey = `G-TRIAL-${segments.join('-')}`;
    
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 14);
    
    const newLicense: License = {
        id: `trial_${Date.now()}`,
        key: newKey,
        assignedTo,
        createdAt: now,
        expiryDate: expiry,
        isActive: true,
        plan: 'BUSINESS_PRO'
    };
    
    setLicenses(prev => [newLicense, ...prev]);
    return newLicense;
  }, []);

  const revokeLicense = useCallback((id: string) => {
    setLicenses(prev => prev.filter(l => l.id !== id));
  }, []);

  const validateLicense = useCallback((key: string, tenantId?: number) => {
    const foundLicense = licenses.find(l => l.key === key && l.isActive);
    if (!foundLicense) return false;
    
    // Si un tenantId est fourni, on vérifie que la licence lui appartient ou n'est pas encore attribuée
    if (tenantId !== undefined && foundLicense.tenantId !== undefined && foundLicense.tenantId !== tenantId) {
        return false;
    }

    const now = new Date();
    return now < foundLicense.expiryDate;
  }, [licenses]);

  const activateLicenseForTenant = useCallback(async (key: string, tenantId: number): Promise<boolean> => {
      let success = false;
      let licenseToUpdate: License | null = null;
      
      setLicenses(prev => {
          const licenseIndex = prev.findIndex(l => 
              l.key === key && 
              l.isActive && 
              (l.tenantId === undefined || l.tenantId === null || l.tenantId === tenantId)
          );
          
          if (licenseIndex === -1) {
              console.log('❌ Licence non trouvée ou déjà attribuée');
              return prev;
          }

          const now = new Date();
          if (now > prev[licenseIndex].expiryDate) {
              console.log('❌ Licence expirée');
              return prev;
          }

          success = true;
          licenseToUpdate = prev[licenseIndex];
          const newList = [...prev];
          newList[licenseIndex] = { ...newList[licenseIndex], tenantId };
          
          console.log('✅ Licence activée pour le tenant:', tenantId);
          return newList;
      });
      
      // Mettre à jour dans la base de données
      if (success && licenseToUpdate) {
          try {
              const response = await fetch(`${API_URL}/api/licenses/${licenseToUpdate.id}`, {
                  method: 'PATCH',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      tenant_id: tenantId
                  }),
              });

              if (response.ok) {
                  console.log('✅ Licence mise à jour dans la base de données');
                  // Sauvegarder la clé active dans localStorage
                  localStorage.setItem('active_license_key', key);
              } else {
                  console.error('❌ Erreur lors de la mise à jour de la licence dans la DB');
              }
          } catch (error) {
              console.error('❌ Erreur API lors de la mise à jour de la licence:', error);
          }
      }
      
      return success;
  }, []);

  const isTenantActivated = useCallback((tenantId: number): boolean => {
      const now = new Date();
      return licenses.some(l => l.tenantId === tenantId && l.isActive && now < l.expiryDate);
  }, [licenses]);

  return (
    <LicenseContext.Provider value={{ 
        licenses, 
        generateLicense, 
        generateTrialLicense, 
        revokeLicense, 
        validateLicense,
        activateLicenseForTenant,
        isTenantActivated
    }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicenses = () => {
    const context = useContext(LicenseContext);
    if (!context) throw new Error('useLicenses must be used within LicenseProvider');
    return context;
};
