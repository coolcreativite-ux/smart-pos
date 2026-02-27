# ✅ Hook useCustomer Ajouté

## Problème Résolu

L'erreur `does not provide an export named 'useCustomer'` a été corrigée.

## Solution

Ajout du hook `useCustomer` dans `frontend/contexts/CustomerContext.tsx`:

```typescript
export function useCustomer() {
  const context = React.useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
```

## Prochaine Étape

Le serveur devrait automatiquement recharger. Si ce n'est pas le cas:

1. **Rafraîchir le navigateur:** `Ctrl + Shift + R`
2. **Vérifier la console** pour d'autres erreurs éventuelles

## Résultat Attendu

- ✅ Aucune erreur d'import pour `useCustomer`
- ✅ Le composant `CustomerSelector` se charge correctement
- ✅ L'onglet "Factures" est accessible

---

**Le système de facturation devrait maintenant fonctionner ! 🚀**
