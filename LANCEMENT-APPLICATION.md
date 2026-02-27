# 🚀 Lancement de l'Application

## Option 1: Script Automatique (Recommandé)

### Windows PowerShell
```powershell
.\start-app.ps1
```

### Windows CMD
```cmd
start-app.bat
```

**Résultat:**
- ✅ Backend démarre sur http://localhost:5000
- ✅ Frontend démarre sur http://localhost:3000
- ✅ Deux fenêtres s'ouvrent automatiquement

---

## Option 2: Lancement Manuel

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

**Attendez de voir:**
```
✓ Serveur démarré sur http://localhost:5000
✓ Base de données connectée
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

**Attendez de voir:**
```
VITE ready in XXX ms
➜ Local: http://localhost:3000
```

---

## 📋 Vérification

### 1. Backend (http://localhost:5000)
- [ ] Serveur démarré
- [ ] Aucune erreur dans le terminal
- [ ] Message "Serveur démarré" visible

### 2. Frontend (http://localhost:3000)
- [ ] Serveur Vite démarré
- [ ] URL affichée dans le terminal
- [ ] Aucune erreur de compilation

### 3. Navigateur
- [ ] Ouvrir http://localhost:3000
- [ ] Page de connexion s'affiche
- [ ] Aucune erreur dans la console (F12)

---

## 🔐 Connexion

### Compte Propriétaire
```
Email: owner@example.com
Mot de passe: [votre mot de passe]
```

### Compte SuperAdmin (si configuré)
```
Email: superadmin@example.com
Mot de passe: [votre mot de passe]
```

---

## 🎯 Test du Système de Facturation

Après connexion:

1. **Vérifier l'onglet "Factures"**
   - [ ] Visible dans la navigation
   - [ ] Entre "Analytics" et "Dettes"

2. **Cliquer sur "Factures"**
   - [ ] Page se charge
   - [ ] Boutons "+ Nouvelle Facture" et "+ Nouveau Reçu" visibles

3. **Créer une facture de test**
   - [ ] Cliquer sur "+ Nouvelle Facture"
   - [ ] Modal s'ouvre
   - [ ] Formulaire complet visible

---

## ⏹️ Arrêt de l'Application

### Si lancé avec script
- Fermer les fenêtres PowerShell/CMD ouvertes

### Si lancé manuellement
- Appuyer sur `Ctrl + C` dans chaque terminal

---

## 🐛 Dépannage

### Backend ne démarre pas
```bash
cd backend
npm install
npm run dev
```

### Frontend ne démarre pas
```bash
cd frontend
npm install
npm run dev
```

### Port déjà utilisé
```bash
# Trouver et arrêter le processus
netstat -ano | findstr :3000
netstat -ano | findstr :5000
taskkill /PID [PID] /F
```

### Erreurs de cache
```bash
cd frontend
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

---

## 📊 Ports Utilisés

| Service | Port | URL |
|---------|------|-----|
| Backend | 5000 | http://localhost:5000 |
| Frontend | 3000 | http://localhost:3000 |
| Base de données | 5432 | localhost:5432 |

---

## 🎉 Succès !

Si vous voyez:
- ✅ Backend: "Serveur démarré sur http://localhost:5000"
- ✅ Frontend: "Local: http://localhost:3000"
- ✅ Page de connexion dans le navigateur

**L'application est prête à l'emploi ! 🚀**

---

**Prochaine étape:** Consultez `VERIFICATION-FINALE.md` pour valider le système de facturation.
