# Guide: Interface d'Administration pour Personnalisation

**Objectif**: Permettre au SuperAdmin de personnaliser l'application (landing page, plans de licence, contacts) sans modifier le code.

---

## 🎯 Fonctionnalités Requises

### 1. Personnalisation de la Landing Page
- Titre hero principal
- Sous-titre hero
- Badge hero ("Propulsé par l'IA")
- Features (3 blocs): titre, description, icône
- Plans de licence: nom, prix, durée, features
- FAQ: questions et réponses
- Informations de contact: téléphone, email, WhatsApp

### 2. Personnalisation de la Page Licence (Propriétaires)
- Plans disponibles: nom, prix, durée, features
- Message d'activation
- Informations de support

### 3. Branding Global
- Nom de l'application
- Logo (URL ou upload)
- Couleurs principales (optionnel)
- Slogan

---

## 📊 Architecture Proposée

### Étape 1: Base de Données

```sql
-- Table pour les paramètres de l'application
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'branding', 'landing', 'license', 'contact'
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

-- Index pour recherche rapide
CREATE INDEX idx_app_settings_category ON app_settings(category);
CREATE INDEX idx_app_settings_key ON app_settings(key);

-- Données initiales
INSERT INTO app_settings (key, value, category, description) VALUES
-- Branding
('app_name', 'Smart POS', 'branding', 'Nom de l''application'),
('app_slogan', 'Gérez votre commerce avec l''intelligence artificielle', 'branding', 'Slogan principal'),
('app_logo_url', '', 'branding', 'URL du logo (optionnel)'),

-- Landing Page - Hero
('landing_hero_title', 'Gérez votre commerce avec l''intelligence artificielle.', 'landing', 'Titre principal de la landing page'),
('landing_hero_subtitle', 'Le premier système de point de vente qui analyse vos stocks, prédit vos ventes et gère l''ensemble de vos boutiques en temps réel.', 'landing', 'Sous-titre de la landing page'),
('landing_hero_badge', 'Propulsé par l''IA', 'landing', 'Badge au-dessus du titre'),

-- Landing Page - Features
('landing_feature_1_title', 'Multi-Boutiques', 'landing', 'Titre de la feature 1'),
('landing_feature_1_desc', 'Gérez 1 ou 100 magasins depuis un seul tableau de bord centralisé.', 'landing', 'Description de la feature 1'),
('landing_feature_2_title', 'IA Intégrée', 'landing', 'Titre de la feature 2'),
('landing_feature_2_desc', 'Recevez des rapports prédictifs et des conseils stratégiques générés par IA.', 'landing', 'Description de la feature 2'),
('landing_feature_3_title', 'Inventaire Intelligent', 'landing', 'Titre de la feature 3'),
('landing_feature_3_desc', 'Alertes automatiques de stock bas et historique complet des mouvements.', 'landing', 'Description de la feature 3'),

-- Plans de Licence
('license_plan_starter_name', 'Starter', 'license', 'Nom du plan Starter'),
('license_plan_starter_price', '25.000', 'license', 'Prix du plan Starter (FCFA)'),
('license_plan_starter_period', '1 Mois', 'license', 'Durée du plan Starter'),
('license_plan_starter_features', '["1 Magasin", "Support Standard", "Rapports de base"]', 'license', 'Features du plan Starter (JSON array)'),

('license_plan_business_name', 'Business Pro', 'license', 'Nom du plan Business Pro'),
('license_plan_business_price', '250.000', 'license', 'Prix du plan Business Pro (FCFA)'),
('license_plan_business_period', '1 An', 'license', 'Durée du plan Business Pro'),
('license_plan_business_features', '["Boutiques Illimitées", "Insights IA", "Support Prioritaire"]', 'license', 'Features du plan Business Pro (JSON array)'),

('license_plan_enterprise_name', 'Enterprise', 'license', 'Nom du plan Enterprise'),
('license_plan_enterprise_price', '950.000', 'license', 'Prix du plan Enterprise (FCFA)'),
('license_plan_enterprise_period', 'À vie', 'license', 'Durée du plan Enterprise'),
('license_plan_enterprise_features', '["Tout Illimité", "Accès Early-Bird IA", "Serveur Dédié"]', 'license', 'Features du plan Enterprise (JSON array)'),

-- Contact
('contact_phone', '+2250584753743', 'contact', 'Numéro de téléphone'),
('contact_email', 'contact@smartpos.com', 'contact', 'Email de contact'),
('contact_whatsapp', '+2250584753743', 'contact', 'Numéro WhatsApp'),
('sales_email', 'sales@smartpos.com', 'contact', 'Email commercial');
```

