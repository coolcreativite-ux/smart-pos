# Système d'Essai Automatique - 14 Jours BUSINESS PRO

## Vue d'ensemble

Chaque nouveau propriétaire (Owner) créé dans le système reçoit automatiquement un essai gratuit de **14 jours** sur la formule **BUSINESS PRO**.

## Fonctionnement

### 1. Création d'un Propriétaire

Lorsqu'un SuperAdmin crée un nouveau propriétaire :

1. **Création du Tenant** : Un nouveau tenant est créé automatiquement
2. **Création de l'Utilisateur** : Le propriétaire est créé avec le rôle `owner`
3. **Génération de la Licence d'Essai** : Une licence BUSINESS PRO de 14 jours est automatiquement générée
4. **Activation Automatique** : La licence est immédiatement activée pour le tenant du propriétaire

### 2. Format de la Clé d'Essai

```
TRIAL-{timestamp}-{random}
```

Exemple : `TRIAL-1707311743089-A7B3C9D2`

### 3. Caractéristiques de l'Essai

- **Durée** : 14 jours calendaires
- **Plan** : BUSINESS PRO (accès complet)
- **Activation** : Automatique, pas besoin de saisir une clé
- **Fonctionnalités** :
  - Multi-boutiques
  - Gestion avancée des stocks
  - Analyses IA avec Gemini
  - Gestion des clients et fournisseurs
  - Codes promo et programmes de fidélité
  - Toutes les fonctionnalités BUSINESS PRO

### 4. Expérience Utilisateur

#### Pour le Propriétaire

1. **Première Connexion** :
   - Pas d'écran d'activation de licence
   - Accès direct à l'application
   - Badge "Essai Gratuit" visible dans l'interface
   - Compteur de jours restants

2. **Pendant l'Essai** :
   - Accès complet à toutes les fonctionnalités
   - Notifications à J-7, J-3, J-1 avant expiration
   - Possibilité de souscrire à un abonnement à tout moment

3. **Fin de l'Essai** :
   - Notification d'expiration
   - Accès en lecture seule aux données
   - Invitation à souscrire à un abonnement

#### Pour le SuperAdmin

1. **Création du Propriétaire** :
   - Formulaire standard d'ajout de propriétaire
   - Option d'envoi d'email d'invitation
   - Licence d'essai créée automatiquement en arrière-plan

2. **Gestion des Licences** :
   - Visibilité sur toutes les licences d'essai
   - Badge "TRIAL" pour identifier les essais
   - Possibilité de convertir un essai en abonnement payant

## Implémentation Technique

### Backend (server.ts)

```typescript
// Lors de la création d'un propriétaire
if (role.toLowerCase() === 'owner') {
  // 1. Créer le tenant
  const tenantResult = await pool.query(
    'INSERT INTO tenants (name, is_active) VALUES ($1, $2) RETURNING id',
    [tenantName, true]
  );
  
  // 2. Générer la clé d'essai
  const trialKey = `TRIAL-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  // 3. Date d'expiration : 14 jours
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);
  
  // 4. Créer la licence
  await pool.query(
    'INSERT INTO licenses (key, tenant_id, assigned_to, expiry_date, is_active, plan) VALUES ($1, $2, $3, $4, $5, $6)',
    [trialKey, finalTenantId, `${first_name} ${last_name}`, expiryDate, true, 'BUSINESS_PRO']
  );
}
```

### Frontend (UserContext.tsx)

```typescript
// Après création de l'utilisateur
if (dbUser.trial_license) {
  console.log('🎁 Licence d\'essai automatique créée:', dbUser.trial_license.key);
  console.log('📅 Expire le:', new Date(dbUser.trial_license.expiry_date).toLocaleDateString());
}
```

## Base de Données

### Table `licenses`

```sql
CREATE TABLE licenses (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  tenant_id INTEGER REFERENCES tenants(id),
  assigned_to VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  plan VARCHAR(50) DEFAULT 'BUSINESS_PRO'
);
```

### Exemple de Licence d'Essai

```json
{
  "id": 5,
  "key": "TRIAL-1707311743089-A7B3C9D2",
  "tenant_id": 3,
  "assigned_to": "Fournier Kobenan",
  "created_at": "2026-02-07T13:15:43.089Z",
  "expiry_date": "2026-02-21T13:15:43.089Z",
  "is_active": true,
  "plan": "BUSINESS_PRO"
}
```

## Conversion en Abonnement Payant

### Processus

1. **Avant Expiration** :
   - Le propriétaire peut souscrire à un abonnement
   - Le SuperAdmin génère une nouvelle licence payante
   - L'ancienne licence d'essai est automatiquement désactivée

2. **Après Expiration** :
   - Le propriétaire ne peut plus accéder à l'application
   - Le SuperAdmin peut générer une licence payante
   - L'accès est immédiatement restauré

### Interface SuperAdmin

Dans l'onglet "Gestion des Licences" :

```typescript
// Générer une licence payante pour un propriétaire
<select>
  <option value="1">1 mois</option>
  <option value="3">3 mois</option>
  <option value="6">6 mois</option>
  <option value="12">1 an</option>
  <option value="24">2 ans</option>
  <option value="1200">À vie</option>
