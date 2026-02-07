# Guide de Nettoyage de la Base de Données Production 🚨

## ⚠️ ATTENTION - OPÉRATION CRITIQUE

Ce guide explique comment nettoyer la base de données de **PRODUCTION**. Cette opération est **IRRÉVERSIBLE** et doit être effectuée avec une extrême prudence.

---

## 🎯 Objectif

Supprimer toutes les données de test de la base de données de production pour la préparer au lancement officiel.

---

## ⚠️ Précautions OBLIGATOIRES

### Avant d'Exécuter le Script

1. **✅ SAUVEGARDE OBLIGATOIRE**
   ```bash
   # Via Supabase Dashboard
   # 1. Aller sur https://supabase.com
   # 2. Sélectionner le projet PRODUCTION (lsujhpaxdsirlnllangt)
   # 3. Aller dans Database > Backups
   # 4. Créer une sauvegarde manuelle
   ```

2. **✅ VÉRIFIER L'ENVIRONNEMENT**
   ```bash
   # S'assurer qu'on est bien sur PRODUCTION
   cat backend/.env.production
   # Vérifier que DATABASE_URL pointe vers le bon projet Supabase
   ```

3. **✅ INFORMER L'ÉQUIPE**
   - Prévenir tous les utilisateurs
   - Planifier une fenêtre de maintenance
   - Documenter l'opération

4. **✅ TESTER EN DEV D'ABORD**
   ```bash
   # Tester le script sur la base de développement
   cd backend/scripts
   node clean-test-data.cjs
   ```

---

## 📋 Ce qui Sera Supprimé

Le script supprime **TOUTES** les données de test :

| Entité | Description |
|--------|-------------|
| 💰 Ventes | Toutes les ventes et leurs items (sauf tenant_id = 0) |
| 📦 Produits | Tous les produits, variantes et inventaire |
| 👥 Clients | Tous les clients |
| 👤 Utilisateurs | Tous les utilisateurs (sauf superadmin) |
| 🏢 Tenants | Tous les tenants (sauf tenant_id = 0) |
| 🔑 Licences | Toutes les licences de test |
| ⚙️ Settings | Tous les paramètres de test |
| 📝 Logs | Tous les logs d'action |
| 🏷️ Catégories | Toutes les catégories |

---

## 🔐 Ce qui Sera Préservé

Le script **PRÉSERVE** :

- ✅ Le superadmin (tenant_id = 0)
- ✅ Les tables système
- ✅ La structure de la base de données
- ✅ Les contraintes et index

---

## 🚀 Procédure d'Exécution

### Étape 1 : Préparation

```bash
# 1. Aller dans le dossier scripts
cd backend/scripts

# 2. Vérifier que le fichier existe
dir clean-production-data.cjs

# 3. Vérifier la connexion à la DB de production
node -e "const {Pool}=require('pg');require('dotenv').config({path:'../.env.production'});const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query('SELECT 1').then(()=>console.log('✅ Connexion OK')).catch(e=>console.error('❌',e)).finally(()=>p.end())"
```

### Étape 2 : Activation du Script

**⚠️ IMPORTANT** : Par sécurité, le script est désactivé par défaut.

Pour l'activer :

1. Ouvrir le fichier `backend/scripts/clean-production-data.cjs`
2. Trouver la ligne :
   ```javascript
   // const CONFIRM_PRODUCTION_CLEANUP = true;
   ```
3. Décommenter cette ligne :
   ```javascript
   const CONFIRM_PRODUCTION_CLEANUP = true;
   ```
4. Sauvegarder le fichier

### Étape 3 : Exécution

```bash
# Exécuter le script
node clean-production-data.cjs
```

### Étape 4 : Vérification

Le script affiche automatiquement :
- ✅ Nombre d'éléments supprimés par table
- ✅ Nombre d'éléments restants
- ✅ Résumé complet

**Vérification manuelle** :

```bash
# Via l'API (si le backend est démarré)
curl "https://api.smartpos.cooldigital.africa/api/users" -UseBasicParsing
curl "https://api.smartpos.cooldigital.africa/api/products" -UseBasicParsing
curl "https://api.smartpos.cooldigital.africa/api/customers" -UseBasicParsing
curl "https://api.smartpos.cooldigital.africa/api/sales" -UseBasicParsing
```

### Étape 5 : Désactivation du Script

**⚠️ IMPORTANT** : Après utilisation, désactiver le script pour éviter une exécution accidentelle.

1. Ouvrir le fichier `backend/scripts/clean-production-data.cjs`
2. Recommenter la ligne :
   ```javascript
   // const CONFIRM_PRODUCTION_CLEANUP = true;
   ```
3. Sauvegarder le fichier

---

## 📊 Exemple de Sortie

