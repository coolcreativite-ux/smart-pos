# 🔧 Dépannage Connexion - Guide Rapide

## Erreur: 401 Unauthorized

---

## ✅ Solution en 3 Étapes

### Étape 1: Réparer les Mots de Passe

**Exécutez dans PowerShell:**
```powershell
cd backend
node scripts/fix-user-passwords.cjs
```

**Ce script va:**
- Lister tous les utilisateurs
- Réparer les password_hash invalides
- Définir le mot de passe à `admin123` pour tous

### Étape 2: Noter les Identifiants

Le script affichera quelque chose comme:
```
📋 Identifiants de connexion disponibles:

   Username: superadmin
   Password: admin123
   Role: superadmin

   Username: owner1
   Password: admin123
   Role: owner
```

### Étape 3: Se Connecter

1. **Rafraîchir la page** (F5)
2. **Utiliser un des usernames** affichés
3. **Mot de passe:** `admin123`

---

## 🔍 Vérification Rapide

### Le Backend est-il démarré?
```powershell
curl http://localhost:5000/api/health
```

**Devrait retourner:**
```json
{"status":"healthy","database":"connected"}
```

### Les Utilisateurs existent-ils?
```sql
SELECT username, role FROM users;
```

---

## 📋 Checklist

- [ ] Backend démarré
- [ ] Script fix-user-passwords exécuté
- [ ] Page rafraîchie (F5)
- [ ] Username correct (sensible à la casse!)
- [ ] Password: `admin123`

---

## 💡 Si Ça Ne Marche Toujours Pas

### Créer un Nouveau SuperAdmin
```powershell
cd backend
node scripts/add-superadmin.cjs
```

**Identifiants:**
- Username: `superadmin`
- Password: `admin123`

---

**Exécutez le script de réparation et reconnectez-vous!**
