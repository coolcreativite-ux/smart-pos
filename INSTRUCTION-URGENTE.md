# 🔴 INSTRUCTION URGENTE

## ⚠️ Situation Actuelle
Page blanche + Erreurs d'import des hooks `useCustomer` et `useProduct`

## ✅ Les Hooks Ont Été Ajoutés
- ✅ `useCustomer` ajouté dans CustomerContext.tsx
- ✅ `useProduct` ajouté dans ProductContext.tsx

## 🔴 MAIS le serveur utilise encore l'ancienne version en cache

---

## 🚀 SOLUTION EN 1 COMMANDE

### Option A - PowerShell (Recommandé)
```powershell
.\redemarrage-complet.ps1
```

### Option B - CMD
```cmd
redemarrage-complet.bat
```

### Option C - Manuel
```bash
# 1. Arrêter le serveur (Ctrl+C dans le terminal)
# 2. Puis:
cd frontend
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

---

## 📋 Après le Redémarrage

1. **Attendre** que le serveur affiche "ready" ou "Local: http://localhost:3000"
2. **Rafraîchir** le navigateur: `Ctrl + Shift + R`
3. **Vérifier** qu'il n'y a plus d'erreurs dans la console

---

## ✅ Résultat Attendu

- ✅ Aucune erreur `useCustomer`
- ✅ Aucune erreur `useProduct`  
- ✅ Page se charge normalement
- ✅ Onglet "Factures" visible et accessible

---

## ⏱️ Temps Total
**1-2 minutes** (nettoyage + redémarrage + refresh)

---

## 🎯 C'est la Dernière Étape !

Une fois le serveur redémarré et le navigateur rafraîchi, le système de facturation sera pleinement opérationnel.

---

**🚀 Exécutez le script maintenant !**
