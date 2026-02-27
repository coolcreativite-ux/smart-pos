# 🔐 Guide de Connexion Rapide

## Date: 11 février 2026

---

## 🚀 Solution Rapide: Créer un Superadmin

### Étape 1: Exécuter le Script de Création

Ouvrez un terminal dans le dossier `backend` et exécutez:

```bash
node scripts/add-superadmin.cjs
```

**Résultat attendu:**
```
🔐 Ajout du SuperAdmin...
✅ SuperAdmin créé avec succès!

🔑 Identifiants SuperAdmin:
   Username: superadmin
   Password: admin123

🚀 Le SuperAdmin peut maintenant se connecter!
```

### Étape 2: Se Connecter

Dans l'interface web:
- **Username:** `superadmin`
- **Password:** `admin123`

---

## 👤 Créer un Propriétaire (Owner)

Une fois connecté en tant que superadmin:

### Option 1: Via l'Interface Web

1. **Aller dans "Gestion des Utilisateurs"**
2. **Cliquer sur "Ajouter un utilisateur"**
3. **Remplir le formulaire:**
   - Nom d'utilisateur: `owner1`
   - Email: `owner@example.com`
   - Prénom: `Jean`
   - Nom: `Dupont`
   - Mot de passe: `votre_mot_de_passe`
   - **Rôle: Owner (Propriétaire)** ← Important!
4. **Cliquer sur "Ajouter"**

**Résultat:**
- Un nouveau tenant est créé automatiquement
- Une licence d'essai de 14 jours est créée automatiquement
- Le propriétaire peut maintenant se connecter

### Option 2: Via la Base de Données

Si vous avez accès à PostgreSQL:

```sql
-- 1. Créer un tenant
INSERT INTO tenants (name, is_active) 
VALUES ('Mon Entreprise', true) 
RETURNING id;

-- Notez l'ID retourné (par exemple: 2)

-- 2. Créer l'utilisateur propriétaire
-- Remplacez 'TENANT_ID' par l'ID du tenant créé
INSERT INTO users (
  tenant_id, username, email, first_name, last_name, 
  password_hash, role
) VALUES (
  2, -- TENANT_ID
  'owner1',
  'owner@example.com',
  'Jean',
  'Dupont',
  '$2b$10$YourHashedPasswordHere', -- Utilisez bcrypt pour hasher
  'owner'
);

-- 3. Créer une licence d'essai
INSERT INTO licenses (
  key, tenant_id, assigned_to, expiry_date, is_active, plan
) VALUES (
  'TRIAL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  2, -- TENANT_ID
  'Jean Dupont',
  NOW() + INTERVAL '14 days',
  true,
  'BUSINESS_PRO'
);
```

---

## 🔧 Dépannage

### Problème: "Utilisateur non trouvé"

**Vérifier que l'utilisateur existe:**
```sql
SELECT id, username, role, tenant_id FROM users;
```

### Problème: "Mot de passe incorrect"

**Réinitialiser le mot de passe du superadmin:**
```bash
node scripts/add-superadmin.cjs
```

Cela mettra à jour le mot de passe à `admin123`.

### Problème: "Backend non disponible"

**Vérifier que le backend est démarré:**
```bash
# Dans un terminal
cd backend
npm run dev
```

**Vérifier la santé du backend:**
```bash
curl http://localhost:5000/api/health
```

### Problème: "Erreur de connexion à la base de données"

**Vérifier les variables d'environnement:**

Fichier: `backend/.env.development`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
PORT=5000
```

**Vérifier que PostgreSQL est démarré:**
```bash
# Windows
services.msc
# Chercher "PostgreSQL" et vérifier qu'il est démarré
```

---

## 📋 Identifiants par Défaut

### SuperAdmin
- **Username:** `superadmin`
- **Password:** `admin123`
- **Rôle:** SuperAdmin
- **Tenant ID:** 0 (système)

### Créer Votre Propre Propriétaire
Utilisez l'interface web après connexion en tant que superadmin.

---

## 🎯 Flux de Connexion Normal

1. **Superadmin se connecte** (`superadmin` / `admin123`)
2. **Superadmin crée un propriétaire** via l'interface
3. **Propriétaire se connecte** avec ses identifiants
4. **Propriétaire gère son entreprise**

---

## 🔑 Réinitialiser un Mot de Passe

### Via Script (Superadmin uniquement)
```bash
node scripts/reset-superadmin-password.cjs
```

### Via Base de Données
```sql
-- Hasher un nouveau mot de passe avec bcrypt
-- Puis mettre à jour:
UPDATE users 
SET password_hash = '$2b$10$YourNewHashedPassword' 
WHERE username = 'votre_username';
```

---

## 📞 Besoin d'Aide?

### Vérifier les Logs Backend
Dans le terminal où le backend tourne, vous verrez:
```
✅ Connexion réussie pour: username
❌ Utilisateur non trouvé
❌ Mot de passe incorrect
```

### Vérifier les Logs Frontend
Dans la console du navigateur (F12):
```
✅ Connexion réussie
❌ Erreur auth: ...
```

---

## ✅ Checklist de Connexion

- [ ] Backend démarré (`npm run dev`)
- [ ] Backend accessible (`curl http://localhost:5000/api/health`)
- [ ] Superadmin créé (`node scripts/add-superadmin.cjs`)
- [ ] Identifiants corrects (`superadmin` / `admin123`)
- [ ] Frontend rafraîchi (F5)
- [ ] Connexion réussie

---

**Une fois connecté, vous pouvez créer des propriétaires, des produits, et utiliser toutes les fonctionnalités de l'application!** 🎉
