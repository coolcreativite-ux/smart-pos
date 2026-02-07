
import React, { createContext, useState, ReactNode, useCallback, useContext, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { useActionLog } from './ActionLogContext';
import { db } from '../lib/database';
import { API_URL } from '../config';

type PasswordChangeResult = 'success' | 'incorrect_password' | 'user_not_found';
type AddUserResult = 'success' | 'username_exists' | 'email_exists';

interface UserContextType {
  users: User[];
  addUser: (userData: Omit<User, 'id'>, creatorTenantId?: number) => Promise<AddUserResult>;
  updateUser: (user: User) => Promise<'success' | 'email_exists'>;
  deleteUser: (userId: number) => Promise<void>;
  changePassword: (userId: number, oldPass: string, newPass: string) => Promise<PasswordChangeResult>;
  loadUsers: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('posUsers');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const { logAction } = useActionLog();

  // Charger les utilisateurs depuis la base de données
  const loadUsers = useCallback(async () => {
    try {
      // Charger depuis l'API backend
      const response = await fetch(`${API_URL}/api/users`);
      
      if (!response.ok) {
        console.warn('Erreur lors du chargement des utilisateurs depuis l\'API');
        return;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Convertir les données de la DB au format attendu
        const dbUsers: User[] = data.map((dbUser: any) => ({
          id: dbUser.id,
          tenantId: dbUser.tenant_id,
          username: dbUser.username,
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          password: 'admin123', // Mot de passe par défaut pour les tests
          role: dbUser.role as UserRole,
          permissions: getPermissionsForRole(dbUser.role as UserRole),
          assignedStoreId: dbUser.assigned_store_id
        }));

        setUsers(dbUsers);
        localStorage.setItem('posUsers', JSON.stringify(dbUsers));
        console.log('✅ Utilisateurs chargés depuis l\'API:', dbUsers.length);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des utilisateurs:', error);
    }
  }, []);

  // Charger les utilisateurs au démarrage
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const addUser = useCallback(async (userData: Omit<User, 'id'>, creatorTenantId?: number): Promise<AddUserResult> => {
    const trimmedUsername = userData.username.trim().toLowerCase();
    const trimmedEmail = userData.email?.trim().toLowerCase();

    if (users.some(u => u.username.toLowerCase() === trimmedUsername)) {
        return 'username_exists';
    }

    if (trimmedEmail && users.some(u => u.email?.toLowerCase() === trimmedEmail)) {
        return 'email_exists';
    }

    const newId = Math.max(0, ...users.map(u => u.id)) + 1;
    const finalTenantId = userData.role === UserRole.Owner ? newId : (creatorTenantId || 0);

    const newUser: User = {
        id: newId,
        ...userData,
        tenantId: finalTenantId,
    };

    // Sauvegarder dans la base de données via l'API
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: finalTenantId,
          username: newUser.username,
          email: newUser.email,
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          password: newUser.password, // Le serveur hashera le mot de passe
          role: newUser.role.toLowerCase(),
          assigned_store_id: newUser.assignedStoreId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur lors de la sauvegarde de l\'utilisateur dans la DB:', errorData);
        
        // Gérer les erreurs de contrainte unique
        if (errorData.error === 'username_exists') {
          return 'username_exists';
        }
        if (errorData.error === 'email_exists') {
          return 'email_exists';
        }
      } else {
        const dbUser = await response.json();
        console.log('✅ Utilisateur sauvegardé dans la base de données:', dbUser);
        
        // Mettre à jour l'ID et le tenant_id avec ceux de la base de données
        newUser.id = dbUser.id;
        newUser.tenantId = dbUser.tenant_id;
        
        // Si c'est un propriétaire et qu'une licence d'essai a été créée
        if (dbUser.trial_license) {
          console.log('🎁 Licence d\'essai automatique créée:', dbUser.trial_license.key);
          console.log('📅 Expire le:', new Date(dbUser.trial_license.expiry_date).toLocaleDateString());
          
          // La licence est déjà activée côté serveur, on recharge juste les licences
          // Le LicenseContext se mettra à jour automatiquement
        }
      }
    } catch (error) {
      console.error('❌ Erreur API lors de l\'ajout de l\'utilisateur:', error);
      // Continuer même en cas d'erreur pour sauvegarder localement
    }

    const newUsers = [...users, newUser];
    setUsers(newUsers);
    localStorage.setItem('posUsers', JSON.stringify(newUsers));
    
    await logAction(0, 'Admin', 'Add User', `Added user: ${newUser.username} (Tenant: ${newUser.tenantId})`, creatorTenantId || 0);
    return 'success';
  }, [users, logAction]);

  const updateUser = useCallback(async (updatedUser: User): Promise<'success' | 'email_exists'> => {
    const trimmedEmail = updatedUser.email?.trim().toLowerCase();

    if (trimmedEmail && users.some(u => u.id !== updatedUser.id && u.email?.toLowerCase() === trimmedEmail)) {
        return 'email_exists';
    }

    // Mettre à jour dans la base de données via l'API
    try {
      const response = await fetch(`${API_URL}/api/users/${updatedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: updatedUser.email,
          first_name: updatedUser.firstName,
          last_name: updatedUser.lastName,
          role: updatedUser.role.toLowerCase(),
          assigned_store_id: updatedUser.assignedStoreId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur lors de la mise à jour de l\'utilisateur dans la DB:', errorData);
        
        if (errorData.error === 'email_exists') {
          return 'email_exists';
        }
        throw new Error('Erreur lors de la mise à jour');
      }

      console.log('✅ Utilisateur mis à jour dans la base de données');
    } catch (error) {
      console.error('❌ Erreur API lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }

    // Mettre à jour le state local
    const newUsers = users.map(user => user.id === updatedUser.id ? updatedUser : user);
    setUsers(newUsers);
    localStorage.setItem('posUsers', JSON.stringify(newUsers));
    
    await logAction(0, 'Admin', 'Update User', `Updated user: ${updatedUser.username}`, updatedUser.tenantId);
    return 'success';
  }, [users, logAction]);
  
  const deleteUser = useCallback(async (userId: number): Promise<void> => {
    const userToDelete = users.find(u => u.id === userId);
    
    // Supprimer dans la base de données via l'API
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('❌ Erreur lors de la suppression de l\'utilisateur dans la DB');
        throw new Error('Erreur lors de la suppression');
      }

      console.log('✅ Utilisateur supprimé de la base de données');
    } catch (error) {
      console.error('❌ Erreur API lors de la suppression de l\'utilisateur:', error);
      throw error; // Propager l'erreur pour que l'UI puisse la gérer
    }
    
    // Supprimer du state local
    const newUsers = users.filter(user => user.id !== userId);
    setUsers(newUsers);
    localStorage.setItem('posUsers', JSON.stringify(newUsers));
    
    if (userToDelete) {
        await logAction(0, 'Admin', 'Delete User', `Deleted user: ${userToDelete.username}`, userToDelete.tenantId);
    }
  }, [users, logAction]);

  const changePassword = useCallback(async (userId: number, oldPass: string, newPass: string): Promise<PasswordChangeResult> => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'user_not_found';

    // Changer le mot de passe via l'API
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: oldPass,
          new_password: newPass
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.error === 'incorrect_password') {
          await logAction(userId, user.username, 'Password Change Failed', 'Incorrect old password', user.tenantId);
          return 'incorrect_password';
        }
        
        if (errorData.error === 'user_not_found') {
          return 'user_not_found';
        }
        
        throw new Error('Erreur lors du changement de mot de passe');
      }

      console.log('✅ Mot de passe changé dans la base de données');
      
      // Mettre à jour le mot de passe localement (pour la compatibilité)
      const updatedUser = { ...user, password: newPass };
      const newUsers = users.map(u => (u.id === userId ? updatedUser : u));
      setUsers(newUsers);
      localStorage.setItem('posUsers', JSON.stringify(newUsers));
      
      await logAction(userId, user.username, 'Password Change', 'Password updated successfully', user.tenantId);
      return 'success';
    } catch (error) {
      console.error('❌ Erreur API lors du changement de mot de passe:', error);
      throw error;
    }
  }, [users, logAction]);

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, changePassword, loadUsers }}>
      {children}
    </UserContext.Provider>
  );
};

// Fonction helper pour obtenir les permissions selon le rôle
function getPermissionsForRole(role: UserRole) {
  const ROLE_PERMISSIONS = {
    [UserRole.SuperAdmin]: {
      viewAnalytics: false,
      manageProducts: false,
      viewHistory: false,
      accessSettings: false,
      manageUsers: true,
      manageStores: false,
      manageLicenses: true,
    },
    [UserRole.Owner]: {
      viewAnalytics: true,
      manageProducts: true,
      viewHistory: true,
      accessSettings: true,
      manageUsers: true,
      manageStores: true,
      manageLicenses: false,
    },
    [UserRole.Admin]: {
      viewAnalytics: true,
      manageProducts: true,
      viewHistory: true,
      accessSettings: true,
      manageUsers: true,
      manageStores: true,
      manageLicenses: false,
    },
    [UserRole.Manager]: {
      viewAnalytics: true,
      manageProducts: true,
      viewHistory: true,
      accessSettings: false,
      manageUsers: false,
      manageStores: false,
      manageLicenses: false,
    },
    [UserRole.Cashier]: {
      viewAnalytics: false,
      manageProducts: false,
      viewHistory: true,
      accessSettings: false,
      manageUsers: false,
      manageStores: false,
      manageLicenses: false,
    },
  };

  return ROLE_PERMISSIONS[role];
}

export const useUsers = () => {
    const context = useContext(UserContext);
    if(context === undefined) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
}
