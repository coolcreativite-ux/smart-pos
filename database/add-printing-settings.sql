-- Migration pour ajouter les paramètres d'impression à la table settings
-- À exécuter après le schéma principal

-- Ajouter les colonnes pour les paramètres d'impression
ALTER TABLE settings ADD COLUMN IF NOT EXISTS printing_settings JSONB DEFAULT '{
  "autoPrint": true,
  "paperWidth": "80mm",
  "showBarcodes": true,
  "promotionalMessages": [
    "Merci pour votre visite ! Revenez nous voir bientôt.",
    "Suivez-nous sur les réseaux sociaux pour nos offres spéciales.",
    "Recommandez-nous à vos amis et obtenez 10% de réduction.",
    "Prochaine visite : -5% avec ce ticket (valable 30 jours).",
    "Votre satisfaction est notre priorité. Merci de votre confiance."
  ],
  "printStatistics": {
    "enabled": true,
    "totalReceipts": 0,
    "paperSaved": 0
  }
}';

-- Mettre à jour les paramètres existants avec les valeurs par défaut
UPDATE settings 
SET printing_settings = '{
  "autoPrint": true,
  "paperWidth": "80mm",
  "showBarcodes": true,
  "promotionalMessages": [
    "Merci pour votre visite ! Revenez nous voir bientôt.",
    "Suivez-nous sur les réseaux sociaux pour nos offres spéciales.",
    "Recommandez-nous à vos amis et obtenez 10% de réduction.",
    "Prochaine visite : -5% avec ce ticket (valable 30 jours).",
    "Votre satisfaction est notre priorité. Merci de votre confiance."
  ],
  "printStatistics": {
    "enabled": true,
    "totalReceipts": 0,
    "paperSaved": 0
  }
}'
WHERE printing_settings IS NULL OR printing_settings = '{}';

-- Vérifier que la migration a fonctionné
SELECT tenant_id, store_name, printing_settings FROM settings;