### Étape 2: Backend API

```typescript
// backend/server.ts

// GET - Récupérer tous les paramètres ou par catégorie
app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = 'SELECT * FROM app_settings';
        const params: any[] = [];
        
        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY category, key';
        
        const result = await pool.query(query, params);
        
        // Transformer en objet clé-valeur
        const settings: Record<string, any> = {};
        result.rows.forEach(row => {
            // Parser JSON si nécessaire
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        });
        
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// PUT - Mettre à jour un paramètre (SuperAdmin uniquement)
app.put('/api/settings/:key', authenticateToken, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est SuperAdmin
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Forbidden: SuperAdmin only' });
        }
        
        const { key } = req.params;
        const { value } = req.body;
        
        // Convertir en string si c'est un objet/array
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;
        
        const result = await pool.query(
            `UPDATE app_settings 
             SET value = $1, updated_at = NOW(), updated_by = $2 
             WHERE key = $3 
             RETURNING *`,
            [valueStr, req.user.id, key]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// POST - Créer un nouveau paramètre (SuperAdmin uniquement)
app.post('/api/settings', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Forbidden: SuperAdmin only' });
        }
        
        const { key, value, category, description } = req.body;
        
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;
        
        const result = await pool.query(
            `INSERT INTO app_settings (key, value, category, description, updated_by) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [key, valueStr, category, description, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating setting:', error);
        res.status(500).json({ error: 'Failed to create setting' });
    }
});
```

### Étape 3: Frontend Context

```typescript
// frontend/contexts/AppSettingsContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

