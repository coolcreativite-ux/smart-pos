# 🔴 REDÉMARRAGE FORCÉ REQUIS

## ⚠️ Problème
Les hooks `useCustomer` et `useProduct` ont été ajoutés mais le serveur utilise encore l'ancienne version en cache.

## ✅ Solution - Redémarrage Forcé

### Étape 1: Arrêter le Serveur
Dans le terminal où tourne le frontend:
```
Ctrl + C
```
Appuyez plusieurs fois si nécessaire jusqu'à ce que le serveur s'arrête complètement.

### Étape 2: Nettoyer le Cache
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
```

Ou en CMD:
```cmd
cd frontend
rmdir /s /q node_modules\.vite
```

### Étape 3: Redémarrer
```bash
npm run dev
```

### Étape 4: Hard Refresh du Navigateur
Une fois le serveur redémarré:
```
Ctrl + Shift + R
```
(ou Cmd + Shift + R sur Mac)

---

## 🎯 Résultat Attendu

Après ces étapes:
- ✅ Aucune erreur `useCustomer`
- ✅ Aucune erreur `useProduct`
- ✅ Page se charge correctement
- ✅ Onglet "Factures" accessible

---

## 📋 Checklist

- [ ] Serveur arrêté (Ctrl+C)
- [ ] Cache .vite supprimé
- [ ] Serveur redémarré (npm run dev)
- [ ] Navigateur rafraîchi (Ctrl+Shift+R)
- [ ] Aucune erreur dans la console
- [ ] Page blanche disparue

---

## ⏱️ Temps Estimé
**1 minute** pour le redémarrage complet

---

## 🔍 Vérification

Ouvrez la console du navigateur (F12) et vérifiez:
- ❌ PAS d'erreur "does not provide an export named 'useCustomer'"
- ❌ PAS d'erreur "does not provide an export named 'useProduct'"
- ✅ Application chargée normalement

---

## 📞 Si le Problème Persiste

1. Vérifier que le serveur est bien arrêté
2. Supprimer aussi le dossier `dist`:
   ```bash
   cd frontend
   rm -rf dist
   rm -rf node_modules/.vite
   npm run dev
   ```

3. Vider le cache du navigateur complètement:
   - Chrome: Ctrl+Shift+Delete → Tout effacer
   - Firefox: Ctrl+Shift+Delete → Tout effacer

---

**🚀 Après le redémarrage, le système devrait fonctionner parfaitement !**
