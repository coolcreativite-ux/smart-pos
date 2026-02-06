# 🔄 Migration des Paramètres vers PostgreSQL

## 📋 **Étapes de Migration**

### 1. **Exécuter la Migration SQL**

Ouvrez votre client PostgreSQL (pgAdmin, DBeaver, ou ligne de commande) et exécutez :

```sql
-- Ajouter la colonne pour les paramètres d'impression
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

-- Mettre à jour les paramètres existants
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

-- Vérifier la migration
SELECT tenant_id, store_name, printing_settings FROM settings;
```

### 2. **Redémarrer le Serveur Backend**

Le serveur backend a été mis à jour avec les nouvelles routes API :
- `GET /api/settings/:tenantId` - Récupérer les paramètres
- `PUT /api/settings/:tenantId` - Sauvegarder les paramètres

### 3. **Tester la Migration**

1. **Redémarrer l'application** (frontend + backend)
2. **Se connecter** avec vos identifiants
3. **Aller dans Paramètres** → **Paramètres d'Impression**
4. **Modifier un paramètre** (ex: décocher "Impression automatique")
5. **Sauvegarder** et vérifier les logs dans la console

## ✅ **Avantages de la Migration**

### **Avant (localStorage)**
- ❌ Paramètres perdus si on change de navigateur
- ❌ Configuration à refaire sur chaque poste
- ❌ Pas de synchronisation entre utilisateurs
- ❌ Pas de sauvegarde centralisée

### **Après (PostgreSQL)**
- ✅ **Paramètres centralisés** dans la base de données
- ✅ **Synchronisation automatique** entre tous les postes
- ✅ **Sauvegarde incluse** dans les backups de la DB
- ✅ **Fallback intelligent** vers localStorage si l'API échoue
- ✅ **Migration transparente** des anciens paramètres

## 🔍 **Vérification**

### **Logs à Surveiller**
```
✅ Paramètres chargés depuis la base de données
✅ Paramètres sauvegardés dans la base de données
```

### **En Cas de Problème**
```
⚠️ Paramètres sauvegardés en local uniquement
❌ Erreur lors de la sauvegarde des paramètres dans l'API
```

## 🛠️ **Dépannage**

### **Si les paramètres ne se sauvegardent pas :**
1. Vérifier que le serveur backend fonctionne (http://localhost:5000)
2. Vérifier que la migration SQL a été exécutée
3. Consulter les logs de la console navigateur
4. Vérifier les logs du serveur backend

### **Rollback si nécessaire :**
Les anciens paramètres restent dans localStorage comme fallback automatique.

## 📊 **Structure des Données**

### **Base de Données (PostgreSQL)**
```sql
settings.printing_settings = {
  "autoPrint": true,
  "paperWidth": "80mm", 
  "showBarcodes": true,
  "promotionalMessages": [...],
  "printStatistics": {
    "enabled": true,
    "totalReceipts": 0,
    "paperSaved": 0
  }
}
```

### **Application (TypeScript)**
```typescript
interface Settings {
  tenantId: number;
  storeName: string;
  taxRate: number;
  loyaltyProgram: {...};
  printing: {
    autoPrint: boolean;
    paperWidth: '58mm' | '80mm';
    showBarcodes: boolean;
    promotionalMessages: string[];
    printStatistics: {...};
  };
}
```