interface AppSettings {
    // Branding
    app_name: string;
    app_slogan: string;
    app_logo_url?: string;
    
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
    updateSetting: (key: string, value: any) => Promise<void>;
    reloadSettings: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

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

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    const loadSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/api/settings`);
            if (response.ok) {
                const data = await response.json();
                setSettings({ ...DEFAULT_SETTINGS, ...data });
            }
        } catch (error) {
            console.error('Failed to load app settings:', error);
            // Utiliser les valeurs par défaut
        } finally {
            setIsLoading(false);
        }
    };

    const updateSetting = async (key: string, value: any) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/api/settings/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ value })
        });

        if (!response.ok) {
            throw new Error('Failed to update setting');
        }

        // Recharger les paramètres
        await loadSettings();
    };

    const reloadSettings = async () => {
        setIsLoading(true);
        await loadSettings();
    };

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <AppSettingsContext.Provider value={{ settings, isLoading, updateSetting, reloadSettings }}>
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
```

### Étape 4: Interface SuperAdmin

```typescript
// frontend/pages/SuperAdminPage.tsx
// Ajouter un nouvel onglet "Personnalisation"

const [activeTab, setActiveTab] = useState<'licenses' | 'owners' | 'roles' | 'customization'>('licenses');

// Dans le rendu:
{activeTab === 'customization' && (
    <div className="space-y-6">
        <h3 className="text-xl font-bold">Personnalisation de l'Application</h3>
        
        {/* Section Branding */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl">
            <h4 className="font-bold mb-4">Branding</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Nom de l'Application</label>
                    <input 
                        type="text"
                        value={settings.app_name}
                        onChange={(e) => handleSettingChange('app_name', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Slogan</label>
                    <input 
                        type="text"
                        value={settings.app_slogan}
                        onChange={(e) => handleSettingChange('app_slogan', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
            </div>
        </div>
        
        {/* Section Landing Page */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl">
            <h4 className="font-bold mb-4">Landing Page - Hero</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Titre Principal</label>
                    <textarea 
                        value={settings.landing_hero_title}
                        onChange={(e) => handleSettingChange('landing_hero_title', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={2}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Sous-titre</label>
                    <textarea 
                        value={settings.landing_hero_subtitle}
                        onChange={(e) => handleSettingChange('landing_hero_subtitle', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        rows={3}
                    />
                </div>
            </div>
        </div>
        
        {/* Section Plans de Licence */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl">
            <h4 className="font-bold mb-4">Plans de Licence</h4>
            
            {/* Plan Starter */}
            <div className="mb-6 p-4 border rounded-lg">
                <h5 className="font-bold mb-3">Plan Starter</h5>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nom</label>
                        <input 
                            type="text"
                            value={settings.license_plan_starter_name}
                            onChange={(e) => handleSettingChange('license_plan_starter_name', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Prix (FCFA)</label>
                        <input 
                            type="text"
                            value={settings.license_plan_starter_price}
                            onChange={(e) => handleSettingChange('license_plan_starter_price', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Durée</label>
                        <input 
                            type="text"
                            value={settings.license_plan_starter_period}
                            onChange={(e) => handleSettingChange('license_plan_starter_period', e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Features (une par ligne)</label>
                        <textarea 
                            value={settings.license_plan_starter_features.join('\n')}
                            onChange={(e) => handleSettingChange('license_plan_starter_features', e.target.value.split('\n'))}
                            className="w-full px-4 py-2 border rounded-lg"
                            rows={3}
                        />
                    </div>
                </div>
            </div>
            
            {/* Répéter pour Business Pro et Enterprise */}
        </div>
        
        {/* Section Contact */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl">
            <h4 className="font-bold mb-4">Informations de Contact</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Téléphone</label>
                    <input 
                        type="tel"
                        value={settings.contact_phone}
                        onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp</label>
                    <input 
                        type="tel"
                        value={settings.contact_whatsapp}
                        onChange={(e) => handleSettingChange('contact_whatsapp', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Email Contact</label>
                    <input 
                        type="email"
                        value={settings.contact_email}
                        onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Email Commercial</label>
                    <input 
                        type="email"
                        value={settings.sales_email}
                        onChange={(e) => handleSettingChange('sales_email', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
            </div>
        </div>
        
        {/* Bouton Enregistrer */}
        <button 
            onClick={handleSaveAllSettings}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl"
        >
            Enregistrer Toutes les Modifications
        </button>
    </div>
)}
```

### Étape 5: Utilisation dans les Composants

```typescript
// frontend/pages/LandingPage.tsx

import { useAppSettings } from '../contexts/AppSettingsContext';

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    const { settings, isLoading } = useAppSettings();
    
    if (isLoading) {
        return <Spinner />;
    }
    
    return (
        <div>
            {/* Hero */}
            <h1>{settings.landing_hero_title}</h1>
            <p>{settings.landing_hero_subtitle}</p>
            
            {/* Features */}
            <div>
                <h3>{settings.landing_feature_1_title}</h3>
                <p>{settings.landing_feature_1_desc}</p>
            </div>
            
            {/* Plans */}
            <div>
                <h3>{settings.license_plan_business_name}</h3>
                <p>{settings.license_plan_business_price} FCFA</p>
                <ul>
                    {settings.license_plan_business_features.map(f => (
                        <li key={f}>{f}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
```

---

## 🚀 Ordre d'Implémentation

1. ✅ **Créer la table `app_settings`** dans PostgreSQL
2. ✅ **Insérer les données initiales** avec les valeurs actuelles
3. ✅ **Créer les endpoints API** dans `backend/server.ts`
4. ✅ **Créer le Context** `AppSettingsContext.tsx`
5. ✅ **Ajouter le Provider** dans `App.tsx`
6. ✅ **Créer l'onglet Personnalisation** dans `SuperAdminPage.tsx`
7. ✅ **Remplacer les valeurs hardcodées** dans `LandingPage.tsx`
8. ✅ **Remplacer les valeurs hardcodées** dans `TenantLicensePage.tsx`
9. ✅ **Tester** toutes les modifications
10. ✅ **Déployer** en production

---

## 📝 Notes Importantes

- Les paramètres sont chargés au démarrage de l'application
- Si l'API échoue, les valeurs par défaut sont utilisées
- Seul le SuperAdmin peut modifier les paramètres
- Les modifications sont appliquées immédiatement après enregistrement
- Possibilité d'ajouter un système de cache pour améliorer les performances

---

**Temps estimé d'implémentation**: 4-6 heures  
**Priorité**: Moyenne (fonctionnalité nice-to-have, pas critique)
