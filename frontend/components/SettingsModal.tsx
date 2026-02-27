import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import Spinner from './Spinner';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { changePassword } = useUsers();
  const { addToast } = useToast();

  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // État pour les informations entreprise
  const [companyData, setCompanyData] = useState({
    ncc: currentUser?.tenant?.ncc || '',
    address: currentUser?.tenant?.address || '',
  });
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isUpdatingCompany) return;

    setIsUpdatingCompany(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/tenants/${currentUser.tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser.tenantId.toString(),
          'x-user-id': currentUser.id.toString(),
        },
        body: JSON.stringify({
          ncc: companyData.ncc.trim() || null,
          address: companyData.address.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      addToast('Informations entreprise mises à jour', 'success');
      
      // Recharger la page pour mettre à jour le contexte utilisateur
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      addToast(error.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isUpdating) return;

    if (!passwordData.newPassword.trim()) {
      addToast(t('newPasswordEmpty'), 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast(t('newPasswordsDoNotMatch'), 'error');
      return;
    }

    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = await changePassword(currentUser.id, passwordData.currentPassword, passwordData.newPassword);
    setIsUpdating(false);

    if (result === 'success') {
      addToast(t('passwordUpdatedSuccess'), 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else if (result === 'incorrect_password') {
      addToast(t('incorrectCurrentPassword'), 'error');
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('settings')}
          </h2>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
            {/* Section Informations Entreprise */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Informations Entreprise
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Ces informations apparaîtront sur vos factures et reçus professionnels
              </p>
              <form onSubmit={handleUpdateCompanyInfo} className="space-y-4">
                <div>
                  <label htmlFor="ncc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    NCC (Numéro de Compte Contribuable)
                  </label>
                  <input
                    type="text"
                    name="ncc"
                    id="ncc"
                    value={companyData.ncc}
                    onChange={handleCompanyInputChange}
                    placeholder="Ex: CI-ABJ-2024-A-12345"
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Requis pour la facturation B2B
                  </p>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Adresse complète
                  </label>
                  <textarea
                    name="address"
                    id="address"
                    value={companyData.address}
                    onChange={handleCompanyInputChange}
                    placeholder="Ex: Abidjan, Cocody, Riviera Palmeraie"
                    rows={2}
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Apparaîtra sur tous vos documents
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingCompany}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 flex items-center justify-center min-w-[150px]"
                  >
                    {isUpdatingCompany && <Spinner size="sm" className="mr-2" />}
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('theme')}</label>
                <div className="flex rounded-md shadow-sm">
                    <button
                        onClick={() => setTheme('light')}
                        className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 text-sm font-medium transition-colors ${theme === 'light' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                    >
                        {t('light')}
                    </button>
                     <button
                        onClick={() => setTheme('dark')}
                        className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
                    >
                        {t('dark')}
                    </button>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{t('accountSettings')}</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('currentPassword')}</label>
                  <input type="password" name="currentPassword" id="currentPassword" value={passwordData.currentPassword} onChange={handleInputChange} required className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('newPassword')}</label>
                  <input type="password" name="newPassword" id="newPassword" value={passwordData.newPassword} onChange={handleInputChange} required className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('confirmNewPassword')}</label>
                  <input type="password" name="confirmPassword" id="confirmPassword" value={passwordData.confirmPassword} onChange={handleInputChange} required className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 flex items-center justify-center min-w-[150px]">
                    {isUpdating && <Spinner size="sm" className="mr-2" />}
                    {t('changePassword')}
                  </button>
                </div>
              </form>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
             <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;