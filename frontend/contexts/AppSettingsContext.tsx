import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '../config';

interface AppSettings {
    // Branding
    app_name: string;
    app_slogan: string;
    
    // Landing Hero
    landing_hero_title: string;
    landing_hero_subtitle: string;
    landing_hero_badge: string;
    
    // Features
    landing_feature_1_title: string;
    landing_feature_1_desc: string;
    landing_feature_2_title: string;
    landing_feature_2_desc: string;
    landing_feature_3_title: string;
    landing_feature_3_desc: string;
    
    // License Plans
    license_plan_starter_name: string;
    license_plan_starter_price: string;
    license_plan_starter_period: string;
    license_plan_starter_features: string[];
    
    license_plan_business_name: string;
    license_plan_business_price: string;
    license_plan_business_period: string;
    license_plan_business_features: string[];
    
    license_plan_enterprise_name: string;
    license_plan_enterprise_price: string;
    license_plan_enterprise_period: string;
    license_plan_enterprise_features: string[];
    
    // Contact
    contact_phone: string;
    contact_email: string;
    contact_whatsapp: string;
    sales_email: string;
}

interface AppSettingsContextType {
    settings: AppSettings;
    isLoading: boolean;
    reloadSettings: () => Promise<void>;
}

// Valeurs par défaut (fallback si l'API échoue)
const DEFAULT_SETTINGS: AppSettings = {
    app_name: 'Smart POS',
    app_slogan: 'Gérez votre commerce avec l\'intelligence artificielle',
    landing_hero_title: 'Gérez votre commerce avec l\'intelligence artificielle.',
    landing_hero_subtitle: 'Le premier système de point de vente qui analyse vos stocks, prédit vos ventes et gère l\'ensemble de vos boutiques en temps réel.',
    landing_hero_badge: 'Propulsé par l\'IA',
    landing_feature_1_title: 'Multi-Boutiques',
    landing_feature_1_desc: 'Gérez 1 ou 100 magasins depuis un seul tableau de bord centralisé.',
    landing_feature_2_title: 'IA Intégrée',
    landing_feature_2_desc: 'Recevez des rapports prédictifs et des conseils stratégiques générés par IA.',
    landing_feature_3_title: 'Inventaire Intelligent',
    landing_feature_3_desc: 'Alertes automatiques de stock bas et historique complet des mouvements.',
    license_plan_starter_name: 'Starter',
    license_plan_starter_price: '25.000',
    license_plan_starter_period: '1 Mois',
    license_plan_starter_features: ['1 Magasin', 'Support Standard', 'Rapports de base'],
    license_plan_business_name: 'Business Pro',
    license_plan_business_price: '250.000',
    license_plan_business_period: '1 An',
    license_plan_business_features: ['Boutiques Illimitées', 'Insights IA', 'Support Prioritaire'],
    license_plan_enterprise_name: 'Enterprise',
    license_plan_enterprise_price: '950.000',
    license_plan_enterprise_period: 'À vie',
    license_plan_enterprise_features: ['Tout Illimité', 'Accès Early-Bird IA', 'Serveur Dédié'],
    contact_phone: '+2250584753743',
    contact_email: 'contact@smartpos.com',
    contact_whatsapp: '+2250584753743',
    sales_email: 'sales@smartpos.com'
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    const loadSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/api/app-settings`);
            if (response.ok) {
                const data = await response.json();
                // Merger avec les valeurs par défaut pour éviter les undefined
                setSettings({ ...DEFAULT_SETTINGS, ...data });
                console.log('✅ Paramètres app chargés:', data);
            } else {
                console.warn('⚠️ Impossible de charger les paramètres, utilisation des valeurs par défaut');
            }
        } catch (error) {
            console.error('❌ Erreur chargement paramètres app:', error);
            // Utiliser les valeurs par défaut en cas d'erreur
        } finally {
            setIsLoading(false);
        }
    };

    const reloadSettings = async () => {
        setIsLoading(true);
        await loadSettings();
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <AppSettingsContext.Provider value={{ settings, isLoading, reloadSettings }}>
            {children}
        </AppSettingsContext.Provider>
    );
};

export const useAppSettings = () => {
    const context = useContext(AppSettingsContext);
    if (!context) {
        throw new Error('useAppSettings must be used within AppSettingsProvider');
    }
    return context;
};
