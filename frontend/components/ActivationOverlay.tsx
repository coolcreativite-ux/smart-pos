
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { UserRole } from '../types';
import Spinner from './Spinner';

const ActivationOverlay: React.FC = () => {
    const { user, activateApp, logout } = useAuth();
    const { t } = useLanguage();
    const [key, setKey] = useState('');
    const [error, setError] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    // Seul le propriétaire ou l'admin du tenant peut saisir la clé
    const canActivate = user?.role === UserRole.Owner || user?.role === UserRole.Admin;

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(false);
        setIsActivating(true);
        
        await new Promise(r => setTimeout(r, 1200));
        
        const success = activateApp(key);
        if (!success) {
            setError(true);
        }
        setIsActivating(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 text-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-500/40 rotate-3 animate-pulse">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Activation Requise</h2>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-8 border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm">
                            {canActivate 
                                ? "Votre instance Gemini POS n'est pas encore activée. Saisissez votre clé de licence pour débloquer les fonctionnalités de votre boutique." 
                                : `Le système est actuellement suspendu. Veuillez contacter le responsable (${user?.tenantId}) pour activer la licence de l'établissement.`}
                        </p>
                    </div>

                    {canActivate ? (
                        <form onSubmit={handleActivate} className="space-y-6">
                            <div>
                                <input 
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                                    placeholder="G-POS-XXXX-XXXX-XXXX"
                                    required
                                    className={`w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl text-center font-mono font-black text-xl tracking-[0.2em] outline-none transition-all ${error ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-transparent focus:border-indigo-500'}`}
                                />
                                {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-3 animate-in slide-in-from-top-1">Clé invalide, expirée ou déjà utilisée par un autre établissement</p>}
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={isActivating || key.length < 5}
                                className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex items-center justify-center gap-3"
                            >
                                {isActivating ? <Spinner size="sm" color="white" /> : "Activer l'établissement"}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-amber-500 font-bold uppercase text-[10px] tracking-widest bg-amber-50 dark:bg-amber-900/20 py-3 rounded-xl border border-amber-100 dark:border-amber-800">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                En attente d'activation par le gérant
                            </div>
                            <button 
                                onClick={logout}
                                className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Retour à la connexion
                            </button>
                        </div>
                    )}
                    
                    {canActivate && (
                        <button 
                            onClick={logout}
                            className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors"
                        >
                            Déconnexion
                        </button>
                    )}
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Identifiant Établissement (Tenant) : <span className="text-indigo-600">#{user?.tenantId}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ActivationOverlay;
