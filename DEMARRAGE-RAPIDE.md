# 🚀 Démarrage Rapide - Système de Facturation

## Étape 1: Démarrer l'Application

Ouvrez PowerShell dans le dossier du projet et exécutez:

```powershell
.\start-app.ps1
```

**OU** démarrez manuellement:

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Étape 2: Accéder à l'Application

1. Ouvrez votre navigateur: **http://localhost:3000**
2. Connectez-vous avec un compte **Owner** ou **Admin**
3. Cliquez sur l'onglet **"Factures"**

## Étape 3: Créer Votre Première Facture

1. Cliquez sur **"+ Nouvelle Facture"**
2. Sélectionnez **B2C** (Particulier)
3. Remplissez:
   - Nom du client
   - Téléphone
   - Email
4. Cliquez sur **"Ajouter un article"**
5. Sélectionnez un produit
6. Cliquez sur **"Générer la facture"**

## ✅ C'est Tout!

Votre facture est créée avec:
- ✅ Numéro automatique (2026-00001)
- ✅ Calcul TVA 18%
- ✅ PDF généré
- ✅ CSV exporté

## 🔧 En Cas de Problème

### Backend ne démarre pas?
```powershell
cd backend
npm install
npm run dev
```

### Frontend ne démarre pas?
```powershell
cd frontend
npm install
npm run dev
```

### Erreur 500?
Vérifiez les logs du terminal backend - l'erreur exacte sera affichée.

### Vérifier la base de données?
```powershell
node check-db-tables.cjs
```

## 📚 Documentation Complète

- **Guide complet:** `GUIDE-DEMARRAGE-FACTURES.md`
- **Statut système:** `STATUT-SYSTEME-FACTURES.md`

---

**Besoin d'aide?** Consultez les guides ou vérifiez les logs du backend!
