# Permissions - Gestion des Factures

**Date**: 2026-02-12  
**Statut**: ✅ Implémenté

## Règles d'accès

### Qui peut accéder aux factures ?

Seuls les utilisateurs avec les rôles suivants peuvent créer et gérer les factures :

1. ✅ **SuperAdmin** - Accès complet à toutes les factures de tous les tenants
2. ✅ **Owner** - Accès complet aux factures de son tenant
3. ✅ **Admin** - Accès complet aux factures de son tenant
4. ❌ **Cashier** - Accès refusé (message d'erreur affiché)

### Pourquoi cette restriction ?

Les factures sont des **documents comptables officiels** qui :
- Ont une valeur légale
- Doivent respecter les normes fiscales
- Engagent la responsabilité de l'entreprise
- Nécessitent une numérotation séquentielle stricte
- Peuvent être auditées par les autorités fiscales

Il est donc logique que seuls les responsables (Owner/Admin) puissent les créer et les gérer.

## Implémentation

### Frontend - InvoicesPage.tsx

```typescript
// Vérification des permissions
const canAccessInvoices = user && (
  user.role === UserRole.SuperAdmin || 
  user.role === UserRole.Owner || 
  user.role === UserRole.Admin
);

// Affichage d'un message d'accès refusé pour les cashiers
if (!canAccessInvoices) {
  return (
    <div className="text-center">
      <h2>Accès Restreint</h2>
      <p>Seuls les propriétaires et administrateurs peuvent accéder à la gestion des factures.</p>
    </div>
  );
}
```

### Frontend - DashboardPage.tsx

```typescript
// Permission pour afficher le menu "Factures"
const canManageInvoices = isOwner || isAdmin;

// Le menu "Factures" n'apparaît que si canManageInvoices = true
```

## Interface utilisateur

### Pour les Cashiers
- Le menu "Factures" n'apparaît pas dans la navigation
- Si accès direct via URL : Message d'erreur avec icône de cadenas
- Message clair : "Seuls les propriétaires et administrateurs peuvent accéder à la gestion des factures"

### Pour les Owner/Admin
- Menu "Factures" visible dans la navigation
- Accès complet à toutes les fonctionnalités :
  - Créer des factures
  - Créer des proformas
  - Créer des reçus
  - Consulter l'historique
  - Exporter en PDF
  - Envoyer par email

## Fichiers modifiés

1. `frontend/pages/InvoicesPage.tsx` - Ajout du contrôle d'accès avec message d'erreur
2. `frontend/pages/DashboardPage.tsx` - Modification de `canManageInvoices` pour restreindre aux Owner/Admin

## Recommandations

### Sécurité supplémentaire (optionnel)

Pour une sécurité renforcée, vous pouvez également :

1. **Backend** - Ajouter une vérification côté serveur :
```typescript
// Dans les routes API de factures
if (user.role !== 'owner' && user.role !== 'admin' && user.role !== 'superadmin') {
  return res.status(403).json({ error: 'Accès refusé' });
}
```

2. **Audit** - Logger toutes les actions sur les factures :
```typescript
await logAction(
  user.id,
  user.username,
  'Invoice Created',
  `Facture #${invoiceNumber} créée pour ${customerName}`,
  user.tenantId
);
```

3. **Validation** - Empêcher la modification des factures déjà émises
4. **Archivage** - Conserver un historique immuable des factures

## Tests

### Test 1 : Cashier tente d'accéder aux factures
1. Se connecter en tant que cashier (marie)
2. Le menu "Factures" ne doit pas apparaître
3. Tenter d'accéder via URL directe : `/dashboard?view=invoices`
4. Résultat attendu : Message "Accès Restreint" avec icône de cadenas

### Test 2 : Owner accède aux factures
1. Se connecter en tant que owner (fournier)
2. Le menu "Factures" doit apparaître
3. Cliquer sur "Factures"
4. Résultat attendu : Page de gestion des factures s'affiche

### Test 3 : Admin accède aux factures
1. Se connecter en tant qu'admin
2. Le menu "Factures" doit apparaître
3. Accès complet aux fonctionnalités
4. Résultat attendu : Peut créer et gérer les factures

## Notes importantes

- Les cashiers peuvent toujours créer des **reçus de vente** via le terminal de point de vente
- Les **factures** sont différentes des reçus : elles sont plus formelles et ont une valeur légale
- Cette restriction ne s'applique qu'aux factures, pas aux autres fonctionnalités du système
- Les SuperAdmin peuvent accéder aux factures de tous les tenants pour support/audit

## Conformité légale

En Côte d'Ivoire, les factures doivent :
- Avoir une numérotation séquentielle sans rupture
- Contenir les informations légales obligatoires (NCC, adresse, etc.)
- Être conservées pendant au moins 10 ans
- Être présentées en cas de contrôle fiscal

C'est pourquoi il est crucial de limiter l'accès aux personnes responsables.
