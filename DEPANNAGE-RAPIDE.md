# 🔧 Dépannage Rapide - Erreur d'Import

## ❌ Erreur Affichée
```
The requested module '/pages/InvoicesPage.tsx' does not provide an export named 'default'
```

## ✅ Solution en 1 Commande

### Windows PowerShell
```powershell
.\fix-cache-frontend.ps1
```

### Windows CMD
```cmd
fix-cache-frontend.bat
```

### Manuellement
```bash
cd frontend
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

---

## 🎯 Étapes Détaillées

### 1. Arrêter le Serveur
Appuyez sur `Ctrl+C` dans le terminal où tourne le frontend

### 2. Nettoyer le Cache
```bash
cd frontend
rm -rf node_modules/.vite
```

### 3. Redémarrer
```bash
npm run dev
```

### 4. Rafraîchir le Navigateur
Appuyez sur `Ctrl+Shift+R` (ou `Cmd+Shift+R` sur Mac)

---

## 🔍 Vérifications

### Le fichier existe-t-il ?
```bash
dir frontend\pages\InvoicesPage.tsx
```
✅ Devrait afficher le fichier

### L'export est-il correct ?
```bash
findstr "export default" frontend\pages\InvoicesPage.tsx
```
✅ Devrait afficher: `export default function InvoicesPage() {`

### L'import est-il correct ?
```bash
findstr "import InvoicesPage" frontend\pages\DashboardPage.tsx
```
✅ Devrait afficher: `import InvoicesPage from './InvoicesPage';`

---

## 🚀 Après le Fix

Vous devriez voir:
- ✅ Serveur démarré sans erreur
- ✅ Aucune erreur dans la console du navigateur
- ✅ L'onglet "Factures" visible
- ✅ La page accessible

---

## 📞 Si le Problème Persiste

1. Vérifiez que vous êtes dans le bon dossier
2. Vérifiez que Node.js est installé: `node --version`
3. Vérifiez que npm fonctionne: `npm --version`
4. Réinstallez les dépendances: `npm install`
5. Consultez les logs du serveur

---

**Temps de résolution: ~1 minute**
