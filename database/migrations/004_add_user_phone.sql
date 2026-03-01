-- Migration: Ajouter colonne phone à la table users
-- Date: 2026-03-01
-- Description: Permet aux utilisateurs (y compris caissiers) de stocker leur numéro de téléphone

-- Ajouter la colonne phone à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Commentaire pour documentation
COMMENT ON COLUMN users.phone IS 'Numéro de téléphone personnel de l''utilisateur';
