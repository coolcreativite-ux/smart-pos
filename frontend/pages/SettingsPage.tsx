
import React, { useState, useMemo, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { useSettings } from '../contexts/SettingsContext';
import { useUsers } from '../contexts/UserContext';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useProducts } from '../hooks/useProducts';
import { useLanguage } from '../hooks/useLanguage';
import { User, UserRole } from '../types';
import AddUserModal from '../components/AddUserModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import PromoCodeManagement from '../components/PromoCodeManagement';
import { useActionLog } from '../contexts/ActionLogContext';
import { useStores } from '../contexts/StoreContext';
import PrintingSettings from '../components/PrintingSettings';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { users, updateUser, deleteUser, addUser, resetPassword } = useUsers();
  const { clearSalesHistory } = useSalesHistory();
  const { resetProducts } = useProducts();
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const { logs, logAction } = useActionLog();
  const { stores } = useStores();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [isResettingProducts, setIsResettingProducts] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userStoreFilter, setUserStoreFilter] = useState<number | 'all'>('all');
  const [showPrintingSettings, setShowPrintingSettings] = useState(false);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);

  // Cropper state for logo
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('loyaltyProgram.')) {
        const key = name.split('.')[1];
        setLocalSettings(prev => ({
            ...prev,
            loyaltyProgram: {
                ...prev.loyaltyProgram,
                [key]: type === 'checkbox' ? checked : parseFloat(value) || 0,
            }
        }));
    } else {
        setLocalSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveLogo = async () => {
    if (imageToCrop && croppedAreaPixels) {
      const croppedImg = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImg) {
        setLocalSettings(prev => ({ ...prev, storeLogoUrl: croppedImg }));
      }
      setImageToCrop(null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingGeneral(true);
    await new Promise(resolve => setTimeout(resolve, 750));
    updateSettings(localSettings);
    addToast(t('settingsSaved'), 'success');
    setIsSavingGeneral(false);
  };

  const handleRoleChange = async (user: User, e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateUser({ ...user, role: e.target.value as UserRole });
  };
  
  const handleClearHistory = async () => {
      if(window.confirm(t('clearSalesHistoryConfirm'))) {
          setIsClearingHistory(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          clearSalesHistory();
          addToast(t('salesHistoryCleared'), 'success');
          setIsClearingHistory(false);
      }
  }

  const handleResetProducts = async () => {
      if(window.confirm(t('resetProductsConfirm'))) {
          setIsResettingProducts(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          resetProducts(currentUser!);
          addToast(t('productsReset'), 'success');
          setIsResettingProducts(false);
      }
  }
  
  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleSaveUser = async (userData: Omit<User, 'id'> | User) => {
    if ('id' in userData) {
      const res = await updateUser(userData);
      if (res === 'success') {
        addToast(t('userUpdatedSuccess'), 'success');
        setIsUserFormOpen(false);
      } else {
        addToast(t('emailExistsError'), 'error');
      }
    } else {
      const result = await addUser(userData, currentUser?.tenantId);
      if (result === 'success') {
        addToast(t('userAddedSuccess'), 'success');
        setIsUserFormOpen(false);
      } else if (result === 'email_exists') {
        addToast(t('emailExistsError'), 'error');
      } else {
        addToast(t('userExistsError'), 'error');
      }
    }
  };
  
  const handleDeleteUser = async (userId: number) => {
    if (currentUser && userId === currentUser.id) {
        addToast(t('cannotDeleteSelf'), 'error');
        return;
    }
    if (window.confirm(t('confirmDeleteUser'))) {
        await deleteUser(userId, currentUser?.id);
        addToast(t('userDeletedSuccess'), 'success');
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resettingPasswordUser || !currentUser) return;

    try {
      const result = await resetPassword(resettingPasswordUser.id, newPassword, currentUser.id);
      
      if (result === 'success') {
        addToast(t('resetPasswordSuccess'), 'success');
      } else if (result === 'unauthorized') {
        addToast(t('resetPasswordUnauthorized'), 'error');
      } else if (result === 'cannot_reset_admin_password') {
        addToast(t('resetPasswordCannotResetAdmin'), 'error');
      } else if (result === 'insufficient_permissions') {
        addToast(t('resetPasswordInsufficientPermissions'), 'error');
      } else {
        addToast(t('resetPasswordError'), 'error');
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      addToast(t('resetPasswordError'), 'error');
    }
  };
  
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Date invalide';
      }
      return new Intl.DateTimeFormat(language, {
          dateStyle: 'medium',
          timeStyle: 'short'
      }).format(dateObj);
    } catch (error) {
      console.warn('Erreur formatage date:', error, date);
      return 'Date invalide';
    }
  };

  const getStoreName = (storeId?: number) => {
      if (!storeId) return t('allStores');
      return stores.find(s => s.id === storeId)?.name || 'Unknown Store';
  };

  const filteredUsers = useMemo(() => {
      // Isolation Multi-Tenant
      let result = users;
      
      if (currentUser?.role !== UserRole.SuperAdmin) {
          result = result.filter(u => u.tenantId === currentUser?.tenantId);
      }

      if (userStoreFilter !== 'all') {
          result = result.filter(u => u.assignedStoreId === userStoreFilter);
      }
      
      // SECURITE : Filtrage strict du SuperAdmin
      if (currentUser?.role !== UserRole.SuperAdmin) {
          result = result.filter(u => u.role !== UserRole.SuperAdmin);
      }

      // Les Admins et inférieurs ne voient jamais les Propriétaires
      if (currentUser?.role !== UserRole.SuperAdmin && currentUser?.role !== UserRole.Owner) {
          result = result.filter(u => u.role !== UserRole.Owner);
      }
      
      return result;
  }, [users, userStoreFilter, currentUser]);

  const filteredLogs = useMemo(() => {
      if (currentUser?.role === UserRole.SuperAdmin) return logs;
      return logs.filter(log => log.tenantId === currentUser?.tenantId);
  }, [logs, currentUser]);

  const availableRoles = useMemo(() => {
      const roles = Object.values(UserRole);
      if (currentUser?.role === UserRole.SuperAdmin) return roles;
      
      let filtered = roles.filter(r => r !== UserRole.SuperAdmin);
      if (currentUser?.role !== UserRole.Owner) {
          filtered = filtered.filter(r => r !== UserRole.Owner);
      }
      return filtered;
  }, [currentUser]);

  return (
    <div className="space-y-8">
      {/* Logo Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-[70] p-4">
            <div className="relative w-full max-w-lg h-96 bg-slate-900 rounded-lg overflow-hidden">
                <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                />
            </div>
            <div className="mt-4 flex flex-col gap-4 w-full max-w-lg">
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                <div className="flex gap-4 justify-center">
                    <button type="button" onClick={() => setImageToCrop(null)} className="px-6 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg">Annuler</button>
                    <button type="button" onClick={handleSaveLogo} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg">Valider le Logo</button>
                </div>
            </div>
        </div>
      )}

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('appSettings')}</h2>

      {/* General Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">{t('generalSettings')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('storeName')}</label>
              <input type="text" id="storeName" name="storeName" value={localSettings.storeName} onChange={handleSettingsChange} className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('taxRate')}</label>
              <input type="number" id="taxRate" name="taxRate" value={localSettings.taxRate} onChange={handleSettingsChange} min="0" step="0.1" className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/20">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo du magasin</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">Apparaît uniquement sur les tickets de caisse</p>
            <div className="w-32 h-32 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white flex items-center justify-center mb-4 shadow-inner relative group">
                {localSettings.storeLogoUrl ? (
                    <img src={localSettings.storeLogoUrl} alt="Logo du magasin" className="w-full h-full object-contain" />
                ) : (
                    <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={() => logoInputRef.current?.click()} 
                    className="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    {localSettings.storeLogoUrl ? 'Changer le logo' : 'Importer un logo'}
                </button>
                {localSettings.storeLogoUrl && (
                    <button 
                        type="button" 
                        onClick={() => setLocalSettings(p => ({...p, storeLogoUrl: undefined}))} 
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <button onClick={handleSaveSettings} disabled={isSavingGeneral} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-slate-400 flex items-center justify-center min-w-[200px] shadow-lg shadow-indigo-500/20">
                {isSavingGeneral && <Spinner size="sm" className="mr-2" />}
                {t('saveSettings')}
            </button>
        </div>
      </div>
      
      {/* Loyalty Program */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">{t('loyaltyProgram')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('loyaltySettingsDesc')}</p>
        <div className="space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="loyaltyEnabled" name="loyaltyProgram.enabled" checked={localSettings.loyaltyProgram.enabled} onChange={handleSettingsChange} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
            <label htmlFor="loyaltyEnabled" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('enableLoyaltyProgram')}</label>
          </div>
          {localSettings.loyaltyProgram.enabled && (
              <>
                <div>
                    <label htmlFor="pointsPerDollar" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('pointsPerDollar')}</label>
                    <input type="number" id="pointsPerDollar" name="loyaltyProgram.pointsPerDollar" value={localSettings.loyaltyProgram.pointsPerDollar} onChange={handleSettingsChange} min="0" className="mt-1 w-full max-w-sm px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="pointValue" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('pointValue')}</label>
                    <input type="number" id="pointValue" name="loyaltyProgram.pointValue" value={localSettings.loyaltyProgram.pointValue * 100} onChange={(e) => {
                        const event = { ...e, target: { ...e.target, name: 'loyaltyProgram.pointValue', value: String(parseFloat(e.target.value) / 100) }};
                        handleSettingsChange(event);
                    }} min="0" step="0.01" className="mt-1 w-full max-w-sm px-3 py-2" />
                </div>
              </>
          )}
        </div>
        <div className="mt-6 flex items-center gap-4">
            <button onClick={handleSaveSettings} disabled={isSavingGeneral} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 flex items-center justify-center min-w-[150px]">
                {isSavingGeneral && <Spinner size="sm" className="mr-2" />}
                {t('saveSettings')}
            </button>
            <button 
                onClick={() => setShowPrintingSettings(true)} 
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Paramètres d'Impression
            </button>
        </div>
      </div>

      {/* Promo Code Management */}
      <PromoCodeManagement />

      {/* User Management */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('userManagement')}</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Afficher le filtre des magasins seulement s'il y a plus d'un magasin */}
                {stores.length > 1 && (
                    <select 
                        value={userStoreFilter} 
                        onChange={(e) => setUserStoreFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="flex-grow sm:flex-grow-0 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                        <option value="all">{t('allStores')}</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                )}
                <button 
                    onClick={handleAddUser}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg transition-colors hover:bg-indigo-700 whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>{t('addUser')}</span>
                </button>
            </div>
        </div>
         <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3">{t('fullName')}</th>
                  <th scope="col" className="px-6 py-3">{t('username')}</th>
                  <th scope="col" className="px-6 py-3">{t('email')}</th>
                  <th scope="col" className="px-6 py-3">{t('assignedStore')}</th>
                  <th scope="col" className="px-6 py-3">{t('role')}</th>
                  <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{`${user.firstName} ${user.lastName}`}</td>
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user.email || '-'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{getStoreName(user.assignedStoreId)}</td>
                    <td className="px-6 py-4">
                      <select value={user.role} onChange={(e) => handleRoleChange(user, e)} className="px-3 py-1.5 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        {availableRoles.map(role => (
                          <option key={role} value={role}>{t(role)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                       <button 
                          onClick={() => handleEditUser(user)} 
                          className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                          {t('edit')}
                      </button>
                      <button 
                          onClick={() => setResettingPasswordUser(user)}
                          disabled={currentUser?.role !== 'superadmin' && currentUser?.role !== 'owner' && currentUser?.role !== 'admin'}
                          className="font-medium text-amber-600 dark:text-amber-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                          title="Réinitialiser le mot de passe"
                      >
                          🔑
                      </button>
                      <button 
                          onClick={() => handleDeleteUser(user.id)} 
                          disabled={currentUser?.id === user.id}
                          className="font-medium text-red-600 dark:text-red-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                          aria-label={t('delete')}
                      >
                          {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map(user => (
                    <div key={user.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">{`${user.firstName} ${user.lastName}`}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{user.username}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                <p className="text-xs text-indigo-500 mt-1">{getStoreName(user.assignedStoreId)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => handleEditUser(user)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{t('edit')}</button>
                                <button 
                                    onClick={() => setResettingPasswordUser(user)}
                                    disabled={currentUser?.role !== 'superadmin' && currentUser?.role !== 'owner' && currentUser?.role !== 'admin'}
                                    className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500"
                                    title="Réinitialiser"
                                >
                                    🔑
                                </button>
                                <button onClick={() => handleDeleteUser(user.id)} disabled={currentUser?.id === user.id} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-500">{t('delete')}</button>
                            </div>
                        </div>
                        <div className="mt-2">
                            <label htmlFor={`role-${user.id}`} className="sr-only">{t('role')}</label>
                            <select id={`role-${user.id}`} value={user.role} onChange={(e) => handleRoleChange(user, e)} className="w-full px-3 py-1.5 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                {availableRoles.map(role => (
                                    <option key={role} value={role}>{t(role)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('activityLog')}</h3>
          <button 
            onClick={() => {
              if (currentUser) {
                logAction(currentUser.id, currentUser.username, 'Test Action', 'Test log entry from settings page', currentUser.tenantId);
                addToast('Log de test ajouté', 'success');
              }
            }}
            className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
          >
            Test Log
          </button>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
            {filteredLogs.length > 0 ? (
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                    <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">{t('timestamp')}</th>
                            <th className="px-6 py-3">{t('user')}</th>
                            <th className="px-6 py-3">{t('action')}</th>
                            <th className="px-6 py-3">{t('details')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <td className="px-6 py-4 font-mono text-xs">{formatDate(log.timestamp)}</td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.username}</td>
                                <td className="px-6 py-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{log.action}</span></td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-xs" title={log.details}>{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t('noActivityLog')}</p>
            )}
        </div>
      </div>

      {/* Data Management - Danger Zone */}
       <div className="border-2 border-red-500/50 dark:border-red-500/30 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">{t('dangerZone')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('dataManagement')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleClearHistory} disabled={isClearingHistory} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 flex items-center justify-center min-w-[180px]">
                    {isClearingHistory && <Spinner size="sm" className="mr-2" />}
                    {t('clearSalesHistory')}
                </button>
                 <button onClick={handleResetProducts} disabled={isResettingProducts} className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 flex items-center justify-center min-w-[180px]">
                    {isResettingProducts && <Spinner size="sm" className="mr-2" />}
                    {t('resetProducts')}
                </button>
            </div>
      </div>
        
      {isUserFormOpen && (
        <AddUserModal
            userToEdit={editingUser}
            onClose={() => setIsUserFormOpen(false)}
            onSave={handleSaveUser}
        />
      )}

      {showPrintingSettings && (
        <PrintingSettings onClose={() => setShowPrintingSettings(false)} />
      )}

      {resettingPasswordUser && (
        <ResetPasswordModal
          user={resettingPasswordUser}
          onClose={() => setResettingPasswordUser(null)}
          onReset={handleResetPassword}
        />
      )}

    </div>
  );
};

export default SettingsPage;
