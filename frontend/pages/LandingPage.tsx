
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useSaasBranding } from '../contexts/SaasBrandingContext';
import OrderContactModal from '../components/OrderContactModal';

interface LandingPageProps {
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    const { t } = useLanguage();
    const { settings, isLoading } = useAppSettings();
    const { branding } = useSaasBranding();
    const [isScrolled, setIsScrolled] = useState(false);
    
    // États pour le système de commande/contact
    const [orderModal, setOrderModal] = useState<{ isOpen: boolean; method: 'whatsapp' | 'email'; plan?: string }>({
        isOpen: false,
        method: 'whatsapp'
    });
    const [showContactPicker, setShowContactPicker] = useState<{ isOpen: boolean; plan?: string }>({
        isOpen: false
    });

    // État pour la FAQ (accordéon simple)
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handlePlanSelection = (planId: string) => {
        setShowContactPicker({ isOpen: true, plan: planId });
    };

    const openOrderForm = (method: 'whatsapp' | 'email', plan?: string) => {
        setOrderModal({ isOpen: true, method, plan });
        setShowContactPicker({ isOpen: false });
    };

    const faqItems = [
        { q: "Comment activer ma licence ?", a: "Après votre commande, vous recevrez une clé par email. Il suffit de la saisir dans l'onglet 'Licence' de votre tableau de bord." },
        { q: "Le logiciel fonctionne-t-il hors ligne ?", a: "Oui, Smart POS est conçu pour fonctionner sans internet. Les données se synchronisent automatiquement dès que la connexion est rétablie." },
        { q: "Puis-je gérer plusieurs boutiques ?", a: "Absolument. Les plans 'Business Pro' et 'Enterprise' permettent de centraliser la gestion de tous vos points de vente." },
        { q: "Qu'est-ce que l'analyse IA ?", a: "C'est un moteur intelligent qui analyse vos tendances de vente pour vous suggérer des optimisations de stock et des stratégies de prix." }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white">
            {/* Navbar Flottante */}
            <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl transition-all duration-500 ${isScrolled ? 'top-4' : 'top-8'}`}>
                <div className={`flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl border transition-all duration-500 ${isScrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-700 shadow-2xl' : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 shadow-lg'}`}>
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="h-10 flex items-center justify-center">
                            {branding.logoUrl ? (
                              <img 
                                  src={branding.logoUrl} 
                                  alt={branding.alt} 
                                  className="h-full w-auto object-contain group-hover:scale-105 transition-transform" 
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                                  </svg>
                                </div>
                                <span className="text-lg font-black tracking-tighter uppercase">SMART<span className="text-indigo-600">POS</span></span>
                              </div>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('product')} className="text-xs font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">Produit</button>
                        <button onClick={() => scrollToSection('pricing')} className="text-xs font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">Tarifs</button>
                        <button onClick={() => scrollToSection('faq')} className="text-xs font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">FAQ</button>
                        <button onClick={() => setShowContactPicker({ isOpen: true })} className="text-xs font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest">Contact</button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={onLoginClick} className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all tracking-tighter">Connexion</button>
                        <button onClick={onLoginClick} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all uppercase tracking-widest">Essayer</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 sm:pt-48 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
                    <span className="inline-block px-4 py-2 mb-6 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider animate-fade-in-up">{settings.landing_hero_badge}</span>
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter mb-6 sm:mb-8 animate-fade-in-up px-4">
                        {settings.landing_hero_title.split('l\'intelligence artificielle')[0]}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">l'intelligence artificielle.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium mb-8 sm:mb-12 animate-fade-in-up [animation-delay:200ms] px-4 leading-relaxed">
                        {settings.landing_hero_subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:400ms] px-4">
                        <button onClick={onLoginClick} className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-[2rem] text-sm sm:text-base shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 hover:scale-105 transition-all uppercase tracking-widest">Essayez gratuitement</button>
                        <button onClick={onLoginClick} className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-[2rem] text-sm sm:text-base border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all uppercase tracking-widest shadow-xl shadow-slate-200/50">Accéder au POS</button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="product" className="py-20 sm:py-32 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 sm:mb-20">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase px-4">Puissance & Simplicité.</h2>
                        <p className="text-slate-600 dark:text-slate-300 font-bold uppercase text-sm sm:text-base tracking-wider px-4">Tout ce dont vous avez besoin pour dominer votre marché.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                        {[
                            { title: settings.landing_feature_1_title, desc: settings.landing_feature_1_desc, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                            { title: settings.landing_feature_2_title, desc: settings.landing_feature_2_desc, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                            { title: settings.landing_feature_3_title, desc: settings.landing_feature_3_desc, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' }
                        ].map((f, i) => (
                            <div key={i} className="p-8 sm:p-10 rounded-3xl sm:rounded-[3rem] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group shadow-xl">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform shadow-inner">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={f.icon} />
                                    </svg>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 uppercase tracking-tight text-slate-900 dark:text-white">{f.title}</h3>
                                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-sm sm:text-base">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 sm:py-32 px-4 sm:px-6 bg-slate-100 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 sm:mb-20">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase px-4">Licences Sans Engagement.</h2>
                        <p className="text-slate-600 dark:text-slate-300 font-bold uppercase text-sm sm:text-base tracking-wider px-4">Une clé unique pour valider l'ensemble de vos points de vente.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                        {[
                            { id: 'STARTER', name: settings.license_plan_starter_name, price: settings.license_plan_starter_price, period: settings.license_plan_starter_period, features: settings.license_plan_starter_features },
                            { id: 'BUSINESS_PRO', name: settings.license_plan_business_name, price: settings.license_plan_business_price, period: settings.license_plan_business_period, features: settings.license_plan_business_features, popular: true },
                            { id: 'ENTERPRISE', name: settings.license_plan_enterprise_name, price: settings.license_plan_enterprise_price, period: settings.license_plan_enterprise_period, features: settings.license_plan_enterprise_features }
                        ].map((p, i) => (
                            <div key={i} className={`relative p-8 sm:p-12 rounded-3xl sm:rounded-[3.5rem] border-2 transition-all duration-500 ${p.popular ? 'bg-indigo-600 text-white border-indigo-500 md:scale-105 shadow-2xl' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl'}`}>
                                {p.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 px-6 sm:px-8 py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-xl">Le plus populaire</span>}
                                <h3 className={`text-lg sm:text-xl font-black uppercase tracking-wider mb-6 sm:mb-8 ${p.popular ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>{p.name}</h3>
                                <div className="mb-10 sm:mb-12">
                                    <span className="text-5xl sm:text-6xl font-black tracking-tighter">{p.price}</span>
                                    <span className={`text-sm sm:text-base font-bold ml-2 ${p.popular ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}> FCFA / {p.period}</span>
                                </div>
                                <ul className="space-y-5 mb-14">
                                    {p.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-4 text-sm font-bold uppercase tracking-tight">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${p.popular ? 'bg-white/20' : 'bg-indigo-50'}`}>
                                                <svg className={`w-3.5 h-3.5 ${p.popular ? 'text-white' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button 
                                    onClick={() => handlePlanSelection(p.id)} 
                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 ${p.popular ? 'bg-white text-indigo-600 hover:bg-slate-50 shadow-xl' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg'}`}
                                >
                                    Commander la licence
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-32 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">Questions Fréquentes.</h2>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Tout ce qu'il faut savoir avant de démarrer.</p>
                    </div>
                    <div className="space-y-4">
                        {faqItems.map((item, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all shadow-sm">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full px-8 py-6 flex justify-between items-center text-left"
                                >
                                    <span className="font-black text-sm uppercase tracking-tight text-slate-800 dark:text-white">{item.q}</span>
                                    <svg className={`w-5 h-5 text-indigo-600 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openFaq === i && (
                                    <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">{item.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Modal / Picker (Icons Only - Minimalist Style) */}
            {showContactPicker.isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowContactPicker({ isOpen: false })}>
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl w-full max-w-sm text-center relative border border-white/10 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowContactPicker({ isOpen: false })} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">Service Commercial</h3>
                        <p className="text-[10px] font-bold text-slate-500 mb-10 uppercase tracking-widest">Comment souhaitez-vous procéder ?</p>
                        <div className="flex justify-center gap-8">
                            <a href="tel:+2250584753743" title="Appeler" className="w-16 h-16 bg-sky-500 text-white rounded-full shadow-lg shadow-sky-500/30 flex items-center justify-center hover:scale-110 transition-all active:scale-90">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </a>
                            <button onClick={() => openOrderForm('whatsapp', showContactPicker.plan)} title="WhatsApp" className="w-16 h-16 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:scale-110 transition-all active:scale-90">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03a11.908 11.908 0 001.587 5.961L0 24l6.117-1.605a11.845 11.845 0 005.926 1.586h.005c6.632 0 12.028-5.396 12.03-12.03a11.85 11.85 0 00-3.483-8.487z"/></svg>
                            </button>
                            <button onClick={() => openOrderForm('email', showContactPicker.plan)} title="Email" className="w-16 h-16 bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-110 transition-all active:scale-90">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {orderModal.isOpen && (
                <OrderContactModal 
                    onClose={() => setOrderModal({ ...orderModal, isOpen: false })} 
                    method={orderModal.method} 
                    selectedPlan={orderModal.plan} 
                />
            )}

            {/* Footer */}
            <footer id="about" className="py-20 px-6 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
                        <div className="md:col-span-2">
                             <div className="flex items-center justify-center md:justify-start gap-2 mb-6 text-slate-900 dark:text-white">
                                <div className="h-12 flex items-center justify-center">
                                    {branding.logoUrl ? (
                                        <img 
                                            src={branding.logoUrl} 
                                            alt={branding.alt} 
                                            className="h-full w-auto object-contain" 
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                                                </svg>
                                            </div>
                                            <span className="text-xl font-black tracking-tighter uppercase">SMART<span className="text-indigo-600">POS</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="max-w-sm mx-auto md:mx-0 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Le système de point de vente intelligent de nouvelle génération. Développé pour la résilience et la performance des commerçants modernes.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-slate-400">Ressources</h4>
                            <ul className="space-y-4 text-xs font-black uppercase tracking-tighter text-slate-600 dark:text-slate-300">
                                <li><button onClick={() => scrollToSection('product')} className="hover:text-indigo-600 transition-colors">Produit</button></li>
                                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-indigo-600 transition-colors">Licences</button></li>
                                <li><button onClick={() => scrollToSection('faq')} className="hover:text-indigo-600 transition-colors">Support FAQ</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-[10px] mb-8 text-slate-400">Support 24/7</h4>
                            <div className="flex justify-center md:justify-start gap-4">
                                <a href="tel:+2250584753743" className="w-11 h-11 bg-sky-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-sky-500/20 active:scale-90">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </a>
                                <button onClick={() => setShowContactPicker({ isOpen: true })} className="w-11 h-11 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20 active:scale-90">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03a11.908 11.908 0 001.587 5.961L0 24l6.117-1.605a11.845 11.845 0 005.926 1.586h.005c6.632 0 12.028-5.396 12.03-12.03a11.85 11.85 0 00-3.483-8.487z"/></svg>
                                </button>
                                <button onClick={() => setShowContactPicker({ isOpen: true })} className="w-11 h-11 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20 active:scale-90">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-800 gap-4">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Copyright © 2025. Tous droits réservés - Protection des données et Mentions légales</p>
                        <div className="flex gap-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Cloud Edition v3.1</span>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
