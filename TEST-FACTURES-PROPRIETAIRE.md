# Guide de Test - Accès Factures Propriétaire

## 🎯 Objectif
Vérifier que le propriétaire peut accéder et utiliser le système de facturation.

## ✅ Prérequis
- Application démarrée (frontend + backend)
- Base de données avec migrations appliquées
- Compte propriétaire créé

## 📋 Tests à Effectuer

### Test 1: Visibilité de l'Onglet
**Étapes:**
1. Se connecter en tant que propriétaire
2. Vérifier la barre de navigation

**Résultat attendu:**
- ✅ L'onglet "Factures" est visible
- ✅ Icône de document présente
- ✅ Positionné entre "Analytics" et "Dettes"

---

### Test 2: Accès à la Page
**Étapes:**
1. Cliquer sur l'onglet "Factures"

**Résultat attendu:**
- ✅ Page "Factures & Reçus" s'affiche
- ✅ Titre visible en haut
- ✅ Boutons "+ Nouvelle Facture" et "+ Nouveau Reçu" présents
- ✅ Section de filtres visible
- ✅ Message "Aucune facture trouvée" si vide

---

### Test 3: Création d'une Facture
**Étapes:**
1. Cliquer sur "+ Nouvelle Facture"
2. Sélectionner le type de facture (B2B, B2C, etc.)
3. Choisir ou créer un client
4. Ajouter au moins un produit
5. Vérifier les calculs (HT, TVA, TTC)
6. Cliquer sur "Générer la Facture"

**Résultat attendu:**
- ✅ Modal de création s'ouvre
- ✅ Tous les champs sont accessibles
- ✅ Calculs automatiques corrects
- ✅ Facture créée avec succès
- ✅ Retour à la liste avec la nouvelle facture

---

### Test 4: Création d'un Reçu
**Étapes:**
1. Cliquer sur "+ Nouveau Reçu"
2. Suivre le même processus qu'une facture

**Résultat attendu:**
- ✅ Modal de création s'ouvre
- ✅ Type "Reçu" sélectionné
- ✅ Reçu créé avec succès

---

### Test 5: Liste des Factures
**Étapes:**
1. Créer 2-3 factures/reçus
2. Vérifier la liste

**Résultat attendu:**
- ✅ Toutes les factures apparaissent
- ✅ Numéro de facture affiché
- ✅ Type (Facture/Reçu) avec badge coloré
- ✅ Nom du client
- ✅ Date
- ✅ Montant TTC
- ✅ Boutons PDF et CSV

---

### Test 6: Filtres
**Étapes:**
1. Entrer un numéro de facture dans le filtre
2. Cliquer sur "Filtrer"
3. Tester avec nom de client
4. Tester avec type de document
5. Cliquer sur "Réinitialiser"

**Résultat attendu:**
- ✅ Filtrage par numéro fonctionne
- ✅ Filtrage par client fonctionne
- ✅ Filtrage par type fonctionne
- ✅ Réinitialisation restaure la liste complète

---

### Test 7: Téléchargement PDF
**Étapes:**
1. Cliquer sur l'icône PDF d'une facture

**Résultat attendu:**
- ✅ Fichier PDF téléchargé
- ✅ Nom du fichier: `facture-[id].pdf`
- ✅ PDF contient toutes les informations
- ✅ Logo de l'entreprise (si configuré)
- ✅ Calculs corrects

---

### Test 8: Téléchargement CSV
**Étapes:**
1. Cliquer sur l'icône CSV d'une facture

**Résultat attendu:**
- ✅ Fichier CSV téléchargé
- ✅ Nom du fichier: `facture-[id].csv`
- ✅ CSV contient les lignes de la facture
- ✅ Format compatible Excel/comptabilité

---

### Test 9: Pagination
**Étapes:**
1. Créer plus de 20 factures (si nécessaire)
2. Vérifier les boutons de pagination

**Résultat attendu:**
- ✅ Pagination apparaît si > 20 factures
- ✅ Bouton "Suivant" fonctionne
- ✅ Bouton "Précédent" fonctionne
- ✅ Numéro de page affiché

---

### Test 10: Responsive Mobile
**Étapes:**
1. Ouvrir sur mobile ou réduire la fenêtre
2. Accéder au menu hamburger
3. Chercher l'onglet "Factures"

**Résultat attendu:**
- ✅ Onglet visible dans le menu mobile
- ✅ Page s'adapte à l'écran mobile
- ✅ Tableau scrollable horizontalement
- ✅ Boutons accessibles

---

## 🔍 Tests de Permissions

### Test 11: Accès Admin
**Étapes:**
1. Se connecter en tant qu'Admin
2. Vérifier l'accès aux factures

**Résultat attendu:**
- ✅ Admin peut voir l'onglet (si viewAnalytics = true)
- ✅ Admin peut créer des factures

### Test 12: Accès Manager
**Étapes:**
1. Se connecter en tant que Manager
2. Vérifier l'accès aux factures

**Résultat attendu:**
- ✅ Manager peut voir l'onglet (si viewAnalytics = true)
- ✅ Manager peut créer des factures

### Test 13: Accès Caissier
**Étapes:**
1. Se connecter en tant que Caissier
2. Vérifier l'accès aux factures

**Résultat attendu:**
- ❌ Caissier ne voit PAS l'onglet (par défaut)
- ❌ Pas d'accès aux factures

---

## 🐛 Tests d'Erreurs

### Test 14: Erreur Réseau
**Étapes:**
1. Arrêter le backend
2. Essayer de charger les factures

**Résultat attendu:**
- ✅ Message d'erreur affiché
- ✅ Pas de crash de l'application
- ✅ Spinner disparaît

### Test 15: Facture Invalide
**Étapes:**
1. Essayer de créer une facture sans client
2. Essayer de créer une facture sans produit

**Résultat attendu:**
- ✅ Validation empêche la création
- ✅ Messages d'erreur clairs
- ✅ Champs requis indiqués

---

## 📊 Checklist Finale

- [ ] Onglet visible pour le propriétaire
- [ ] Page s'affiche correctement
- [ ] Création de facture fonctionne
- [ ] Création de reçu fonctionne
- [ ] Liste affiche toutes les factures
- [ ] Filtres fonctionnent
- [ ] Téléchargement PDF fonctionne
- [ ] Téléchargement CSV fonctionne
- [ ] Pagination fonctionne (si applicable)
- [ ] Responsive mobile OK
- [ ] Permissions correctes par rôle
- [ ] Gestion d'erreurs OK

---

## 🚀 Commandes de Test Rapide

### Démarrer l'application
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Créer un compte propriétaire (si nécessaire)
```bash
cd backend
node scripts/create-superadmin.cjs
```

### Vérifier les logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend console
# Ouvrir DevTools (F12) dans le navigateur
```

---

## ✅ Résultat Attendu Global

Le propriétaire doit pouvoir:
1. ✅ Voir et accéder à l'onglet "Factures"
2. ✅ Créer des factures et reçus
3. ✅ Consulter l'historique complet
4. ✅ Filtrer et rechercher
5. ✅ Télécharger PDF et CSV
6. ✅ Utiliser sur desktop et mobile

**Tous les tests doivent passer pour valider la fonctionnalité.**
