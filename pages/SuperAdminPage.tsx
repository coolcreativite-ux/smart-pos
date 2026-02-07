
import React, { useState, useMemo, useEffect } from 'react';
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

const SuperAdminPage: React.FC = () => {
    const { licenses, generateLicense, revokeLicense } = useLicenses();
    const { users, addUser, updateUser, deleteUser } = useUsers();
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'licenses' | 'owners' | 'roles'>('licenses');
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

    const owners = useMemo(() => users.filter(u => u.role === UserRole.Owner), [users]);

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
