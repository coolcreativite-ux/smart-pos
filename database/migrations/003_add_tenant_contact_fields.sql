-- Migration: Ajout des champs de contact (phone, email, rccm) et logo_url à la table tenants
-- Date: 2026-02-28
-- Description: Ajoute les colonnes phone, email, rccm et logo_url pour les informations de l'entreprise

-- Ajouter la colonne phone si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'phone'
    ) THEN
        ALTER TABLE tenants ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'Colonne phone ajoutée à la table tenants';
    ELSE
        RAISE NOTICE 'Colonne phone existe déjà dans la table tenants';
    END IF;
END $$;

-- Ajouter la colonne email si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'email'
    ) THEN
        ALTER TABLE tenants ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Colonne email ajoutée à la table tenants';
    ELSE
        RAISE NOTICE 'Colonne email existe déjà dans la table tenants';
    END IF;
END $$;

-- Ajouter la colonne rccm si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'rccm'
    ) THEN
        ALTER TABLE tenants ADD COLUMN rccm VARCHAR(100);
        RAISE NOTICE 'Colonne rccm ajoutée à la table tenants';
    ELSE
        RAISE NOTICE 'Colonne rccm existe déjà dans la table tenants';
    END IF;
END $$;

-- Ajouter la colonne logo_url si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE tenants ADD COLUMN logo_url VARCHAR(500);
        RAISE NOTICE 'Colonne logo_url ajoutée à la table tenants';
    ELSE
        RAISE NOTICE 'Colonne logo_url existe déjà dans la table tenants';
    END IF;
END $$;

-- Vérification
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN ('phone', 'email', 'rccm', 'logo_url')
ORDER BY column_name;
