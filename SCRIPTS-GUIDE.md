# Guide des Scripts de Gestion de Base de Données

## 📋 Vue d'Ensemble

Ce document liste tous les scripts disponibles pour gérer les bases de données de développement et de production.

---

## 🔧 Scripts de Développement

### 1. Nettoyage de la Base de Développement

**Fichier** : `backend/scripts/clean-test-data.cjs`

**Utilisation** :
```bash
cd backend/scripts
node clean-test-data.cjs
```

**Description** :
- Supprime toutes les données de test de la base de développement
- Préserve le superadmin
- Utilise des transactions (ROLLBACK en cas d'erreur)
- Affiche un résumé détaillé

**Quand l'utiliser** :
- Après des tests intensifs
- Pour repartir sur une base propre
- Avant de tester de nouvelles fonctionnalités

**Sécurité** : ✅ Sûr (environnement de développement)

---

### 2. Vérification de la Base de Développement

**Fichier** : `backend/scripts/verify-production-db.cjs` (peut être adapté pour dev)

**Utilisation** :
```bash
cd backend/scripts
# Modifier le fichier pour pointer vers .env.development
node verify-production-db.cjs
```

**Description** :
- Affiche le nombre d'enregistrements par table
- Liste les utilisateurs, tenants, licences
- Vérifie l'intégrité des données
- Affiche l'état général

**Quand l'utiliser** :
- Avant un nettoyage
- Après un nettoyage
- Pour débugger des problèmes de données

**Sécurité** : ✅ Sûr (lecture seule)

---

## 🚨 Scripts de Production

### 3. Nettoyage de la Base de Production ⚠️

**Fichier** : `backend/scripts/clean-production-data.cjs`

**Utilisation** :
```bash
cd backend/scripts
# 1. Éditer le fichier et décommenter la ligne de confirmation
# 2. Exécuter
node clean-production-data.cjs
# 3. Recommenter la ligne de confirmation
```

**Description** :
- Supprime toutes les données de test de la base de production
- Préserve le superadmin
- Utilise des transactions (ROLLBACK en cas d'erreur)
- Affiche un résumé détaillé
- **NÉCESSITE UNE ACTIVATION MANUELLE**

**Quand l'utiliser** :
- ⚠️ **UNE SEULE FOIS** avant le lancement en production
- Pour nettoyer les données de test avant le go-live

**Sécurité** : 🚨 CRITIQUE
- ✅ Nécessite une activation manuelle
- ✅ Nécessite une sauvegarde préalable
- ✅ Utilise des transactions
- ⚠️ Opération irréversible

**Précautions OBLIGATOIRES** :
1. Créer une sauvegarde Supabase
2. Informer l'équipe
3. Planifier une fenêtre de maintenance
4. Tester en dev d'abord
5. Vérifier l'environnement

**Guide complet** : Voir `PRODUCTION-CLEANUP-GUIDE.md`

---

### 4. Vérification de la Base de Production

**Fichier** : `backend/scripts/verify-production-db.cjs`

**Utilisation** :
```bash
cd backend/scripts
node verify-production-db.cjs
```

**Description** :
- Affiche le nombre d'enregistrements par table
- Liste les utilisateurs, tenants, licences
- Vérifie l'intégrité des données
- Affiche l'état général
- Vérifie la présence du superadmin

**Quand l'utiliser** :
- **AVANT** le nettoyage de production
- **APRÈS** le nettoyage de production
- Pour monitorer l'état de la base
- Pour débugger des problèmes

**Sécurité** : ✅ Sûr (lecture seule)

---

## 🔐 Scripts de Gestion des Utilisateurs

### 5. Créer un Superadmin

**Fichier** : `backend/scripts/create-superadmin.cjs`

**Utilisation** :
```bash
cd backend/scripts
node create-superadmin.cjs
```

**Description** :
- Crée un compte superadmin
- Hash le mot de passe avec bcrypt
- Vérifie si le superadmin existe déjà

**Quand l'utiliser** :
- Première installation
- Si le superadmin a été supprimé par erreur

---

### 6. Réinitialiser le Mot de Passe Superadmin

**Fichier** : `backend/scripts/reset-superadmin-password.cjs`

**Utilisation** :
```bash
cd backend/scripts
node reset-superadmin-password.cjs
```

**Description** :
- Réinitialise le mot de passe du superadmin
- Hash le nouveau mot de passe avec bcrypt

**Quand l'utiliser** :
- Mot de passe oublié
- Compromission de sécurité

---

### 7. Ajouter un Superadmin

**Fichier** : `backend/scripts/add-superadmin.cjs`

**Utilisation** :
```bash
cd backend/scripts
node add-superadmin.cjs
```

**Description** :
- Ajoute un nouveau superadmin
- Permet d'avoir plusieurs superadmins

---

## 🔑 Scripts de Gestion des Licences

### 8. Créer une Licence de Démo

**Fichier** : `backend/scripts/create-demo-license.cjs`

**Utilisation** :
```bash
cd backend/scripts
node create-demo-license.cjs
```

**Description** :
- Crée une licence de démonstration
- Durée configurable
- Plan configurable

---

### 9. Vérifier les Licences

**Fichier** : `backend/scripts/check-licenses.cjs`

**Utilisation** :
```bash
cd backend/scripts
node check-licenses.cjs
```

**Description** :
- Liste toutes les licences
- Affiche leur statut (active/expirée)
- Affiche les jours restants

---

### 10. Tester la Validation des Licences

**Fichier** : `backend/scripts/test-license-validation.cjs`

**Utilisation** :
```bash
cd backend/scripts
node test-license-validation.cjs
```

**Description** :
- Teste la validation des licences
- Vérifie les dates d'expiration
- Vérifie les plans

---

## 🗄️ Scripts de Configuration

### 11. Configuration de la Base de Données (PowerShell)

**Fichier** : `backend/scripts/setup-db.ps1`

**Utilisation** :
```powershell
cd backend/scripts
.\setup-db.ps1
```

**Description** :
- Configure la base de données
- Crée les tables
- Insère les données initiales

---

### 12. Configuration de la Base de Données (Batch)

**Fichier** : `backend/scripts/setup-db.bat`

**Utilisation** :
```cmd
cd backend\scripts
setup-db.bat
```

**Description** :
- Version Windows du script de configuration
- Même fonctionnalité que setup-db.ps1

---

## 📊 Tableau Récapitulatif

| Script | Environnement | Sécurité | Opération | Activation |
|--------|---------------|----------|-----------|------------|
| clean-test-data.cjs | DEV | ✅ Sûr | Écriture | Automatique |
| clean-production-data.cjs | PROD | 🚨 Critique | Écriture | **Manuelle** |
| verify-production-db.cjs | PROD/DEV | ✅ Sûr | Lecture | Automatique |
| create-superadmin.cjs | PROD/DEV | ⚠️ Important | Écriture | Automatique |
| reset-superadmin-password.cjs | PROD/DEV | ⚠️ Important | Écriture | Automatique |
| add-superadmin.cjs | PROD/DEV | ⚠️ Important | Écriture | Automatique |
| create-demo-license.cjs | DEV | ✅ Sûr | Écriture | Automatique |
| check-licenses.cjs | PROD/DEV | ✅ Sûr | Lecture | Automatique |
| test-license-validation.cjs | DEV | ✅ Sûr | Lecture | Automatique |
| setup-db.ps1 | DEV | ✅ Sûr | Écriture | Automatique |
| setup-db.bat | DEV | ✅ Sûr | Écriture | Automatique |

---

## 🎯 Workflows Recommandés

### Workflow 1 : Nettoyage de Développement

```bash
# 1. Vérifier l'état actuel
cd backend/scripts
node verify-production-db.cjs  # (adapter pour dev)

# 2. Nettoyer
node clean-test-data.cjs

# 3. Vérifier le résultat
node verify-production-db.cjs  # (adapter pour dev)
```

---

### Workflow 2 : Nettoyage de Production (GO-LIVE)

```bash
# 1. SAUVEGARDE OBLIGATOIRE
# Aller sur Supabase Dashboard > Database > Backups > Create backup

# 2. Vérifier l'état actuel
cd backend/scripts
node verify-production-db.cjs

# 3. Activer le script de nettoyage
# Éditer clean-production-data.cjs
# Décommenter : const CONFIRM_PRODUCTION_CLEANUP = true;

# 4. Nettoyer
node clean-production-data.cjs

# 5. Vérifier le résultat
node verify-production-db.cjs

# 6. Désactiver le script
# Éditer clean-production-data.cjs
# Recommenter : // const CONFIRM_PRODUCTION_CLEANUP = true;

# 7. Tester l'application
# Se connecter avec le superadmin
# Créer un propriétaire de test
# Vérifier la licence d'essai
```

---

### Workflow 3 : Réinitialisation du Superadmin

```bash
# 1. Vérifier que le superadmin existe
cd backend/scripts
node verify-production-db.cjs

# 2. Réinitialiser le mot de passe
node reset-superadmin-password.cjs

# 3. Tester la connexion
# Se connecter avec le nouveau mot de passe
```

---

## 📝 Bonnes Pratiques

### Avant d'Exécuter un Script

1. ✅ Lire la documentation du script
2. ✅ Vérifier l'environnement (DEV ou PROD)
3. ✅ Créer une sauvegarde (si PROD)
4. ✅ Tester en DEV d'abord (si possible)
5. ✅ Informer l'équipe (si PROD)

### Après l'Exécution d'un Script

1. ✅ Vérifier les logs
2. ✅ Vérifier le résultat avec verify-production-db.cjs
3. ✅ Tester l'application
4. ✅ Documenter l'opération

### Sécurité

1. 🚨 **JAMAIS** exécuter un script de production sans sauvegarde
2. 🚨 **JAMAIS** laisser un script critique activé
3. ✅ **TOUJOURS** vérifier l'environnement
4. ✅ **TOUJOURS** lire les logs

---

## 🆘 En Cas de Problème

### Erreur de Connexion

```
❌ Erreur : connection timeout
```

**Solutions** :
1. Vérifier la connexion internet
2. Vérifier DATABASE_URL dans .env
3. Vérifier que Supabase est accessible

### Transaction Annulée

```
❌ Erreur lors du nettoyage : ...
🔄 Transaction annulée (ROLLBACK)
```

**Bonne nouvelle** : Aucune donnée n'a été modifiée.

**Solutions** :
1. Lire le message d'erreur
2. Corriger le problème
3. Réessayer

### Données Manquantes Après Nettoyage

**Si le superadmin a été supprimé** :
```bash
cd backend/scripts
node create-superadmin.cjs
```

**Si des données importantes ont été supprimées** :
1. Restaurer depuis la sauvegarde Supabase
2. Contacter l'équipe technique

---

## 📞 Support

Pour toute question ou problème :

1. Consulter ce guide
2. Consulter `PRODUCTION-CLEANUP-GUIDE.md`
3. Vérifier les logs des scripts
4. Contacter l'équipe technique

---

**Date de création** : 7 février 2026
**Dernière mise à jour** : 7 février 2026
**Version** : 1.0
