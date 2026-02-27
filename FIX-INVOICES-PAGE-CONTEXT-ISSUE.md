# Fix InvoicesPage Context Issue - 2026-02-14

## Problème Identifié

`InvoicesPage` reçoit `user` comme `undefined` alors qu'il devrait recevoir l'utilisateur depuis `DashboardPage`.

## Cause Racine

Le fichier `DashboardPage.tsx` a été modifié pour passer `user` en props à `InvoicesPage`, mais les modifications ne sont pas prises en compte par le serveur de développement Vite.

## Solution Immédiate

### Étape 1 : Redémarrer le serveur frontend

```bash
# Arrêter le serveur actuel (Ctrl+C dans le terminal)
# Puis relancer :
cd frontend
npm run dev
```

### Étape 2 : Vider le cache du navigateur

1. Ouvrir DevTools (F12)
2. Clic droit sur le bouton de rechargement
3. Sélectionner "Vider le cache et effectuer une actualisation forcée"

### Étape 3 : Vérifier les logs

Après redémarrage, vous devriez voir dans la console :
- `🔍 [DashboardPage] User:` avec les informations de l'utilisateur
- `🔍 [DashboardPage] User role:` avec le rôle
- `🔍 [DashboardPage] Rendu InvoicesPage avec user:` avec l'utilisateur
- `🔍 InvoicesPage rendu avec user:` avec l'utilisateur (pas undefined)

## Modifications Appliquées

### 1. `pages/DashboardPage.tsx`

```typescript
const DashboardPage: React.FC = () => {
    const { user, isActivated } = useAuth();
    console.log('🔍 [DashboardPage] User:', user);
    console.log('🔍 [DashboardPage] User role:', user?.role);
    // ...
    
    // Dans le rendu :
    {view === 'invoices' && (isOwner || user?.role === UserRole.Admin) && (() => {
        console.log('🔍 [DashboardPage] Rendu InvoicesPage avec user:', user);
        return <InvoicesPage user={user} />;
    })()}
```

### 2. `pages/InvoicesPage.tsx`

```typescript
interface InvoicesPageProps {
  user: any;
}

export default function InvoicesPage({ user }: InvoicesPageProps) {
  console.log('🔍 InvoicesPage rendu avec user:', user);
  console.log('🔍 User role:', user?.role);
  console.log('🔍 User complet:', JSON.stringify(user, null, 2));
  
  // Temporairement forcé à true pour déboguer
  const canAccessInvoices = true;
  
  // ... reste du code
}
```

## Prochaines Étapes (Une fois le problème résolu)

1. **Restaurer la vérification des permissions** : Remplacer `canAccessInvoices = true` par la vraie logique
2. **Réintégrer les composants d'invoice** : Ajouter progressivement InvoiceGenerator, InvoiceHistory, etc.
3. **Tester la fonctionnalité complète** : Créer des factures, voir l'historique, télécharger les PDF

## Code de Vérification des Permissions (À restaurer)

```typescript
const canAccessInvoices = user && (
  user.role === UserRole.SuperAdmin || 
  user.role === UserRole.Owner || 
  user.role === UserRole.Admin ||
  user.role === 'superadmin' ||
  user.role === 'owner' ||
  user.role === 'admin'
);
```

## Notes Importantes

- Le problème vient du fait que `InvoicesPage` essayait d'utiliser `useAuth()` directement, mais le contexte n'était pas accessible
- La solution est de passer `user` en props depuis `DashboardPage` où `useAuth()` fonctionne correctement
- Cette approche contourne le problème de contexte et permet à `InvoicesPage` de fonctionner

## Fichiers Modifiés

- `pages/DashboardPage.tsx` - Ajout de logs et passage de user en props
- `pages/InvoicesPage.tsx` - Modification pour recevoir user en props au lieu d'utiliser useAuth
