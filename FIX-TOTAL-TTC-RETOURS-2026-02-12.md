# Correction du calcul TOTAL TTC après retours

## Problème identifié

Lorsqu'un retour/échange était effectué, le système mettait à jour les quantités retournées (`returned_quantity`) dans la table `sale_items`, mais **ne recalculait pas les totaux** de la vente dans la table `sales`.

Résultat : Le TOTAL TTC affiché restait le montant original de la vente, même après des retours partiels ou complets.

## Solution implémentée

### 1. Backend - Recalcul automatique des totaux (backend/server.ts)

Modification de la route `PATCH /api/sales/:id` pour :

1. **Mettre à jour les quantités retournées** dans `sale_items`
2. **Recalculer le nouveau subtotal** en fonction des quantités actives (quantité achetée - quantité retournée)
3. **Calculer proportionnellement** les nouveaux montants :
   - Discount (remise promo)
   - Loyalty discount (remise fidélité)
   - Tax (TVA)
   - Total TTC
4. **Mettre à jour la table `sales`** avec les nouveaux totaux
5. **Retourner les totaux mis à jour** au frontend

#### Formule de calcul

```javascript
// Nouveau subtotal = somme des (quantité active × prix unitaire)
newSubtotal = Σ (quantity - returned_quantity) × unit_price

// Ratio de réduction
ratio = newSubtotal / originalSubtotal

// Nouveaux montants proportionnels
newDiscount = originalDiscount × ratio
newLoyaltyDiscount = originalLoyaltyDiscount × ratio
newTax = originalTax × ratio

// Nouveau total
newTotal = newSubtotal - newDiscount - newLoyaltyDiscount + newTax
```

### 2. Frontend - Mise à jour des totaux (frontend/contexts/SalesHistoryContext.tsx)

Modification de la fonction `addReturnToSale` pour :

1. **Recevoir les totaux recalculés** depuis le backend
2. **Mettre à jour le state local** avec les nouveaux totaux
3. **Synchroniser localStorage** avec les données à jour

### 3. Interface - Affichage amélioré (frontend/pages/SalesHistory.tsx)

Amélioration de l'affichage des items retournés :

- **Quantité** : Affiche la quantité originale + badge rouge avec quantité retournée
- **Sous-total** : 
  - Si retours : Affiche montant original barré + montant actif
  - Sinon : Affiche montant normal
- **Récapitulatif** : Affiche automatiquement les totaux mis à jour

#### Exemple visuel

```
Article A    Qté: 5 [-2]    Prix: 1000 FCFA    Sous-total: 5000 FCFA (barré)
                                                            3000 FCFA (actif)
```

## Flux complet

1. **Utilisateur** sélectionne des items à retourner dans ReturnModal
2. **Frontend** envoie `PATCH /api/sales/:id` avec `returned_items` et `return_details`
3. **Backend** :
   - Met à jour `sale_items.returned_quantity`
   - Recalcule tous les totaux
   - Met à jour `sales` (subtotal, discount, loyalty_discount, tax, total)
   - Enregistre dans `return_transactions`
   - Retourne les nouveaux totaux
4. **Frontend** :
   - Reçoit les totaux mis à jour
   - Met à jour le state local
   - Synchronise localStorage
5. **Interface** :
   - Affiche les nouveaux totaux dans l'historique
   - Affiche les badges "Retour partiel" / "Retour complet"
   - Affiche les montants barrés pour les items retournés

## Fichiers modifiés

1. `backend/server.ts` (ligne ~1950) - Route PATCH avec recalcul des totaux
2. `frontend/contexts/SalesHistoryContext.tsx` - Fonction `addReturnToSale` avec mise à jour des totaux
3. `frontend/pages/SalesHistory.tsx` - Affichage amélioré des items avec retours

## Tests recommandés

1. **Retour partiel** :
   - Créer une vente avec 3 items (ex: 2000 + 3000 + 5000 = 10000 FCFA)
   - Retourner 1 item (ex: 3000 FCFA)
   - Vérifier que le total passe à ~7000 FCFA (avec taxes/remises proportionnelles)

2. **Retour complet** :
   - Créer une vente avec 2 items
   - Retourner tous les items
   - Vérifier que le total passe à 0 FCFA

3. **Retour avec remises** :
   - Créer une vente avec remise promo 10%
   - Retourner 50% des items
   - Vérifier que la remise est aussi réduite de 50%

4. **Retour avec points fidélité** :
   - Créer une vente avec remise fidélité
   - Retourner des items
   - Vérifier que la remise fidélité est recalculée proportionnellement

## Notes importantes

- Les totaux sont recalculés **proportionnellement** pour maintenir les mêmes taux de remise et de taxe
- Les **points de fidélité** ne sont pas recalculés (à implémenter si nécessaire)
- Le **cash drawer** n'est pas mis à jour automatiquement pour les remboursements cash (à implémenter)
- Les **installments** ne sont pas affectés par les retours (à vérifier selon les règles métier)

## Prochaines étapes (optionnel)

1. Recalculer les points de fidélité après retour
2. Intégrer les remboursements cash avec le cash drawer
3. Gérer les retours sur ventes à crédit (ajuster les installments)
4. Ajouter un rapport détaillé des retours avec impact financier
