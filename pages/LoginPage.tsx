
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useSettings } from '../contexts/SettingsContext';
import { useUsers } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useLicenses } from '../contexts/LicenseContext';
import { UserRole } from '../types';
import Spinner from '../components/Spinner';
import { sendRealEmail } from '../services/emailService';

type AuthView = 'login' | 'register' | 'forgot';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const { addUser } = useUsers();
  const { addToast } = useToast();
  const { generateTrialLicense } = useLicenses();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (!success) {
        setError(t('loginError'));
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    addToast("Connexion à Google en cours...", "info");
    
    try {
      // Simulation OAuth
      await new Promise(r => setTimeout(r, 1500));
      
      // Connecte le compte 'proprietaire' par défaut pour la démo
      const success = await login('proprietaire', 'owner');
      if (success) {
          addToast("Connecté via Google avec succès", "success");
      } else {
          setError("Échec de la connexion Google");
      }
    } catch (error) {
      setError("Erreur de connexion Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
    }

    setIsLoading(true);
    setError('');

    // Création d'un compte propriétaire (TenantId sera auto-géré dans UserContext pour les Owners)
    const result = await addUser({
        username: username.toLowerCase(),
        tenantId: 0, // Sera écrasé par UserContext pour les nouveaux Owners
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: password,
        role: UserRole.Owner,
        permissions: {
            viewAnalytics: true,
            manageProducts: true,
            viewHistory: true,
            accessSettings: true,
            manageUsers: true,
            manageStores: true
        }
    });

    if (result === 'success') {
        const trialLicense = generateTrialLicense(`${firstName} ${lastName}`);
        localStorage.setItem('active_license_key', trialLicense.key);
        addToast("Compte créé et licence d'essai (14 jours) activée !", "success");
        const success = await login(username, password);
        if (!success) setView('login');
    } else {
        setError(result === 'username_exists' ? "Ce nom d'utilisateur est déjà pris" : "Cet email est déjà utilisé");
    }
    setIsLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await sendRealEmail(
        email, 
        "Réinitialisation de votre mot de passe - Smart POS", 
        "Bonjour, cliquez sur ce lien pour réinitialiser votre mot de passe..."
    );

    if (success) {
        addToast("Lien de récupération envoyé par email", "success");
        setView('login');
    } else {
        setError("Erreur lors de l'envoi de l'email");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Ornement d'arrière-plan */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 dark:border-slate-800 animate-fade-in-up relative z-10">
        <div className="text-center">
          {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Store Logo" className="mx-auto h-16 w-auto object-contain mb-6" />
          ) : (
            <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 rotate-3">
                 <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
          )}
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            {view === 'login' ? "Connexion" : view === 'register' ? "Inscription" : "Récupération"}
          </h1>
          <p className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {view === 'login' ? "Accédez à votre point de vente" : view === 'register' ? "Créez votre instance Smart POS" : "Retrouvez vos accès"}
          </p>
        </div>

        {/* LOGIN VIEW */}
        {view === 'login' && (
            <>
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('username')}</label>
                        <input
                            type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                            placeholder="Nom d'utilisateur"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('password')}</label>
                        <input
                            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                            placeholder="••••••••"
                        />
                        <div className="flex justify-end mt-2 ml-1">
                            <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-tighter transition-colors">Mot de passe oublié ?</button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 animate-in zoom-in-95">
                            <p className="text-center text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit" disabled={isLoading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-500/25 transition-all active:scale-[0.98] flex items-center justify-center uppercase tracking-widest disabled:opacity-50"
                    >
                        {isLoading ? <Spinner size="sm" /> : t('login')}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]"><span className="px-4 bg-white dark:bg-slate-900 text-slate-400">ou continuer avec</span></div>
                </div>

                <button
                    type="button" onClick={handleGoogleLogin} disabled={isLoading}
                    className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                </button>

                <p className="text-center text-xs font-bold text-slate-500 mt-8">
                    Pas de compte ? <button onClick={() => setView('register')} className="text-indigo-600 hover:underline">Créez-en un ici</button>
                </p>
            </>
        )}

        {/* REGISTER VIEW */}
        {view === 'register' && (
            <form className="space-y-4" onSubmit={handleRegister}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{t('firstName')}</label>
                        <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm" placeholder="Ex: Jean" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{t('lastName')}</label>
                        <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm" placeholder="Ex: Dupont" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email Professionnel</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm" placeholder="nom@entreprise.com" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nom d'utilisateur</label>
                    <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm" placeholder="Choisissez un pseudo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{t('password')}</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm" placeholder="••••••••" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Confirmer</label>
                        <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm" placeholder="••••••••" />
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        <span className="uppercase text-xs font-black block mb-1">🎁 Offre de lancement</span>
                        Inscrivez-vous et profitez de <strong>14 jours d'essai gratuit</strong> sur le plan <span className="text-indigo-600 font-black">BUSINESS PRO</span>. Aucune carte bancaire requise.
                    </p>
                </div>

                {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}

                <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-600 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                    {isLoading ? <Spinner size="sm" /> : "Finaliser l'inscription"}
                </button>
                
                <button type="button" onClick={() => setView('login')} className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">Retour à la connexion</button>
            </form>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {view === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgot}>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed">Saisissez l'email associé à votre compte. Nous vous enverrons un lien pour définir un nouveau mot de passe.</p>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Adresse Email</label>
                    <input
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm"
                        placeholder="nom@entreprise.com"
                    />
                </div>

                {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}

                <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                    {isLoading ? <Spinner size="sm" /> : "Envoyer le lien"}
                </button>
                
                <button type="button" onClick={() => setView('login')} className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">Retour à la connexion</button>
            </form>
        )}
        
        <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] pt-4">Smart POS Cloud v3.1</p>
      </div>
    </div>
  );
};

export default LoginPage;
