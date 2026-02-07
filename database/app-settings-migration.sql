-- Migration: Créer la table app_settings pour la personnalisation
-- Date: 2026-02-07

-- Créer la table app_settings
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Insérer les données initiales
INSERT INTO app_settings (key, value, category, description) VALUES
-- Branding
('app_name', 'Smart POS', 'branding', 'Nom de l''application'),
('app_slogan', 'Gérez votre commerce avec l''intelligence artificielle', 'branding', 'Slogan principal'),

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

-- Plans de Licence - Starter
('license_plan_starter_name', 'Starter', 'license', 'Nom du plan Starter'),
('license_plan_starter_price', '25.000', 'license', 'Prix du plan Starter (FCFA)'),
('license_plan_starter_period', '1 Mois', 'license', 'Durée du plan Starter'),
('license_plan_starter_features', '["1 Magasin", "Support Standard", "Rapports de base"]', 'license', 'Features du plan Starter (JSON array)'),

-- Plans de Licence - Business Pro
('license_plan_business_name', 'Business Pro', 'license', 'Nom du plan Business Pro'),
('license_plan_business_price', '250.000', 'license', 'Prix du plan Business Pro (FCFA)'),
('license_plan_business_period', '1 An', 'license', 'Durée du plan Business Pro'),
('license_plan_business_features', '["Boutiques Illimitées", "Insights IA", "Support Prioritaire"]', 'license', 'Features du plan Business Pro (JSON array)'),

-- Plans de Licence - Enterprise
('license_plan_enterprise_name', 'Enterprise', 'license', 'Nom du plan Enterprise'),
('license_plan_enterprise_price', '950.000', 'license', 'Prix du plan Enterprise (FCFA)'),
('license_plan_enterprise_period', 'À vie', 'license', 'Durée du plan Enterprise'),
('license_plan_enterprise_features', '["Tout Illimité", "Accès Early-Bird IA", "Serveur Dédié"]', 'license', 'Features du plan Enterprise (JSON array)'),

-- Contact
('contact_phone', '+2250584753743', 'contact', 'Numéro de téléphone'),
('contact_email', 'contact@smartpos.com', 'contact', 'Email de contact'),
('contact_whatsapp', '+2250584753743', 'contact', 'Numéro WhatsApp'),
('sales_email', 'sales@smartpos.com', 'contact', 'Email commercial')

ON CONFLICT (key) DO NOTHING;

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table app_settings créée avec succès !';
    RAISE NOTICE 'Nombre de paramètres insérés: %', (SELECT COUNT(*) FROM app_settings);
END $$;
