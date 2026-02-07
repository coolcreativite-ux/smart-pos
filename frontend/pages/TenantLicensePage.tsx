
import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLicenses } from '../contexts/LicenseContext';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import OrderContactModal from '../components/OrderContactModal';

const TenantLicensePage: React.FC = () => {
    const { user, activateApp } = useAuth();
    const { licenses } = useLicenses();
    const { addToast } = useToast();
    
    const [key, setKey] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [error, setError] = useState(false);
    
    // Modal de commande
    const [orderModal, setOrderModal] = useState<{ isOpen: boolean; method: 'whatsapp' | 'email'; plan?: string }>({
        isOpen: false,
        method: 'whatsapp'
    });

    const activeLicense = useMemo(() => {
        if (!user) return null;
        
        // Chercher la licence active pour le tenant de l'utilisateur
        const now = new Date();
        const tenantLicense = licenses.find(l => 
            l.tenantId === user.tenantId && 
            l.isActive && 
            now < l.expiryDate
        );
        
        console.log('[TenantLicense] Recherche licence pour tenant:', user.tenantId);
        console.log('[TenantLicense] Licences disponibles:', licenses);
        console.log('[TenantLicense] Licence trouvée:', tenantLicense);
        
        return tenantLicense || null;
    }, [licenses, user]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim()) return;

        setError(false);
        setIsActivating(true);
        
        await new Promise(r => setTimeout(r, 1200));
        
        const success = activateApp(key.toUpperCase());
        if (success) {
            addToast("Licence activée avec succès !", "success");
            setKey('');
        } else {
            setError(true);
            addToast("Clé de licence invalide ou déjà utilisée.", "error");
        }
        setIsActivating(false);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(date));
    };

    const getRemainingDays = (expiry: Date) => {
        const diff = new Date(expiry).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const plans = [
        { 
            id: 'STARTER', 
            name: 'Starter', 
            price: '25.000', 
            period: '1 Mois', 
            features: ['1 Magasin', 'Support Standard', 'Rapports de base'],
            isCurrent: activeLicense?.plan === 'STARTER'
        },
        { 
            id: 'BUSINESS_PRO', 
            name: 'Business Pro', 
            price: '250.000', 
            period: '1 An', 
            features: ['Multi-magasins illimités', 'Insights IA', 'Support Prioritaire 24/7'],
            isCurrent: activeLicense?.plan === 'BUSINESS_PRO',
            popular: true
        },
        { 
            id: 'ENTERPRISE', 
            name: 'Enterprise', 
            price: '950.000', 
            period: 'À vie', 
            features: ['Tout illimité', 'Accès Early-Bird IA', 'Déploiement dédié'],
            isCurrent: activeLicense?.plan === 'ENTERPRISE'
        }
    ];

    return (
        <div className="space-y-10 animate-fade-in-up pb-20">
            {/* Header Statut */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 rotate-3">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <div className="text-center md:text-left flex-grow">
                    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Abonnement Actuel</h2>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">Actif</span>
                    </div>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter mb-4">
                        {activeLicense?.plan.replace('_', ' ') || 'PLAN INCONNU'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" /></svg>
                            <span>Expire le : <span className="text-slate-900 dark:text-white">{activeLicense ? formatDate(activeLicense.expiryDate) : 'N/A'}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>Reste : <span className="text-indigo-600">{activeLicense ? getRemainingDays(activeLicense.expiryDate) : 0} Jours</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulaire Activation */}
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/40 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl"></div>
                
                <div className="max-w-2xl relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Prolonger ou Changer de Formule</h3>
                    <p className="text-indigo-100 font-medium mb-8">Saisissez une nouvelle clé de licence reçue par email pour mettre à jour votre abonnement instantanément.</p>
                    
                    <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-4">
                        <input 
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value.toUpperCase())}
                            placeholder="G-POS-XXXX-XXXX-XXXX"
                            className={`flex-grow px-6 py-5 bg-white text-slate-900 rounded-2xl font-mono font-black text-xl tracking-[0.2em] outline-none border-4 transition-all ${error ? 'border-rose-300' : 'border-white focus:border-indigo-400'}`}
                            required
                        />
                        <button 
                            type="submit"
                            disabled={isActivating || key.length < 5}
                            className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:bg-slate-800 uppercase tracking-widest text-xs"
                        >
                            {isActivating ? <Spinner size="sm" color="white" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                            Valider
                        </button>
                    </form>
                    {error && <p className="text-rose-200 text-xs font-black uppercase mt-4 tracking-widest">Clé invalide ou déjà expirée.</p>}
                </div>
            </div>

            {/* Comparatif Plans */}
            <div className="space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Choisissez votre puissance</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Passez à la formule supérieure pour débloquer plus de magasins et l'IA.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((p) => (
                        <div key={p.id} className={`relative p-10 rounded-[3rem] border-2 transition-all duration-500 ${p.popular ? 'bg-indigo-600 text-white border-indigo-500 scale-105 shadow-2xl' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                            {p.popular && <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Recommandé</span>}
                            {p.isCurrent && <span className={`absolute top-6 right-6 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${p.popular ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>Actuel</span>}
                            
                            <h3 className={`text-xl font-black uppercase tracking-widest mb-6 ${p.popular ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>{p.name}</h3>
                            <div className="mb-10">
                                <span className="text-5xl font-black tracking-tighter">{p.price}</span>
                                <span className={`text-sm font-bold ml-2 ${p.popular ? 'text-indigo-200' : 'text-slate-400'}`}> FCFA / {p.period}</span>
                            </div>
                            
                            <ul className="space-y-5 mb-12">
                                {p.features.map((f, j) => (
                                    <li key={j} className="flex items-center gap-3 text-sm font-bold">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${p.popular ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30'}`}>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className={p.popular ? 'text-indigo-50' : 'text-slate-600 dark:text-slate-300'}>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => setOrderModal({ isOpen: true, method: 'whatsapp', plan: p.id })}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${p.isCurrent ? 'bg-transparent border-2 border-white/30 text-white cursor-default' : (p.popular ? 'bg-white text-indigo-600 hover:bg-slate-50' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90')}`}
                            >
                                {p.isCurrent ? 'Formule Actuelle' : 'Commander la Clé'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Support avec uniquement les icônes */}
            <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700 text-center">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Contacter le Support</h3>
                <p className="text-xs font-bold text-slate-500 mb-8 max-w-xs mx-auto">Une assistance rapide et personnalisée disponible 24/7.</p>
                
                <div className="flex justify-center gap-6">
                    {/* Icône Appel */}
                    <a 
                        href="tel:+2250584753743" 
                        title="Appeler par cellulaire"
                        className="w-14 h-14 bg-sky-500 text-white rounded-full shadow-lg shadow-sky-500/30 flex items-center justify-center hover:scale-110 hover:bg-sky-600 transition-all active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </a>

                    {/* Icône WhatsApp */}
                    <button 
                        onClick={() => setOrderModal({ isOpen: true, method: 'whatsapp' })}
                        title="Envoyer un message WhatsApp"
                        className="w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:scale-110 hover:bg-emerald-600 transition-all active:scale-90"
                    >
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03a11.908 11.908 0 001.587 5.961L0 24l6.117-1.605a11.845 11.845 0 005.926 1.586h.005c6.632 0 12.028-5.396 12.03-12.03a11.85 11.85 0 00-3.483-8.487z"/>
                        </svg>
                    </button>

                    {/* Icône Email */}
                    <button 
                        onClick={() => setOrderModal({ isOpen: true, method: 'email' })}
                        title="Envoyer un email commercial"
                        className="w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-110 hover:bg-indigo-600 transition-all active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Modal de commande */}
            {orderModal.isOpen && (
                <OrderContactModal 
                    onClose={() => setOrderModal({ ...orderModal, isOpen: false })}
                    method={orderModal.method}
                    selectedPlan={orderModal.plan}
                />
            )}
        </div>
    );
};

export default TenantLicensePage;
