# 🚀 Connexion Rapide - 3 Étapes

---

## Étape 1: Créer le SuperAdmin

**Dans PowerShell, à la racine du projet:**

```powershell
.\create-superadmin.ps1
```

**OU manuellement:**

```powershell
cd backend
node scripts/add-superadmin.cjs
```

**Vous verrez:**
```
🔐 Ajout du SuperAdmin...
✅ SuperAdmin créé avec succès!

🔑 Identifiants SuperAdmin:
   Username: superadmin
   Password: admin123
```

---

## Étape 2: Démarrer le Backend (si pas déjà fait)

```powershell
cd backend
npm run dev
```

**Attendez:**
```
✅ Connexion à PostgreSQL réussie
🚀 Serveur démarré sur le port 5000
```

---

## Étape 3: Se Connecter

**Dans le navigateur (http://localhost:3000):**

- **Username:** `superadmin`
- **Password:** `admin123`

**Cliquez sur "Se connecter"**

---

## ✅ Vous êtes connecté!

Vous pouvez maintenant:
- Créer des propriétaires
- Ajouter des produits
- Gérer l'application

---

## 🔧 Problème?

### Backend ne démarre pas?
```powershell
# Vérifier PostgreSQL
# Vérifier backend/.env.development
```

### Mot de passe incorrect?
```powershell
# Réexécuter le script
.\create-superadmin.ps1
```

### Autre problème?
Consultez **GUIDE-CONNEXION-RAPIDE.md** pour plus de détails.

---

**C'est tout! Vous êtes prêt à utiliser l'application.** 🎉
