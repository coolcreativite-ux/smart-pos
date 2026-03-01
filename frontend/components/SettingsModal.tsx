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

  // Vérifier si l'utilisateur est propriétaire ou admin
  const canEditCompanyInfo = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // État pour les informations entreprise
  const [companyData, setCompanyData] = useState({
    name: currentUser?.tenant?.name || '',
    ncc: currentUser?.tenant?.ncc || '',
    rccm: currentUser?.tenant?.rccm || '',
    address: currentUser?.tenant?.address || '',
    phone: currentUser?.tenant?.phone || '',
    email: currentUser?.tenant?.email || '',
  });
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentUser?.tenant?.logo_url || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // État pour les informations personnelles (tous les utilisateurs)
  const [personalData, setPersonalData] = useState({
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });
  const [isUpdatingPersonal, setIsUpdatingPersonal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (file) {

      // Vérifier le type de fichier

      if (!file.type.startsWith('image/')) {

        addToast('Veuillez sélectionner une image', 'error');

        return;

      }

      

      // Vérifier la taille (max 5MB)

      if (file.size > 5 * 1024 * 1024) {

        addToast('L\'image ne doit pas dépasser 5MB', 'error');

        return;

      }

      

      setLogoFile(file);

      

      // Créer une prévisualisation

      const reader = new FileReader();

      reader.onloadend = () => {

        setLogoPreview(reader.result as string);

      };

      reader.readAsDataURL(file);

    }

  };



  const handleUploadLogo = async () => {

    if (!logoFile || !currentUser || isUploadingLogo) return;



    setIsUploadingLogo(true);



    try {

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const formData = new FormData();

      formData.append('logo', logoFile);



      const response = await fetch(`${API_BASE_URL}/api/tenants/${currentUser.tenantId}/upload-logo`, {

        method: 'POST',

        headers: {

          'x-tenant-id': currentUser.tenantId.toString(),

          'x-user-id': currentUser.id.toString(),

        },

        body: formData,

      });



      if (!response.ok) {

        throw new Error('Erreur lors de l\'upload du logo');

      }



      const result = await response.json();

      addToast('Logo uploadé avec succès', 'success');

      

      // Mettre à jour la prévisualisation avec l'URL du serveur

      setLogoPreview(`${API_BASE_URL}${result.logoUrl}`);

      setLogoFile(null);

      

      // Recharger la page pour mettre à jour le contexte utilisateur

      setTimeout(() => {

        window.location.reload();

      }, 1000);

    } catch (error: any) {

      addToast(error.message || 'Erreur lors de l\'upload', 'error');

    } finally {

      setIsUploadingLogo(false);

    }

  };



  const handleRemoveLogo = async () => {

    if (!currentUser || isUploadingLogo) return;



    if (!confirm('Êtes-vous sûr de vouloir supprimer le logo ?')) return;



    setIsUploadingLogo(true);



    try {

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${API_BASE_URL}/api/tenants/${currentUser.tenantId}/logo`, {

        method: 'DELETE',

        headers: {

          'x-tenant-id': currentUser.tenantId.toString(),

          'x-user-id': currentUser.id.toString(),

        },

      });



      if (!response.ok) {

        throw new Error('Erreur lors de la suppression du logo');

      }



      addToast('Logo supprimé avec succès', 'success');

      setLogoPreview(null);

      setLogoFile(null);

      

      // Recharger la page pour mettre à jour le contexte utilisateur

      setTimeout(() => {

        window.location.reload();

      }, 1000);

    } catch (error: any) {

      addToast(error.message || 'Erreur lors de la suppression', 'error');

    } finally {

      setIsUploadingLogo(false);

    }

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
          name: companyData.name.trim() || null,
          ncc: companyData.ncc.trim() || null,
          rccm: companyData.rccm.trim() || null,
          address: companyData.address.trim() || null,
          phone: companyData.phone.trim() || null,
          email: companyData.email.trim() || null,
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

  const handleUpdatePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isUpdatingPersonal) return;

    setIsUpdatingPersonal(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentUser.tenantId.toString(),
          'x-user-id': currentUser.id.toString(),
        },
        body: JSON.stringify({
          email: personalData.email.trim() || null,
          phone: personalData.phone.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'email_exists') {
          throw new Error('Cet email est déjà utilisé par un autre utilisateur');
        }
        throw new Error('Erreur lors de la mise à jour');
      }

      addToast('Informations personnelles mises à jour', 'success');
      
      // Recharger la page pour mettre à jour le contexte utilisateur
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      addToast(error.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setIsUpdatingPersonal(false);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
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
            {/* Section Informations Entreprise - Visible uniquement pour Owner et Admin */}
            {canEditCompanyInfo && (
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
                {/* Section Logo */}

                <div className="bg-white dark:bg-slate-700/50 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">

                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">

                    Logo de l'entreprise

                  </label>

                  <div className="flex items-center gap-4">

                    {/* Prévisualisation du logo */}

                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center">

                      {logoPreview ? (

                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />

                      ) : (

                        <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />

                        </svg>

                      )}

                    </div>

                    

                    {/* Boutons d'action */}

                    <div className="flex-1 space-y-2">

                      <input

                        type="file"

                        id="logo-upload"

                        accept="image/*"

                        onChange={handleLogoChange}

                        className="hidden"

                      />

                      <label

                        htmlFor="logo-upload"

                        className="block w-full text-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors text-sm font-medium"

                      >

                        📁 Choisir une image

                      </label>

                      

                      {logoFile && (

                        <button

                          type="button"

                          onClick={handleUploadLogo}

                          disabled={isUploadingLogo}

                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors text-sm font-medium flex items-center justify-center gap-2"

                        >

                          {isUploadingLogo && <Spinner size="sm" />}

                          {isUploadingLogo ? 'Upload en cours...' : '⬆️ Uploader'}

                        </button>

                      )}

                      

                      {logoPreview && !logoFile && (

                        <button

                          type="button"

                          onClick={handleRemoveLogo}

                          disabled={isUploadingLogo}

                          className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"

                        >

                          🗑️ Supprimer le logo

                        </button>

                      )}

                    </div>

                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">

                    Le logo apparaîtra sur toutes vos factures et reçus. Format recommandé: PNG ou JPG, max 5MB

                  </p>

                </div>


                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nom de l'entreprise <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={companyData.name}
                    onChange={handleCompanyInputChange}
                    placeholder="Ex: Cool Digital Africa"
                    required
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Apparaîtra sur toutes vos factures et reçus
                  </p>
                </div>
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
                  <label htmlFor="rccm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    RCCM (Registre du Commerce et du Crédit Mobilier)
                  </label>
                  <input
                    type="text"
                    name="rccm"
                    id="rccm"
                    value={companyData.rccm}
                    onChange={handleCompanyInputChange}
                    placeholder="Ex: CI-ABJ-2024-B-12345"
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Registre officiel OHADA - Existence légale de l'entreprise
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
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={companyData.phone}
                    onChange={handleCompanyInputChange}
                    placeholder="Ex: +225 07 XX XX XX XX"
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Contact principal de l'entreprise
                  </p>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={companyData.email}
                    onChange={handleCompanyInputChange}
                    placeholder="Ex: contact@entreprise.com"
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Email de contact de l'entreprise
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
            )}

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

            {/* Section Informations Personnelles - Visible pour TOUS les utilisateurs */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Informations Personnelles
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Ces informations apparaîtront sur les factures que vous créez
              </p>
              <form onSubmit={handleUpdatePersonalInfo} className="space-y-4">
                <div>
                  <label htmlFor="personal-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="personal-email"
                    value={personalData.email}
                    onChange={handlePersonalInputChange}
                    placeholder="Ex: vendeur@entreprise.com"
                    required
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Votre email apparaîtra dans les informations du document
                  </p>
                </div>
                <div>
                  <label htmlFor="personal-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="personal-phone"
                    value={personalData.phone}
                    onChange={handlePersonalInputChange}
                    placeholder="Ex: +225 07 XX XX XX XX"
                    className="w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Votre numéro de téléphone personnel
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPersonal}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500 flex items-center justify-center min-w-[150px]"
                  >
                    {isUpdatingPersonal && <Spinner size="sm" className="mr-2" />}
                    Enregistrer
                  </button>
                </div>
              </form>
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
