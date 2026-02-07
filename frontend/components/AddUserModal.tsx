
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../hooks/useLanguage';
import { User, UserRole, Permissions } from '../types';
import { ROLE_PERMISSIONS } from '../constants';
import Spinner from './Spinner';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useStores } from '../contexts/StoreContext';
import { useSettings } from '../contexts/SettingsContext';
import { generateWelcomeEmail } from '../services/geminiService';
import { sendRealEmail } from '../services/emailService';
import ReactMarkdown from 'react-markdown';

interface AddUserModalProps {
  userToEdit?: User | null;
  onClose: () => void;
  onSave: (userData: Omit<User, 'id'> | User) => void;
  forcedRole?: UserRole; 
}

const AddUserModal: React.FC<AddUserModalProps> = ({ userToEdit, onClose, onSave, forcedRole }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const { stores, currentStore } = useStores();
  const { settings } = useSettings();
  const isEditing = !!userToEdit;
  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  const getSystemDefaults = (role: UserRole): Permissions => {
      const saved = localStorage.getItem('custom_system_permissions');
      const matrix = saved ? JSON.parse(saved) : ROLE_PERMISSIONS;
      return matrix[role];
  };

  const [formData, setFormData] = useState({
    username: userToEdit?.username || '',
    email: userToEdit?.email || '',
    firstName: userToEdit?.firstName || '',
    lastName: userToEdit?.lastName || '',
    password: '',
    confirmPassword: '',
    role: userToEdit?.role || forcedRole || UserRole.Cashier,
    assignedStoreId: userToEdit?.assignedStoreId || currentStore?.id || 1
  });
  
  const [permissions, setPermissions] = useState<Permissions>(
    userToEdit?.permissions || getSystemDefaults(forcedRole || UserRole.Cashier)
  );
  
  // Seul le SuperAdmin peut envoyer des emails d'invitation
  const [sendInvite, setSendInvite] = useState(!isEditing && isSuperAdmin);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  
  const [invitationMessage, setInvitationMessage] = useState<string | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  useEffect(() => {
    if (userToEdit) {
        setFormData({
            username: userToEdit.username,
            email: userToEdit.email || '',
            firstName: userToEdit.firstName,
            lastName: userToEdit.lastName,
            password: '',
            confirmPassword: '',
            role: userToEdit.role,
            assignedStoreId: userToEdit.assignedStoreId || currentStore?.id || 1,
        });
        setPermissions(userToEdit.permissions);
        setSendInvite(false);
    }
  }, [userToEdit, currentStore]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: name === 'assignedStoreId' ? Number(value) : value };
        if (name === 'role') {
            setPermissions(getSystemDefaults(value as UserRole));
        }
        return newData;
    });
    if (error) setError('');
  };

  const handlePermissionChange = (pk: keyof Permissions) => {
    setPermissions(prev => ({ ...prev, [pk]: !prev[pk] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sendInvite) {
        if (formData.password !== formData.confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }
        if (!isEditing && !formData.password) {
            setError("Le mot de passe est obligatoire.");
            return;
        }
    }
    
    setIsSaving(true);

    if (sendInvite && isSuperAdmin) {
        try {
            console.log('🔐 Génération du mot de passe et de l\'email d\'invitation...');
            
            // Générer un mot de passe aléatoire sécurisé
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
            console.log('✅ Mot de passe généré');
            
            // Sauvegarder le mot de passe dans formData pour l'utiliser plus tard
            setFormData(prev => ({ ...prev, password: randomPassword }));
            
            const message = await generateWelcomeEmail({
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                password: randomPassword, // Inclure le mot de passe dans l'email
                storeName: settings.storeName,
                role: t(formData.role)
            });
            
            console.log('✅ Email généré, affichage de l\'aperçu');
            console.log('📧 Message:', message.substring(0, 100) + '...');
            
            setInvitationMessage(message);
        } catch (err) {
            console.error('❌ Erreur génération invitation:', err);
            addToast("Erreur lors de la génération de l'invitation.", 'error');
        }
    } else {
        const finalStoreId = formData.role === UserRole.Owner ? undefined : formData.assignedStoreId;
        const userData = {
            username: formData.username,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            permissions,
            assignedStoreId: finalStoreId,
        };
        if (isEditing && userToEdit) {
            const updatedUser: User = { ...userToEdit, ...userData };
            if (formData.password) updatedUser.password = formData.password;
            onSave(updatedUser);
        } else {
            onSave({ ...userData, password: formData.password } as Omit<User, 'id'>);
        }
        onClose();
    }
    setIsSaving(false);
  };

  const handleFinalSend = async () => {
    if (!invitationMessage || !isSuperAdmin) return;
    
    setIsDelivering(true);
    
    const lines = invitationMessage.split('\n');
    const subjectLine = lines.find(l => l.toUpperCase().includes('OBJET')) || 'Invitation Smart POS';
    const subject = subjectLine.split(':')[1]?.trim() || subjectLine;

    const success = await sendRealEmail(formData.email, subject, invitationMessage);
    
    if (success) {
        const finalStoreId = formData.role === UserRole.Owner ? undefined : formData.assignedStoreId;
        
        // Utiliser le mot de passe déjà généré dans formData
        onSave({ 
            username: formData.username,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            permissions,
            assignedStoreId: finalStoreId,
            password: formData.password // Utiliser le mot de passe généré précédemment
        } as Omit<User, 'id'>);
        
        addToast("Invitation envoyée avec succès !", 'success');
        onClose();
    } else {
        addToast("Erreur lors de l'envoi de l'email.", 'error');
    }
    setIsDelivering(false);
  };

  const canAssignStore = formData.role !== UserRole.Owner && 
                         formData.role !== UserRole.SuperAdmin &&
                         (isSuperAdmin || (!forcedRole && (currentUser?.role === UserRole.Owner || currentUser?.role === UserRole.Admin)));

  const showPermissions = formData.role !== UserRole.Owner && (isSuperAdmin || !forcedRole);

  const availableRoles = useMemo(() => {
    const roles = Object.values(UserRole);
    if (isSuperAdmin) return roles;
    let filtered = roles.filter(r => r !== UserRole.SuperAdmin);
    if (currentUser?.role !== UserRole.Owner) filtered = filtered.filter(r => r !== UserRole.Owner);
    return filtered;
  }, [isSuperAdmin, currentUser]);

  const displayablePermissions = useMemo(() => {
    return Object.keys(permissions).filter(key => {
        if (!isSuperAdmin && key === 'manageLicenses') return false;
        return true;
    }) as Array<keyof Permissions>;
  }, [permissions, isSuperAdmin]);

  // Debug logging
  console.log('🔍 AddUserModal State:', {
    invitationMessage: invitationMessage ? 'SET' : 'NULL',
    isSuperAdmin,
    sendInvite,
    currentUserRole: currentUser?.role
  });

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {invitationMessage && isSuperAdmin ? (
          <div className="flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/10 flex justify-between items-start flex-shrink-0">
                <div>
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/20">
                        {isDelivering ? <Spinner size="md" color="white" /> : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Email d'Invitation</h2>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-widest">Relisez ou éditez avant envoi</p>
                </div>
                <button 
                    disabled={isDelivering}
                    onClick={() => setIsEditingMessage(!isEditingMessage)}
                    className={`p-3 rounded-xl transition-all ${isEditingMessage ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 disabled:opacity-50'}`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
                    {isEditingMessage ? "Mode Éditeur Rapide" : "Aperçu IA"}
                </p>
                <div className={`rounded-3xl p-6 border transition-all duration-300 ${isEditingMessage ? 'bg-white dark:bg-slate-950 border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-inner'}`}>
                    {isEditingMessage ? (
                        <textarea 
                            value={invitationMessage}
                            onChange={(e) => setInvitationMessage(e.target.value)}
                            className="w-full h-80 bg-transparent border-none outline-none text-sm font-mono leading-relaxed text-slate-700 dark:text-slate-300 resize-none"
                            autoFocus
                        />
                    ) : (
                        <div className="prose dark:prose-invert max-w-none text-sm font-medium leading-relaxed">
                            <ReactMarkdown>{invitationMessage}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 flex-shrink-0 bg-white dark:bg-slate-900">
                {console.log('🔘 Rendu de la section bouton, isEditingMessage:', isEditingMessage)}
                {isEditingMessage ? (
                    <button onClick={() => setIsEditingMessage(false)} className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all">
                        Terminer l'édition
                    </button>
                ) : (
                    <button 
                        onClick={handleFinalSend} 
                        disabled={isDelivering}
                        className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                    >
                        {isDelivering ? <Spinner size="sm" /> : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        )}
                        {isDelivering ? "Expédition en cours..." : "Confirmer & Envoyer l'Email"}
                    </button>
                )}
            </div>
          </div>
        ) : (
          /* FORMULAIRE INITIAL */
          <>
            <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                  {isEditing ? t('editUser') : (forcedRole === UserRole.Owner ? t('addOwner') : t('addUser'))}
                </h2>
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-2">
                   {isEditing ? "Modification des accès" : (forcedRole === UserRole.Owner ? "Nouveau Propriétaire Business" : "Création d'un nouveau profil")}
                </p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form id="user-form-portal" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-7 space-y-7 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('firstName')}</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('lastName')}</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
              
              {isSuperAdmin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('email')}</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required={sendInvite} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('username')}</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required disabled={isEditing} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black uppercase text-sm disabled:opacity-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {!forcedRole && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('role')}</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none rounded-2xl font-black uppercase text-xs outline-none">
                      {availableRoles.map(r => <option key={r} value={r}>{t(r)}</option>)}
                    </select>
                  </div>
                )}
                {canAssignStore && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('assignedStore')}</label>
                    <select name="assignedStoreId" value={formData.assignedStoreId} onChange={handleChange} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none">
                      {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {showPermissions && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 ml-1 tracking-widest">{t('permissions')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {displayablePermissions.map((pk) => {
                            const isActive = permissions[pk];
                            return (
                                <div 
                                  key={pk} 
                                  onClick={() => handlePermissionChange(pk)}
                                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                      {isActive && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <span className="text-[10px] font-black uppercase truncate">{t(`permission${pk.charAt(0).toUpperCase() + pk.slice(1)}`)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                {!isEditing && isSuperAdmin && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-3">
                      <input type="checkbox" id="sendInvitePortal" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 rounded" />
                      <div>
                        <label htmlFor="sendInvitePortal" className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase">{t('sendInvite')}</label>
                        <p className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70 leading-tight mt-0.5">{t('sendInviteDesc')}</p>
                      </div>
                  </div>
                )}

                {!sendInvite && (
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{isEditing ? "Nouveau MDP" : t('password')}</label>
                          <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm" placeholder="••••••••" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Confirmation</label>
                          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm" placeholder="••••••••" />
                      </div>
                  </div>
                )}
              </div>
              {error && <p className="text-[10px] text-rose-500 font-black text-center uppercase py-2 px-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">{error}</p>}
            </form>

            <div className="p-7 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-100 transition-colors border border-slate-200 dark:border-slate-700">{t('cancel')}</button>
              <button type="submit" form="user-form-portal" disabled={isSaving} className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  {isSaving ? <Spinner size="sm" /> : (sendInvite ? "Générer Invitation" : t('save'))}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AddUserModal;