```
🚨 NETTOYAGE DE LA BASE DE DONNÉES PRODUCTION 🚨
================================================

🔄 Transaction démarrée...

1️⃣  Suppression des ventes de test...
   ✅ 15 items de vente supprimés
   ✅ 5 ventes supprimées

2️⃣  Suppression de l'inventaire de test...
   ✅ 20 entrées d'inventaire supprimées

3️⃣  Suppression des variantes de produits de test...
   ✅ 10 variantes supprimées

4️⃣  Suppression des produits de test...
   ✅ 5 produits supprimés

5️⃣  Suppression des clients de test...
   ✅ 3 clients supprimés

6️⃣  Suppression des licences de test...
   ✅ 2 licences supprimées

7️⃣  Suppression des settings de test...
   ✅ 1 settings supprimés

8️⃣  Suppression des action logs de test...
   ✅ 50 logs supprimés

9️⃣  Suppression des utilisateurs de test...
   ✅ 2 utilisateurs supprimés

🔟 Suppression des tenants de test...
   ✅ 2 tenants supprimés

1️⃣1️⃣  Suppression des catégories de test...
   ✅ 5 catégories supprimées

✅ Transaction validée (COMMIT)

📊 RÉSUMÉ DU NETTOYAGE
======================
✅ 5 ventes supprimées
✅ 15 items de vente supprimés
✅ 5 produits supprimés
✅ 10 variantes supprimées
✅ 20 entrées d'inventaire supprimées
✅ 3 clients supprimés
✅ 2 licences supprimées
✅ 1 settings supprimés
✅ 50 logs supprimés
✅ 2 utilisateurs supprimés
✅ 2 tenants supprimés
✅ 5 catégories supprimées

🔍 VÉRIFICATION DES DONNÉES RESTANTES
=====================================
👤 Utilisateurs restants : 1
🏢 Tenants restants : 1
📦 Produits restants : 0
👥 Clients restants : 0
💰 Ventes restantes : 0
🔑 Licences restantes : 0

✅ Nettoyage de la base de données PRODUCTION terminé avec succès !
🎉 La base de données est maintenant propre et prête pour la production.
```

---

## 🔄 En Cas d'Erreur

### Erreur de Connexion

```
❌ Erreur lors du nettoyage : connection timeout
```

**Solution** :
1. Vérifier la connexion internet
2. Vérifier que DATABASE_URL est correct dans `.env.production`
3. Vérifier que Supabase est accessible

### Transaction Annulée

```
❌ Erreur lors du nettoyage : ...
🔄 Transaction annulée (ROLLBACK)
```

**Bonne nouvelle** : Aucune donnée n'a été supprimée grâce au ROLLBACK automatique.

**Solution** :
1. Lire le message d'erreur
2. Corriger le problème
3. Réessayer

---

## 📝 Checklist Post-Nettoyage

Après le nettoyage, vérifier :

- [ ] Le superadmin existe toujours
- [ ] Aucun produit de test ne reste
- [ ] Aucun client de test ne reste
- [ ] Aucune vente de test ne reste
- [ ] Aucun utilisateur de test ne reste (sauf superadmin)
- [ ] L'application fonctionne correctement
- [ ] On peut se connecter avec le superadmin
- [ ] On peut créer un nouveau propriétaire
- [ ] La licence d'essai est créée automatiquement

---

## 🔐 Sécurité

### Accès au Script

- ✅ Le script nécessite une activation manuelle
- ✅ Le script utilise des transactions (ROLLBACK en cas d'erreur)
- ✅ Le script affiche un résumé détaillé
- ✅ Le script préserve le superadmin

### Recommandations

1. **Ne jamais** exécuter ce script sans sauvegarde
2. **Ne jamais** laisser le script activé après utilisation
3. **Toujours** vérifier l'environnement avant exécution
4. **Toujours** informer l'équipe avant exécution

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs** du script
2. **Consulter la sauvegarde** Supabase
3. **Contacter l'équipe** technique
4. **Restaurer depuis la sauvegarde** si nécessaire

---

## ✅ Après le Nettoyage

Une fois le nettoyage effectué :

1. **Désactiver le script** (recommenter la ligne de confirmation)
2. **Tester l'application** complètement
3. **Créer le premier propriétaire** réel
4. **Vérifier la licence d'essai** automatique
5. **Documenter** l'opération dans les logs

---

## 🎯 Résultat Attendu

Après le nettoyage, la base de données de production doit contenir :

- ✅ 1 superadmin (admin)
- ✅ 1 tenant (tenant_id = 0)
- ✅ 0 produits
- ✅ 0 clients
- ✅ 0 ventes
- ✅ 0 utilisateurs de test
- ✅ 0 licences de test

La base est **propre** et **prête** pour les premiers vrais utilisateurs ! 🎉

---

**Date de création** : 7 février 2026
**Dernière mise à jour** : 7 février 2026
**Version** : 1.0
