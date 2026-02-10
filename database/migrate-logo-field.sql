-- Migration pour renommer le champ logo_url en store_logo_url
-- Cette migration sépare le logo de l'application SaaS du logo du magasin

-- Renommer la colonne dans la table store_settings
ALTER TABLE store_settings 
RENAME COLUMN logo_url TO store_logo_url;

-- Ajouter un commentaire pour clarifier l'usage
COMMENT ON COLUMN store_settings.store_logo_url IS 'Logo du magasin (affiché uniquement sur les tickets de caisse)';

-- Optionnel: Mettre à jour les données existantes si nécessaire
-- UPDATE store_settings SET store_logo_url = NULL WHERE store_logo_url = '';