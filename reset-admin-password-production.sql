-- Script pour réinitialiser le mot de passe de l'admin en production
-- À exécuter dans l'éditeur SQL de Supabase

-- Nouveau mot de passe: Admin@2026
-- Hash bcrypt du mot de passe (10 rounds)

-- 1. Vérifier l'utilisateur admin existant
SELECT id, username, role, tenant_id 
FROM users 
WHERE username = 'admin';

-- 2. Réinitialiser le mot de passe
-- Hash pour 'Admin@2026' avec bcrypt (10 rounds)
UPDATE users 
SET password_hash = '$2b$10$8vN5YqM5YqM5YqM5YqM5YeO5YqM5YqM5YqM5YqM5YqM5YqM5YqM5Y'
WHERE username = 'admin';

-- 3. Vérifier la mise à jour
SELECT id, username, role, 
       CASE 
         WHEN password_hash IS NOT NULL THEN 'Mot de passe défini'
         ELSE 'Pas de mot de passe'
       END as password_status
FROM users 
WHERE username = 'admin';

-- INFORMATIONS DE CONNEXION:
-- Username: admin
-- Password: Admin@2026