</select>

<select>
  <option value="STARTER">Starter</option>
  <option value="BUSINESS_PRO">Business Pro</option>
  <option value="ENTERPRISE">Enterprise</option>
</select>
```

## Notifications et Alertes

### Notifications Automatiques

1. **J-7** : "Votre essai expire dans 7 jours"
2. **J-3** : "Plus que 3 jours d'essai gratuit"
3. **J-1** : "Dernier jour d'essai - Souscrivez maintenant"
4. **J-0** : "Votre essai a expiré - Contactez-nous pour continuer"

### Email de Bienvenue

L'email d'invitation mentionne automatiquement l'essai gratuit :

```
Objet : Bienvenue sur Smart POS - Vos 14 jours d'essai BUSINESS PRO sont activés !

Bonjour [Prénom] [Nom],

Félicitations ! Votre compte Smart POS a été créé avec succès.

Votre essai gratuit de 14 jours sur notre offre BUSINESS PRO est maintenant actif. 
Profitez de toutes les fonctionnalités avancées !

Identifiants de connexion :
- Username : [username]
- Mot de passe temporaire : [password]

Cordialement,
L'équipe Smart POS
```

## Avantages du Système

### Pour les Propriétaires

✅ **Pas de friction** : Accès immédiat sans saisir de clé
✅ **Découverte complète** : 14 jours pour tester toutes les fonctionnalités
✅ **Conversion facile** : Souscription en un clic depuis l'interface
✅ **Transparence** : Compteur de jours restants toujours visible

### Pour le SuperAdmin

✅ **Automatisation** : Pas besoin de générer manuellement les licences d'essai
✅ **Suivi** : Visibilité sur tous les essais en cours
✅ **Conversion** : Génération facile de licences payantes
✅ **Reporting** : Statistiques sur les conversions d'essai

### Pour l'Entreprise

✅ **Acquisition** : Barrière d'entrée minimale
✅ **Conversion** : Taux de conversion plus élevé
✅ **Satisfaction** : Meilleure expérience utilisateur
✅ **Scalabilité** : Système entièrement automatisé

## Monitoring et Analytics

### Métriques à Suivre

1. **Taux d'activation** : % de propriétaires qui se connectent
2. **Taux d'utilisation** : % de propriétaires actifs pendant l'essai
3. **Taux de conversion** : % d'essais convertis en abonnements
4. **Durée moyenne d'utilisation** : Nombre de jours d'utilisation pendant l'essai
5. **Fonctionnalités populaires** : Quelles fonctionnalités sont les plus utilisées

### Requêtes SQL Utiles

```sql
-- Licences d'essai actives
SELECT * FROM licenses 
WHERE key LIKE 'TRIAL-%' 
AND is_active = true 
AND expiry_date > NOW();

-- Licences d'essai expirées
SELECT * FROM licenses 
WHERE key LIKE 'TRIAL-%' 
AND expiry_date < NOW();

-- Taux de conversion
SELECT 
  COUNT(CASE WHEN key LIKE 'TRIAL-%' THEN 1 END) as trials,
  COUNT(CASE WHEN key NOT LIKE 'TRIAL-%' THEN 1 END) as paid,
  ROUND(COUNT(CASE WHEN key NOT LIKE 'TRIAL-%' THEN 1 END)::numeric / 
        COUNT(CASE WHEN key LIKE 'TRIAL-%' THEN 1 END) * 100, 2) as conversion_rate
FROM licenses;
```

## Prochaines Étapes

### Améliorations Futures

1. **Prolongation d'essai** : Permettre au SuperAdmin de prolonger un essai
2. **Essais personnalisés** : Durées variables selon le profil
3. **Essais limités** : Restrictions sur certaines fonctionnalités
4. **Auto-renouvellement** : Conversion automatique en abonnement payant
5. **Codes promo** : Réductions pour les conversions rapides

### Intégrations

1. **Stripe/PayPal** : Paiement en ligne automatique
2. **Email Marketing** : Campagnes de nurturing pendant l'essai
3. **Analytics** : Suivi détaillé du comportement utilisateur
4. **CRM** : Synchronisation avec le CRM de l'entreprise

## Support et Documentation

### Pour les Utilisateurs

- Guide de démarrage rapide
- Tutoriels vidéo
- FAQ sur l'essai gratuit
- Chat support en direct

### Pour les Développeurs

- API de gestion des licences
- Webhooks pour les événements de licence
- Documentation technique complète
- Exemples de code

## Conclusion

Le système d'essai automatique de 14 jours BUSINESS PRO offre une expérience fluide et sans friction pour les nouveaux propriétaires, tout en automatisant complètement le processus pour le SuperAdmin. C'est un outil puissant pour l'acquisition et la conversion de clients.
