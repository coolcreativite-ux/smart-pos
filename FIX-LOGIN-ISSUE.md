# 🔧 Correction: Problème de Connexion "Utilisateur Invalide"

## Date: 11 février 2026

---

## ❌ PROBLÈME

Vous avez des utilisateurs dans la base de données, mais vous recevez le message "Utilisateur invalide" ou "Mot de passe incorrect" lors de la connexion.

---

## 🔍 CAUSES POSSIBLES

### 1. Mot de Passe Non Hashé
Les mots de passe dans la base de données doivent être hashés avec bcrypt. Si le champ `password_hash` est vide ou contient un mot de passe en clair, la connexion échouera.

### 2. Username Sensible à la Casse
Le username est sensible à la casse. `Admin` ≠ `admin` ≠ `ADMIN`

### 3. Mot de Passe Incorrect
Le mot de passe que vous utilisez ne correspond pas au hash dans la base de données.

---

## ✅ SOLUTION RAPIDE

### Exécutez le Script de Réparation

**Dans PowerShell, à la racine du projet:**

```powershell
.\fix-passwords.ps1
```

**OU manuellement:**

```powershell
cd backend
node scripts/fix-user-passwords.cjs
```

### Ce que fait le script:

1. ✅ Liste tous les utilisateurs dans la base de données
2. ✅ Vérifie si le `password_hash` existe et est valide
3. ✅ Répare les mots de passe manquants ou invalides
4. ✅ Définit le mot de passe à `admin123` pour tous les utilisateurs réparés
5. ✅ Affiche les identifiants de connexion disponibles

### Résultat attendu:

```
🔍 Vérification des utilisateurs...

📋 3 utilisateurs trouvés:

   ID: 1
   Username: superadmin
   Role: superadmin
   Password Hash: ✅ Existe

   ID: 2
   Username: owner1
   Role: owner
   Password Hash: ❌ MANQUANT

   ID: 3
   Username: admin
   Role: admin
   Password Hash: ✅ Existe

🔧 Réparation des mots de passe...

   ⚠️  Réparation de owner1...
   ✅ Mot de passe réparé pour owner1

✅ 1 utilisateur(s) réparé(s)

🔑 Tous les utilisateurs réparés ont maintenant le mot de passe:
   Password: admin123

📋 Identifiants de connexion disponibles:

   Username: superadmin
   Password: admin123
   Role: superadmin

   Username: owner1
   Password: admin123
   Role: owner

   Username: admin
   Password: admin123
   Role: admin

🚀 Vous pouvez maintenant vous connecter!
```

---

## 🧪 TESTER LA CONNEXION

### Étape 1: Rafraîchir la Page
Appuyez sur **F5** dans le navigateur pour rafraîchir la page de connexion.

### Étape 2: Se Connecter
Utilisez un des identifiants affichés par le script:
- **Username:** (celui affiché par le script)
- **Password:** `admin123`

### Étape 3: Vérifier
Si la connexion réussit, vous verrez le tableau de bord.

---

## 🔍 DIAGNOSTIC MANUEL

### Vérifier les Utilisateurs dans la Base de Données

```sql
-- Voir tous les utilisateurs
SELECT id, username, role, 
       CASE 
         WHEN password_hash IS NULL THEN '❌ NULL'
         WHEN LENGTH(password_hash) < 10 THEN '⚠️ INVALIDE'
         ELSE '✅ OK'
       END as password_status
FROM users
ORDER BY id;
```

### Vérifier un Username Spécifique

```sql
-- Remplacez 'votre_username' par le username que vous essayez
SELECT * FROM users WHERE username = 'votre_username';
```

### Vérifier si le Username est Sensible à la Casse

```sql
-- Chercher sans tenir compte de la casse
SELECT username, role FROM users WHERE LOWER(username) = LOWER('votre_username');
```

---

## 🔧 RÉPARATION MANUELLE

### Option 1: Réinitialiser un Mot de Passe Spécifique

```sql
-- 1. Générer un hash bcrypt pour "admin123"
-- Utilisez un outil en ligne ou Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('admin123', 10);
-- console.log(hash);

-- 2. Mettre à jour le mot de passe
UPDATE users 
SET password_hash = '$2b$10$YourBcryptHashHere'
WHERE username = 'votre_username';
```

### Option 2: Créer un Nouveau SuperAdmin

```bash
# Exécuter le script de création
cd backend
node scripts/add-superadmin.cjs
```

Cela créera ou mettra à jour le superadmin avec:
- **Username:** `superadmin`
- **Password:** `admin123`

---

## 📋 VÉRIFICATION DES LOGS

### Logs Backend
Dans le terminal où le backend tourne, vous verrez:

**Si l'utilisateur n'existe pas:**
```
❌ Utilisateur non trouvé
```

**Si le mot de passe est incorrect:**
```
❌ Mot de passe incorrect
```

**Si le password_hash est manquant:**
```
❌ Mot de passe manquant pour l'utilisateur: username
```

**Si la connexion réussit:**
```
✅ Connexion réussie pour: username
```

### Logs Frontend
Dans la console du navigateur (F12):

**Si le backend n'est pas accessible:**
```
POST http://localhost:5000/api/auth/login 401 (Unauthorized)
API backend non disponible, utilisation de l'authentification locale
```

**Si la connexion réussit:**
```
✅ Connexion réussie
```

---

## 🎯 CHECKLIST DE DÉPANNAGE

- [ ] Backend démarré (`npm run dev`)
- [ ] Backend accessible (`curl http://localhost:5000/api/health`)
- [ ] Script de réparation exécuté (`.\fix-passwords.ps1`)
- [ ] Page de connexion rafraîchie (F5)
- [ ] Username correct (sensible à la casse)
- [ ] Mot de passe correct (`admin123` après réparation)
- [ ] Logs backend vérifiés

---

## 🔑 MOTS DE PASSE PAR DÉFAUT

Après exécution du script de réparation, tous les utilisateurs réparés auront:
- **Password:** `admin123`

Vous pouvez changer ce mot de passe après connexion via l'interface utilisateur.

---

## 💡 CONSEILS

### Créer un Nouveau Propriétaire
Si vous ne pouvez toujours pas vous connecter:

1. Connectez-vous en tant que superadmin
2. Allez dans "Gestion des Utilisateurs"
3. Créez un nouveau propriétaire
4. Le système créera automatiquement un tenant et une licence d'essai

### Réinitialiser Complètement
Si rien ne fonctionne:

```bash
# Supprimer tous les utilisateurs sauf le superadmin
cd backend
node scripts/clean-test-data.cjs

# Recréer le superadmin
node scripts/add-superadmin.cjs
```

---

## 📞 BESOIN D'AIDE?

### Vérifier la Structure de la Table Users

```sql
\d users
-- ou
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### Vérifier que bcrypt Fonctionne

```javascript
// Dans Node.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('admin123', 10);
console.log('Hash:', hash);

const isValid = await bcrypt.compare('admin123', hash);
console.log('Valid:', isValid); // Devrait être true
```

---

**Après avoir exécuté le script de réparation, vous devriez pouvoir vous connecter avec n'importe quel utilisateur en utilisant le mot de passe `admin123`!** 🎉
