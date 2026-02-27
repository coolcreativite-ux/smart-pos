
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLicenses } from '../contexts/LicenseContext';
import { useUsers } from '../contexts/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../contexts/ToastContext';
import { User, UserRole, Permissions, License } from '../types';
import { ROLE_PERMISSIONS } from '../constants';
import Spinner from '../components/Spinner';
import AddUserModal from '../components/AddUserModal';
import { generateLicenseEmail } from '../services/geminiService';
import { sendRealEmail } from '../services/emailService';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { useSaasBranding } from '../contexts/SaasBrandingContext';

const SuperAdminPage: React.FC = () => {
    const { licenses, generateLicense, revokeLicense } = useLicenses();
    const { users, addUser, updateUser, deleteUser } = useUsers();
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const { refreshBranding } = useSaasBranding();
    
    const [activeTab, setActiveTab] = useState<'licenses' | 'owners' | 'roles' | 'customization'>('licenses');
    const [selectedOwnerId, setSelectedOwnerId] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('12'); // 1 an par défaut
    const [selectedPlan, setSelectedPlan] = useState<License['plan']>('BUSINESS_PRO');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingOwner, setEditingOwner] = useState<User | null>(null);
    
    // États pour l'aperçu et l'édition de l'email
    const [sentEmailPreview, setSentEmailPreview] = useState<string | null>(null);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isDelivering, setIsDelivering] = useState(false);
    const [currentLicenseKey, setCurrentLicenseKey] = useState<string | null>(null);

    const [systemPermissions, setSystemPermissions] = useState<Record<UserRole, Permissions>>(() => {
        const saved = localStorage.getItem('custom_system_permissions');
        return saved ? JSON.parse(saved) : ROLE_PERMISSIONS;
    });

    // États pour la personnalisation
    const [appSettings, setAppSettings] = useState<Record<string, any>>({});
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // États pour l'upload de logo SaaS
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const [logoToCrop, setLogoToCrop] = useState<string | null>(null);
    const [faviconToCrop, setFaviconToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [currentLogoType, setCurrentLogoType] = useState<'logo' | 'favicon' | null>(null);
    
    // États pour les URLs
    const [logoUrl, setLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');

    const owners = useMemo(() => users.filter(u => u.role === UserRole.Owner), [users]);

    // Charger les paramètres de personnalisation
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoadingSettings(true);
            const response = await fetch(`${API_URL}/api/app-settings`);
            if (response.ok) {
                const data = await response.json();
                setAppSettings(data);
                console.log('✅ Paramètres chargés:', data);
            }
        } catch (error) {
            console.error('Erreur chargement paramètres:', error);
            addToast('Erreur lors du chargement des paramètres', 'error');
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const handleSettingChange = (key: string, value: any) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        try {
            setIsSavingSettings(true);
            
            // Sauvegarder tous les paramètres modifiés
            const promises = Object.entries(appSettings).map(([key, value]) =>
                fetch(`${API_URL}/api/app-settings/${key}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value })
                })
            );
            
            await Promise.all(promises);
            addToast('Paramètres sauvegardés avec succès !', 'success');
            await loadSettings(); // Recharger pour confirmer
        } catch (error) {
            console.error('Erreur sauvegarde paramètres:', error);
            addToast('Erreur lors de la sauvegarde', 'error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    // Fonctions pour l'upload de logo SaaS
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (type === 'logo') {
                    setLogoToCrop(reader.result as string);
                } else {
                    setFaviconToCrop(reader.result as string);
                }
                setCurrentLogoType(type);
            };
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleSaveLogo = async () => {
        if (!croppedAreaPixels || !currentLogoType) return;
        
        try {
            setIsUploadingLogo(true);
            const imageToCrop = currentLogoType === 'logo' ? logoToCrop : faviconToCrop;
            
            if (!imageToCrop) return;

            // Créer l'image croppée en base64
            const croppedImgBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
            if (!croppedImgBase64) return;

            // Convertir base64 en Blob
            const response = await fetch(croppedImgBase64);
            const blob = await response.blob();
            
            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('file', blob, `${currentLogoType}.png`);
            formData.append('type', currentLogoType);

            // Uploader le fichier
            const uploadResponse = await fetch(`${API_URL}/api/app-settings/upload-logo-file`, {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Erreur lors de l\'upload');
            }

            const result = await uploadResponse.json();
            console.log('✅ Logo uploadé:', result.url);

            addToast(`${currentLogoType === 'logo' ? 'Logo' : 'Favicon'} mis à jour avec succès !`, 'success');
            await loadSettings();
            
            // Vider le cache et rafraîchir le branding
            localStorage.removeItem('saas_branding_cache');
            await refreshBranding();
            
            // Nettoyer les états
            setLogoToCrop(null);
            setFaviconToCrop(null);
            setCurrentLogoType(null);
            
        } catch (error) {
            console.error('Erreur upload logo:', error);
            addToast('Erreur lors de l\'upload', 'error');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    // Fonction pour sauvegarder une URL directement
    const handleSaveLogoUrl = async (type: 'logo' | 'favicon') => {
        const url = type === 'logo' ? logoUrl : faviconUrl;
        
        if (!url.trim()) {
            addToast('Veuillez saisir une URL', 'error');
            return;
        }

        try {
            setIsUploadingLogo(true);
            const settingKey = type === 'logo' ? 'saas_logo_url' : 'saas_favicon_url';
            
            await fetch(`${API_URL}/api/app-settings/${settingKey}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: url })
            });

            addToast(`${type === 'logo' ? 'Logo' : 'Favicon'} URL sauvegardée !`, 'success');
            await loadSettings();
            
            // Vider le cache et rafraîchir le branding
            localStorage.removeItem('saas_branding_cache');
            await refreshBranding();
            
            // Réinitialiser le champ
            if (type === 'logo') setLogoUrl('');
            else setFaviconUrl('');
            
        } catch (error) {
            console.error('Erreur sauvegarde URL:', error);
            addToast('Erreur lors de la sauvegarde', 'error');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleGenerateLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        const owner = owners.find(o => o.id === Number(selectedOwnerId));
        if (!owner) return;
        
        setIsGenerating(true);
        
        // 1. Générer la licence avec le plan sélectionné
        const newLicense = await generateLicense(`${owner.firstName} ${owner.lastName}`, Number(selectedPeriod), selectedPlan);
        setCurrentLicenseKey(newLicense.key);
        
        // 2. Générer l'email via Gemini
        try {
            const periodLabel = selectedPeriod === '1200' ? "À vie" : `${selectedPeriod} mois`;
            const emailContent = await generateLicenseEmail({
                ownerName: `${owner.firstName} ${owner.lastName}`,
                licenseKey: newLicense.key,
                expiryDate: formatDate(newLicense.expiryDate),
                duration: `${periodLabel} (Plan: ${selectedPlan})`
            });
            setSentEmailPreview(emailContent);
        } catch (err) {
            console.error(err);
        }
        
        addToast(t('licenseAdded'), 'success');
        setSelectedOwnerId('');
        setIsGenerating(false);
    };

    const handleFinalSendLicense = async () => {
        if (!sentEmailPreview) return;
        
        // Trouver le propriétaire lié à la licence la plus récente (celle qu'on vient de générer)
        const owner = owners.find(o => `${o.firstName} ${o.lastName}` === licenses[0].assignedTo); 
        const email = owner?.email || 'client@example.com';

        setIsDelivering(true);
        
        const lines = sentEmailPreview.split('\n');
        const subjectLine = lines.find(l => l.toUpperCase().includes('OBJET')) || 'Votre licence Smart POS';
        const subject = subjectLine.split(':')[1]?.trim() || subjectLine;

        const success = await sendRealEmail(email, subject, sentEmailPreview);
        
        if (success) {
            addToast("Email de licence livré avec succès !", 'success');
            setSentEmailPreview(null);
        } else {
            addToast("Erreur lors de l'expédition de l'email.", 'error');
        }
        setIsDelivering(false);
    };

    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key);
        addToast(t('copyKey'), 'info');
    };

    const handleRevoke = (id: string) => {
        if (window.confirm(t('confirmDelete'))) {
            revokeLicense(id);
            addToast(t('licenseRevoked'), 'error');
        }
    };

    const handleSaveOwner = async (userData: Omit<User, 'id'> | User) => {
        if ('id' in userData) {
            const res = await updateUser(userData);
            if (res === 'success') {
                addToast(t('userUpdatedSuccess'), 'success');
                setIsUserModalOpen(false);
                setEditingOwner(null);
            } else {
                addToast(t('emailExistsError'), 'error');
            }
        } else {
            const result = await addUser({ ...userData, role: UserRole.Owner });
            if (result === 'success') {
                addToast(t('userAddedSuccess'), 'success');
                setIsUserModalOpen(false);
                setEditingOwner(null);
            } else if (result === 'email_exists') {
                addToast(t('emailExistsError'), 'error');
            } else {
                addToast(t('userExistsError'), 'error');
            }
        }
    };

    const handleDeleteOwner = async (id: number) => {
        if (window.confirm(t('confirmDeleteUser'))) {
            await deleteUser(id);
            addToast(t('userDeletedSuccess'), 'success');
        }
    };

    const handleResetPassword = async (userId: number, username: string) => {
        const newPassword = prompt(`Nouveau mot de passe pour ${username}:`, 'admin123');
        if (!newPassword) return;
        
        try {
            const response = await fetch(`${API_URL}/api/users/${userId}/reset-password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });
            
            if (response.ok) {
                addToast(`Mot de passe réinitialisé pour ${username}`, 'success');
                alert(`Nouveau mot de passe: ${newPassword}\n\nCommuniquez-le à l'utilisateur de manière sécurisée.`);
            } else {
                const error = await response.json();
                addToast(error.error || 'Erreur lors de la réinitialisation', 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            addToast('Erreur lors de la réinitialisation du mot de passe', 'error');
        }
    };

    const togglePermission = (role: UserRole, permKey: keyof Permissions) => {
        setSystemPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [permKey]: !prev[role][permKey]
            }
        }));
    };

    const handleSaveSystemConfig = async () => {
        setIsSavingConfig(true);
        await new Promise(r => setTimeout(r, 1000));
        localStorage.setItem('custom_system_permissions', JSON.stringify(systemPermissions));
        addToast("Configuration de la matrice enregistrée avec succès", "success");
        setIsSavingConfig(false);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(language, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    const isExpired = (date: Date) => {
        return new Date() > date;
    };

    const getPlanBadgeStyle = (plan: License['plan']) => {
        switch (plan) {
            case 'STARTER': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            case 'BUSINESS_PRO': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800';
            case 'ENTERPRISE': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-100 dark:border-amber-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Administration Système</h2>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
                    <button 
                        onClick={() => setActiveTab('licenses')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'licenses' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        {t('licenseManagement')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('owners')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'owners' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        {t('manageOwners')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('roles')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Rôles & Permissions
                    </button>
                    <button 
                        onClick={() => setActiveTab('customization')} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'customization' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Personnalisation
                    </button>
                </div>
            </div>

            {activeTab === 'licenses' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('generateLicense')}</h3>
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded font-bold uppercase tracking-tighter">Configuration SaaS</span>
                        </div>
                        <form onSubmit={handleGenerateLicense} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Propriétaire (Client)</label>
                                <select 
                                    value={selectedOwnerId}
                                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                    required
                                >
                                    <option value="" disabled>Sélectionner le client</option>
                                    {owners.map(owner => (
                                        <option key={owner.id} value={owner.id}>{owner.firstName} {owner.lastName} ({owner.username})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Formule (Plan)</label>
                                <select 
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value as License['plan'])}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-xs uppercase"
                                >
                                    <option value="STARTER">Starter</option>
                                    <option value="BUSINESS_PRO">Business Pro</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Validité</label>
                                <select 
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                >
                                    <option value="1">1 mois</option>
                                    <option value="3">3 mois</option>
                                    <option value="6">6 mois</option>
                                    <option value="12">1 an</option>
                                    <option value="24">2 ans</option>
                                    <option value="1200">A vie</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 flex items-end">
                                <button 
                                    type="submit"
                                    disabled={isGenerating || !selectedOwnerId}
                                    className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all disabled:bg-slate-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 uppercase tracking-widest text-xs"
                                >
                                    {isGenerating && <Spinner size="sm" className="mr-2" />}
                                    Générer
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase font-black tracking-[0.1em] bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Entité Business</th>
                                        <th className="px-6 py-4 text-center">Formule</th>
                                        <th className="px-6 py-4">Clé de Licence</th>
                                        <th className="px-6 py-4 text-center">Statut</th>
                                        <th className="px-6 py-4">Expiration</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-medium">
                                    {licenses.map(license => {
                                        const expired = isExpired(license.expiryDate);
                                        return (
                                            <tr key={license.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors ${expired ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-slate-900 dark:text-white">{license.assignedTo}</div>
                                                    <div className="text-[10px] text-slate-400">Créée le {formatDate(license.createdAt)}</div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter ${getPlanBadgeStyle(license.plan)}`}>
                                                        {license.plan.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 font-mono text-xs select-all border border-indigo-100 dark:border-indigo-800">
                                                            {license.key}
                                                        </code>
                                                        <button 
                                                            onClick={() => handleCopy(license.key)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm"
                                                            title={t('copyKey')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {expired ? (
                                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full text-[10px] font-black uppercase">Expirée</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase">Active</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`text-xs font-bold ${expired ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {formatDate(license.expiryDate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button 
                                                        onClick={() => handleRevoke(license.id)}
                                                        className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg"
                                                    >
                                                        Résilier
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'owners' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('ownerManagement')}</h3>
                        <button 
                            onClick={() => { setEditingOwner(null); setIsUserModalOpen(true); }}
                            className="px-5 py-2.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 text-xs uppercase tracking-widest"
                        >
                            {t('addOwner')}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase font-black tracking-[0.1em] bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">{t('fullName')}</th>
                                        <th className="px-6 py-4">{t('username')}</th>
                                        <th className="px-6 py-4">{t('email')}</th>
                                        <th className="px-6 py-4 text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-medium">
                                    {owners.length > 0 ? owners.map(owner => (
                                        <tr key={owner.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">{owner.firstName} {owner.lastName}</td>
                                            <td className="px-6 py-5">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono">{owner.username}</span>
                                            </td>
                                            <td className="px-6 py-5 text-slate-500">{owner.email || '-'}</td>
                                            <td className="px-6 py-5 text-right space-x-3">
                                                <button 
                                                    onClick={() => { setEditingOwner(owner); setIsUserModalOpen(true); }}
                                                    className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider hover:underline"
                                                >
                                                    {t('edit')}
                                                </button>
                                                <button 
                                                    onClick={() => handleResetPassword(owner.id, owner.username)}
                                                    className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider hover:underline"
                                                    title="Réinitialiser le mot de passe"
                                                >
                                                    🔄 Réinitialiser
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteOwner(owner.id)}
                                                    className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-wider hover:underline"
                                                >
                                                    {t('delete')}
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">{t('noOwnersFound')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'roles' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Matrice des Permissions Système</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Configurez les droits par défaut pour chaque niveau d'accès.</p>
                        </div>
                        <button 
                            onClick={handleSaveSystemConfig}
                            disabled={isSavingConfig}
                            className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-[10px]"
                        >
                            {isSavingConfig ? <Spinner size="sm" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>}
                            Enregistrer la Matrice
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-5 bg-slate-50 dark:bg-slate-700/50 sticky left-0 font-black uppercase text-slate-500 z-10">Permission</th>
                                        {Object.values(UserRole).filter(r => r !== UserRole.SuperAdmin).map(role => (
                                            <th key={role} className="p-5 text-center font-black uppercase text-indigo-600 dark:text-indigo-400 border-l border-slate-100 dark:border-slate-700">{t(role)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {Object.keys(ROLE_PERMISSIONS[UserRole.Cashier])
                                        .filter(permKey => permKey !== 'manageLicenses')
                                        .map(permKey => (
                                        <tr key={permKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                            <td className="p-5 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800 z-10">
                                                {t(`permission${permKey.charAt(0).toUpperCase() + permKey.slice(1)}`)}
                                            </td>
                                            {Object.values(UserRole).filter(r => r !== UserRole.SuperAdmin).map(role => {
                                                const hasPerm = (systemPermissions[role] as any)[permKey];
                                                return (
                                                    <td 
                                                        key={`${role}-${permKey}`} 
                                                        className="p-0 border-l border-slate-100 dark:border-slate-700/50 text-center"
                                                    >
                                                        <button 
                                                            onClick={() => togglePermission(role, permKey as keyof Permissions)}
                                                            className={`w-full h-16 flex items-center justify-center transition-all ${hasPerm ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-transparent'}`}
                                                        >
                                                            {hasPerm ? (
                                                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 italic leading-relaxed">
                                <span className="font-black uppercase text-indigo-500 mr-2">Note Importante :</span> 
                                La modification de cette matrice impacte uniquement les **nouveaux comptes** créés ou les rôles modifiés après l'enregistrement. Les permissions individuelles peuvent toujours être ajustées manuellement lors de l'ajout d'un utilisateur.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'customization' && (
                <div className="space-y-6">
                    {isLoadingSettings ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {/* Section Branding */}
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">🎨 Branding</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nom de l'Application</label>
                                        <input 
                                            type="text"
                                            value={appSettings.app_name || ''}
                                            onChange={(e) => handleSettingChange('app_name', e.target.value)}
                                            placeholder="Smart POS"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Valeur actuelle: {appSettings.app_name || 'Smart POS'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Slogan</label>
                                        <input 
                                            type="text"
                                            value={appSettings.app_slogan || ''}
                                            onChange={(e) => handleSettingChange('app_slogan', e.target.value)}
                                            placeholder="Gérez votre commerce avec l'intelligence artificielle"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Valeur actuelle: {appSettings.app_slogan || 'Gérez votre commerce avec l\'intelligence artificielle'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section Logo SaaS */}
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">🖼️ Logo & Favicon SaaS</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    
                                    {/* Logo Principal */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Logo Principal</h4>
                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/20">
                                            <div className="w-48 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white flex items-center justify-center mb-4 shadow-inner">
                                                {appSettings.saas_logo_url ? (
                                                    <img src={appSettings.saas_logo_url} alt="Logo SaaS" className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <div className="text-slate-400 text-sm">Aucun logo</div>
                                                )}
                                            </div>
                                            
                                            {/* Option 1: Upload fichier */}
                                            <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} className="hidden" />
                                            <button 
                                                type="button" 
                                                onClick={() => logoInputRef.current?.click()} 
                                                className="w-full text-xs font-bold uppercase tracking-wider px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors mb-3"
                                            >
                                                📁 {appSettings.saas_logo_url ? 'Changer le logo' : 'Importer un fichier'}
                                            </button>
                                            
                                            {/* Option 2: URL */}
                                            <div className="w-full">
                                                <div className="text-xs text-slate-500 text-center mb-2">ou saisir une URL</div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        value={logoUrl}
                                                        onChange={(e) => setLogoUrl(e.target.value)}
                                                        placeholder="https://example.com/logo.png"
                                                        className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveLogoUrl('logo')}
                                                        disabled={isUploadingLogo || !logoUrl.trim()}
                                                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        💾
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p className="text-xs text-slate-500 mt-3 text-center">Utilisé dans l'en-tête et la page de connexion</p>
                                        </div>
                                    </div>

                                    {/* Favicon */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Favicon</h4>
                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-900/20">
                                            <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white flex items-center justify-center mb-4 shadow-inner">
                                                {appSettings.saas_favicon_url ? (
                                                    <img src={appSettings.saas_favicon_url} alt="Favicon SaaS" className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <div className="text-slate-400 text-xs">32x32</div>
                                                )}
                                            </div>
                                            
                                            {/* Option 1: Upload fichier */}
                                            <input ref={faviconInputRef} type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'favicon')} className="hidden" />
                                            <button 
                                                type="button" 
                                                onClick={() => faviconInputRef.current?.click()} 
                                                className="w-full text-xs font-bold uppercase tracking-wider px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors mb-3"
                                            >
                                                📁 {appSettings.saas_favicon_url ? 'Changer favicon' : 'Importer un fichier'}
                                            </button>
                                            
                                            {/* Option 2: URL */}
                                            <div className="w-full">
                                                <div className="text-xs text-slate-500 text-center mb-2">ou saisir une URL</div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        value={faviconUrl}
                                                        onChange={(e) => setFaviconUrl(e.target.value)}
                                                        placeholder="https://example.com/favicon.png"
                                                        className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveLogoUrl('favicon')}
                                                        disabled={isUploadingLogo || !faviconUrl.trim()}
                                                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        💾
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p className="text-xs text-slate-500 mt-3 text-center">Icône du navigateur et PWA</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal de Crop */}
                            {(logoToCrop || faviconToCrop) && (
                                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-[70] p-4">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                            Ajuster le {currentLogoType === 'logo' ? 'Logo' : 'Favicon'}
                                        </h3>
                                        <div className="relative w-full h-96 mb-6">
                                            <Cropper
                                                image={logoToCrop || faviconToCrop || ''}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={currentLogoType === 'logo' ? 3.33 : 1}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                onCropComplete={onCropComplete}
                                            />
                                        </div>
                                        <div className="flex gap-4 justify-center">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setLogoToCrop(null);
                                                    setFaviconToCrop(null);
                                                    setCurrentLogoType(null);
                                                }} 
                                                className="px-6 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg"
                                            >
                                                Annuler
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={handleSaveLogo} 
                                                disabled={isUploadingLogo}
                                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isUploadingLogo && <Spinner size="sm" />}
                                                Valider le {currentLogoType === 'logo' ? 'Logo' : 'Favicon'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section Landing Page */}
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">🏠 Landing Page - Hero</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Badge</label>
                                        <input 
                                            type="text"
                                            value={appSettings.landing_hero_badge || ''}
                                            onChange={(e) => handleSettingChange('landing_hero_badge', e.target.value)}
                                            placeholder="Propulsé par l'IA"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Valeur actuelle: {appSettings.landing_hero_badge || 'Propulsé par l\'IA'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Titre Principal</label>
                                        <textarea 
                                            value={appSettings.landing_hero_title || ''}
                                            onChange={(e) => handleSettingChange('landing_hero_title', e.target.value)}
                                            placeholder="Gérez votre commerce avec l'intelligence artificielle."
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                            rows={2}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Valeur actuelle: {appSettings.landing_hero_title || 'Gérez votre commerce avec l\'intelligence artificielle.'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sous-titre</label>
                                        <textarea 
                                            value={appSettings.landing_hero_subtitle || ''}
                                            onChange={(e) => handleSettingChange('landing_hero_subtitle', e.target.value)}
                                            placeholder="Le premier système de point de vente qui analyse vos stocks..."
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                            rows={3}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Valeur actuelle: {appSettings.landing_hero_subtitle?.substring(0, 50) || 'Le premier système de point de vente...'}...</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section Features */}
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">⭐ Features (3 blocs)</h3>
                                <div className="space-y-8">
                                    {[1, 2, 3].map(num => (
                                        <div key={num} className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-4">Feature {num}</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Titre</label>
                                                    <input 
                                                        type="text"
                                                        value={appSettings[`landing_feature_${num}_title`] || ''}
                                                        onChange={(e) => handleSettingChange(`landing_feature_${num}_title`, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                                    <textarea 
                                                        value={appSettings[`landing_feature_${num}_desc`] || ''}
                                                        onChange={(e) => handleSettingChange(`landing_feature_${num}_desc`, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section Plans de Licence */}
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">💳 Plans de Licence</h3>
                                <div className="space-y-8">
                                    {['starter', 'business', 'enterprise'].map(plan => (
                                        <div key={plan} className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-4 uppercase">{plan}</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nom</label>
                                                    <input 
                                                        type="text"
                                                        value={appSettings[`license_plan_${plan}_name`] || ''}
                                                        onChange={(e) => handleSettingChange(`license_plan_${plan}_name`, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Prix (FCFA)</label>
                                                    <input 
                                                        type="text"
                                                        value={appSettings[`license_plan_${plan}_price`] || ''}
                                                        onChange={(e) => handleSettingChange(`license_plan_${plan}_price`, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Durée</label>
                                                    <input 
                                                        type="text"
                                                        value={appSettings[`license_plan_${plan}_period`] || ''}
                                                        onChange={(e) => handleSettingChange(`license_plan_${plan}_period`, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Features (une par ligne)</label>
                                                    <textarea 
                                                        value={Array.isArray(appSettings[`license_plan_${plan}_features`]) ? appSettings[`license_plan_${plan}_features`].join('\n') : ''}
                                                        onChange={(e) => handleSettingChange(`license_plan_${plan}_features`, e.target.value.split('\n').filter(f => f.trim()))}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section Contact */}
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">📞 Informations de Contact</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Téléphone</label>
                                        <input 
                                            type="tel"
                                            value={appSettings.contact_phone || ''}
                                            onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">WhatsApp</label>
                                        <input 
                                            type="tel"
                                            value={appSettings.contact_whatsapp || ''}
                                            onChange={(e) => handleSettingChange('contact_whatsapp', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Contact</label>
                                        <input 
                                            type="email"
                                            value={appSettings.contact_email || ''}
                                            onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Commercial</label>
                                        <input 
                                            type="email"
                                            value={appSettings.sales_email || ''}
                                            onChange={(e) => handleSettingChange('sales_email', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bouton Enregistrer */}
                            <div className="sticky bottom-0 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-900/30">
                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={isSavingSettings}
                                    className="w-full py-5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-sm disabled:bg-slate-400"
                                >
                                    {isSavingSettings ? <Spinner size="sm" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>}
                                    {isSavingSettings ? 'Enregistrement...' : 'Enregistrer Toutes les Modifications'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {isUserModalOpen && (
                <AddUserModal 
                    userToEdit={editingOwner}
                    forcedRole={UserRole.Owner}
                    onClose={() => { setIsUserModalOpen(false); setEditingOwner(null); }}
                    onSave={handleSaveOwner}
                />
            )}

            {/* MODAL APERÇU EMAIL LICENCE AVEC ÉDITION */}
            {sentEmailPreview && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setSentEmailPreview(null)}>
                    <div 
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/10 flex justify-between items-start">
                            <div className="text-center flex-grow">
                                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                                    {isDelivering ? <Spinner size="md" color="white" /> : (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    )}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Licence Générée</h2>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-widest">Le propriétaire recevra ce message</p>
                            </div>
                            <button 
                                disabled={isDelivering}
                                onClick={() => setIsEditingEmail(!isEditingEmail)}
                                className={`p-3 rounded-xl transition-all ${isEditingEmail ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 disabled:opacity-50'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest text-center">
                                {isEditingEmail ? "Éditeur de message (Markdown supporté)" : "Contenu généré par IA"}
                            </p>
                            <div className={`rounded-3xl p-6 border transition-all duration-300 ${isEditingEmail ? 'bg-white dark:bg-slate-950 border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-inner min-h-[300px]'}`}>
                                {isEditingEmail ? (
                                    <textarea 
                                        value={sentEmailPreview}
                                        onChange={(e) => setSentEmailPreview(e.target.value)}
                                        className="w-full h-full min-h-[300px] bg-transparent border-none outline-none text-sm font-mono leading-relaxed text-slate-700 dark:text-slate-300 resize-none"
                                        placeholder="Saisissez votre message ici..."
                                        autoFocus
                                    />
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none text-sm font-medium leading-relaxed">
                                        <ReactMarkdown>{sentEmailPreview}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 flex gap-4">
                            {isEditingEmail ? (
                                <button onClick={() => setIsEditingEmail(false)} className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all">
                                    Terminer l'édition
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFinalSendLicense} 
                                    disabled={isDelivering}
                                    className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                                >
                                    {isDelivering ? <Spinner size="sm" /> : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    )}
                                    {isDelivering ? "Envoi en cours..." : "Confirmer l'Envoi"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminPage;
