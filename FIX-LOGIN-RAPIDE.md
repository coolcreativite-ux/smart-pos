# 🚀 Correction Rapide - Problème de Connexion

---

## ❌ Problème
"Utilisateur invalide" alors que des users existent dans la DB

---

## ✅ Solution en 2 Étapes

### Étape 1: Réparer les Mots de Passe

```powershell
.\fix-passwords.ps1
```

**Résultat:**
- Tous les utilisateurs auront le mot de passe: `admin123`
- Le script affiche les usernames disponibles

### Étape 2: Se Connecter

- **Username:** (celui affiché par le script)
- **Password:** `admin123`

---

## 📋 Ce que fait le script

1. ✅ Liste tous les utilisateurs
2. ✅ Vérifie les password_hash
3. ✅ Répare les mots de passe invalides
4. ✅ Affiche les identifiants de connexion

---

## 🔧 Alternative Manuelle

```powershell
cd backend
node scripts/fix-user-passwords.cjs
```

---

## ✅ Après Réparation

Tous les utilisateurs réparés peuvent se connecter avec:
- **Password:** `admin123`

Vous pourrez changer le mot de passe après connexion.

---

**Exécutez le script et reconnectez-vous!** 🎉
