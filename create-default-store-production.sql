-- Script pour créer un magasin par défaut en production
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les magasins existants
SELECT id, tenant_id, name FROM stores ORDER BY id;

-- 2. Créer un magasin par défaut pour chaque tenant qui n'en a pas
-- Remplacez TENANT_ID par l'ID de votre tenant (probablement 8 d'après les logs)

INSERT INTO stores (tenant_id, name, location, phone)
VALUES 
  (8, 'Magasin Principal', 'Abidjan', '0000000000')
ON CONFLICT DO NOTHING;

-- 3. Vérifier que le magasin a été créé
SELECT id, tenant_id, name FROM stores WHERE tenant_id = 8;

-- Note: Si vous avez plusieurs tenants, répétez l'INSERT pour chaque tenant_id
