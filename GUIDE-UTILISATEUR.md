# 📘 Guide d'Utilisation SmartPOS

## Bienvenue sur SmartPOS

SmartPOS est un système de point de vente moderne et complet qui vous permet de gérer efficacement vos ventes, votre inventaire, vos clients et vos magasins. Ce guide vous accompagnera dans l'utilisation quotidienne de l'application.

---

## 🔐 Connexion et Activation

### Première Connexion

1. **Accédez à l'application** via votre navigateur web
2. **Entrez vos identifiants** :
   - Nom d'utilisateur
   - Mot de passe
3. **Cliquez sur "Se connecter"**

### Activation de la Licence

Si vous êtes propriétaire (Owner), vous devrez activer votre licence :

1. Allez dans **"Licence"** depuis le menu principal
2. Entrez votre **clé de licence** fournie par l'administrateur
3. Cliquez sur **"Activer"**
4. Votre période d'essai ou votre abonnement sera activé

> **Note** : Une période d'essai gratuite est automatiquement disponible pour tester l'application.

---

## 🎯 Rôles et Permissions

SmartPOS utilise un système de rôles pour contrôler l'accès aux fonctionnalités :

### 👑 Super Admin
- Accès complet à toutes les fonctionnalités
- Gestion des licences et des tenants
- Administration système

### 🏢 Propriétaire (Owner)
- Gestion complète de son entreprise
- Création et gestion des utilisateurs
- Gestion des magasins
- Accès aux analytics et paramètres
- Gestion de la licence

### 👨‍💼 Administrateur (Admin)
- Gestion des produits et de l'inventaire
- Gestion des clients
- Accès aux analytics
- Gestion des paramètres

### 📊 Manager
- Ventes au point de vente
- Gestion de l'inventaire
- Consultation de l'historique
- Gestion des clients

### 💰 Caissier (Cashier)
- Ventes au point de vente uniquement
- Consultation limitée de l'historique

---

## 🛒 Terminal de Vente (POS)

Le terminal de vente est l'interface principale pour effectuer des transactions.

### Effectuer une Vente

1. **Sélectionner les produits** :
   - Parcourez les catégories ou utilisez la barre de recherche
   - Cliquez sur un produit pour l'ajouter au panier
   - Si le produit a des variantes (taille, couleur), sélectionnez celle souhaitée

2. **Gérer le panier** :
   - Ajustez les quantités avec les boutons **+** et **-**
   - Supprimez un article avec l'icône **poubelle**
   - Le total se calcule automatiquement

3. **Appliquer des réductions** :
   - **Code promo** : Entrez le code dans le champ prévu
   - **Points de fidélité** : Si un client est sélectionné, utilisez ses points

4. **Sélectionner un client** (optionnel) :
   - Cliquez sur **"Sélectionner un client"**
   - Recherchez le client par nom, email ou téléphone
   - Sélectionnez-le pour appliquer les points de fidélité

5. **Finaliser la vente** :
   - Cliquez sur **"Payer"**
   - Choisissez le mode de paiement :
     - **Espèces** : Paiement comptant
     - **Carte** : Paiement par carte bancaire
     - **Crédit** : Vente à crédit (nécessite un client)
   - Confirmez la transaction

6. **Impression du ticket** :
   - Le ticket s'imprime automatiquement si configuré
   - Sinon, utilisez le bouton **"Imprimer"**

### Fonctionnalités Avancées du POS

#### 📦 Suspendre une Commande
- Cliquez sur **"Suspendre"** pour mettre la commande en attente
- Donnez un nom à la commande (ex: "Table 5", "Client Martin")
- Récupérez-la plus tard via **"Commandes suspendues"**

#### 🔍 Scanner de Code-Barres
- Cliquez sur l'icône **scanner**
- Autorisez l'accès à la caméra
- Scannez le code-barres du produit
- Le produit s'ajoute automatiquement au panier

#### 💵 Gestion de la Caisse
- **Ouvrir la caisse** : Entrez le montant initial en début de journée
- **Entrée/Sortie d'argent** : Enregistrez les mouvements de caisse
- **Fermer la caisse** : En fin de journée, comptez et enregistrez le montant final

---

## 📊 Analytics et Tableaux de Bord

Visualisez les performances de votre entreprise en temps réel.

### Indicateurs Clés (KPI)

- **Ventes du jour** : Chiffre d'affaires quotidien
- **Nombre de transactions** : Nombre de ventes effectuées
- **Panier moyen** : Montant moyen par transaction
- **Produits vendus** : Quantité totale d'articles vendus

### Graphiques Disponibles

1. **Ventes par jour** : Évolution du chiffre d'affaires
2. **Ventes par catégorie** : Répartition des ventes par type de produit
3. **Top produits** : Produits les plus vendus
4. **Méthodes de paiement** : Répartition espèces/carte/crédit

### Filtres

- **Période** : Aujourd'hui, 7 jours, 30 jours, personnalisée
- **Magasin** : Filtrer par magasin spécifique (si multi-magasins)

---

## 📦 Gestion des Produits

### Ajouter un Produit

1. Allez dans **"Produits"**
2. Cliquez sur **"Ajouter un produit"**
3. Remplissez les informations :
   - **Nom** : Nom du produit
   - **Catégorie** : Sélectionnez ou créez une catégorie
   - **Description** : Description détaillée (optionnel)
   - **Image** : Téléchargez une photo du produit

4. **Configurer les variantes** :
   - Ajoutez des attributs (Taille, Couleur, etc.)
   - Définissez les valeurs pour chaque attribut
   - Le système génère automatiquement toutes les combinaisons

5. **Prix et stock** :
   - **Prix de vente** : Prix TTC
   - **Prix de revient** : Coût d'achat (pour calcul de marge)
   - **Stock initial** : Quantité disponible
   - **SKU** : Référence interne (optionnel)
   - **Code-barres** : Pour le scanner (optionnel)

6. **Alertes de stock** :
   - **Seuil de stock bas** : Quantité minimale avant alerte
   - **Alerte email** : Recevoir un email quand le stock est bas

7. Cliquez sur **"Enregistrer"**

### Modifier un Produit

1. Trouvez le produit dans la liste
2. Cliquez sur l'icône **crayon** (éditer)
3. Modifiez les informations souhaitées
4. Cliquez sur **"Enregistrer"**

### Supprimer un Produit

1. Cliquez sur l'icône **poubelle**
2. Confirmez la suppression

> **Attention** : La suppression est définitive et supprime l'historique associé.

### Gérer les Catégories

1. Cliquez sur **"Gérer les catégories"**
2. **Ajouter** : Entrez le nom et cliquez sur "+"
3. **Supprimer** : Cliquez sur l'icône poubelle

---

## 📋 Gestion de l'Inventaire

L'inventaire vous permet de suivre et gérer le stock de tous vos produits.

### Vue d'Ensemble

- **Stock actuel** : Quantité disponible
- **Stock initial** : Quantité de départ
- **Vendu** : Quantité vendue
- **Valeur du stock** : Valeur totale au prix de vente
- **Coût du stock** : Valeur totale au prix d'achat
- **Marge potentielle** : Bénéfice si tout est vendu

### Réapprovisionner un Produit

1. Trouvez le produit dans la liste d'inventaire
2. Cliquez sur **"Réapprovisionner"**
3. Entrez la **quantité à ajouter**
4. Sélectionnez le **magasin** (si multi-magasins)
5. Ajoutez des **notes** (optionnel)
6. Cliquez sur **"Confirmer"**

### Ajuster le Stock

Pour corriger des erreurs ou enregistrer des pertes :

1. Cliquez sur **"Ajuster"**
2. Entrez la **nouvelle quantité** (pas la différence)
3. Sélectionnez la **raison** :
   - Correction : Erreur d'inventaire
   - Dommage : Produit endommagé
   - Perte : Produit perdu ou volé
4. Ajoutez des **notes explicatives**
5. Cliquez sur **"Confirmer"**

### Transférer du Stock

Pour déplacer du stock entre magasins :

1. Cliquez sur **"Transférer"**
2. Sélectionnez le **magasin source**
3. Sélectionnez le **magasin destination**
4. Entrez la **quantité à transférer**
5. Ajoutez des **notes** (optionnel)
6. Cliquez sur **"Confirmer"**

### Historique des Mouvements

1. Cliquez sur **"Historique"** pour un produit
2. Consultez tous les mouvements :
   - Date et heure
   - Type de mouvement (vente, réapprovisionnement, etc.)
   - Quantité
   - Utilisateur responsable
   - Notes

### Exporter l'Inventaire

1. Cliquez sur **"Exporter CSV"**
2. Le fichier se télécharge automatiquement
3. Ouvrez-le avec Excel ou Google Sheets

---

## 👥 Gestion des Clients

### Ajouter un Client

1. Allez dans **"Clients"**
2. Cliquez sur **"Ajouter un client"**
3. Remplissez les informations :
   - **Prénom** et **Nom** (obligatoires)
   - **Email** : Pour les communications
   - **Téléphone** : Pour les contacts
   - **Magasin** : Magasin principal du client
4. Cliquez sur **"Enregistrer"**

### Modifier un Client

1. Trouvez le client dans la liste
2. Cliquez sur l'icône **crayon**
3. Modifiez les informations
4. Cliquez sur **"Enregistrer"**

### Programme de Fidélité

Si activé dans les paramètres :

- **Points gagnés** : Automatiquement lors des achats
- **Utiliser les points** : Lors d'une vente, sélectionnez le client
- **Crédit magasin** : Montant disponible pour achats futurs

### Rechercher un Client

- Utilisez la **barre de recherche**
- Recherchez par : nom, email ou téléphone
- Filtrez par **magasin** si nécessaire

### Trier les Clients

Cliquez sur les en-têtes de colonnes pour trier par :
- Nom
- Email
- Points de fidélité
- Crédit magasin

---

## 💳 Gestion des Dettes (Ventes à Crédit)

### Consulter les Dettes

1. Allez dans **"Dettes"** depuis le menu
2. Visualisez toutes les ventes à crédit en cours
3. Informations affichées :
   - Client
   - Montant total
   - Montant payé
   - Reste à payer
   - Date de la vente

### Enregistrer un Paiement

1. Trouvez la vente dans la liste
2. Cliquez sur **"Payer"**
3. Entrez le **montant du paiement**
4. Sélectionnez le **mode de paiement** (espèces ou carte)
5. Cliquez sur **"Confirmer"**

### Historique des Paiements

- Consultez tous les versements effectués
- Date, montant et mode de paiement
- Utilisateur ayant enregistré le paiement

---

## 🏪 Gestion des Magasins

*Disponible pour les Propriétaires et Administrateurs*

### Ajouter un Magasin

1. Allez dans **"Magasins"**
2. Cliquez sur **"Ajouter un magasin"**
3. Remplissez :
   - **Nom** : Nom du magasin
   - **Localisation** : Adresse ou ville
   - **Téléphone** : Numéro de contact
4. Cliquez sur **"Enregistrer"**

### Modifier un Magasin

1. Cliquez sur l'icône **crayon**
2. Modifiez les informations
3. Cliquez sur **"Enregistrer"**

### Supprimer un Magasin

1. Cliquez sur l'icône **poubelle**
2. Confirmez la suppression

> **Attention** : Assurez-vous qu'aucun stock n'est associé au magasin.

### Changer de Magasin Actif

- Utilisez le **sélecteur de magasin** dans l'en-tête
- Toutes les opérations s'effectueront dans ce magasin
- Le stock affiché sera celui du magasin sélectionné

---

## 📜 Historique des Ventes

### Consulter l'Historique

1. Allez dans **"Historique"**
2. Visualisez toutes les ventes effectuées
3. Informations affichées :
   - Numéro de ticket
   - Date et heure
   - Client (si renseigné)
   - Montant total
   - Mode de paiement
   - Utilisateur ayant effectué la vente

### Rechercher une Vente

- **Par numéro de ticket** : Entrez le numéro
- **Par client** : Recherchez le nom du client
- **Par date** : Filtrez par période

### Détails d'une Vente

1. Cliquez sur une vente dans la liste
2. Consultez :
   - Liste des articles vendus
   - Quantités et prix
   - Réductions appliquées
   - Taxes
   - Mode de paiement

### Imprimer un Ticket

1. Ouvrez les détails de la vente
2. Cliquez sur **"Imprimer"**
3. Le ticket se génère et s'imprime

### Effectuer un Retour

1. Ouvrez les détails de la vente
2. Cliquez sur **"Retour"**
3. Sélectionnez les articles à retourner
4. Entrez les quantités
5. Choisissez le mode de remboursement :
   - **Espèces** : Remboursement immédiat
   - **Crédit magasin** : Crédit pour achats futurs
6. Confirmez le retour

> **Note** : Le stock est automatiquement réajusté.

---

## ⚙️ Paramètres de l'Application

*Accès selon les permissions*

### Paramètres Généraux

1. Allez dans **"Paramètres"**
2. Onglet **"Général"**

#### Informations du Magasin
- **Nom du magasin** : Apparaît sur les tickets
- **Logo** : Téléchargez votre logo (apparaît sur les tickets)
- **Taux de taxe** : TVA ou taxe applicable (en %)

#### Programme de Fidélité
- **Activer** : Cochez pour activer le programme
- **Points par dollar** : Nombre de points gagnés par unité monétaire
- **Valeur du point** : Valeur monétaire d'un point

### Paramètres d'Impression

1. Onglet **"Impression"**

#### Configuration
- **Impression automatique** : Imprimer automatiquement après chaque vente
- **Largeur du papier** : 58mm ou 80mm
- **Afficher les codes-barres** : Sur les tickets

#### Messages Promotionnels
- Ajoutez des messages qui apparaîtront sur les tickets
- Exemple : "Merci de votre visite !", "10% sur votre prochain achat"
- Sélectionnez le message actif

#### Statistiques d'Impression
- **Nombre de tickets imprimés**
- **Papier économisé** : Estimation en mètres

### Gestion des Utilisateurs

1. Onglet **"Utilisateurs"**

#### Ajouter un Utilisateur
1. Cliquez sur **"Ajouter un utilisateur"**
2. Remplissez :
   - **Nom d'utilisateur** : Identifiant de connexion (unique)
   - **Email** : Adresse email
   - **Prénom** et **Nom**
   - **Mot de passe** : Minimum 6 caractères
   - **Rôle** : Sélectionnez le rôle approprié
   - **Magasin assigné** : Pour les caissiers et managers
3. Cliquez sur **"Enregistrer"**

#### Modifier un Utilisateur
1. Cliquez sur l'icône **crayon**
2. Modifiez les informations
3. Cliquez sur **"Enregistrer"**

#### Supprimer un Utilisateur
1. Cliquez sur l'icône **poubelle**
2. Confirmez la suppression

> **Note** : Vous ne pouvez pas supprimer votre propre compte.

### Codes Promo

1. Onglet **"Codes Promo"**

#### Créer un Code Promo
1. Cliquez sur **"Ajouter un code promo"**
2. Remplissez :
   - **Code** : Code à saisir (ex: PROMO10)
   - **Type** : Pourcentage ou Montant fixe
   - **Valeur** : Montant de la réduction
3. Cliquez sur **"Enregistrer"**

#### Activer/Désactiver un Code
- Utilisez le **bouton toggle** pour activer ou désactiver
- Les codes désactivés ne peuvent pas être utilisés

#### Supprimer un Code
1. Cliquez sur l'icône **poubelle**
2. Confirmez la suppression

### Journal d'Activité

1. Onglet **"Journal"**
2. Consultez toutes les actions effectuées :
   - Utilisateur
   - Action effectuée
   - Date et heure
   - Détails

### Réinitialisation des Données

> **⚠️ ATTENTION : Ces actions sont irréversibles !**

#### Effacer l'Historique des Ventes
1. Cliquez sur **"Effacer l'historique"**
2. Confirmez en tapant "CONFIRMER"
3. Toutes les ventes seront supprimées

#### Réinitialiser les Produits
1. Cliquez sur **"Réinitialiser les produits"**
2. Confirmez en tapant "CONFIRMER"
3. Tous les produits seront supprimés

---

## 🖨️ Impression des Tickets

### Configuration de l'Imprimante

1. **Imprimante thermique** :
   - Connectez votre imprimante thermique (USB ou Bluetooth)
   - Installez les pilotes si nécessaire
   - Configurez-la comme imprimante par défaut

2. **Paramètres dans SmartPOS** :
   - Allez dans **Paramètres > Impression**
   - Sélectionnez la **largeur du papier** (58mm ou 80mm)
   - Activez l'**impression automatique** si souhaité

### Imprimer un Ticket

#### Automatique
- Si activé, le ticket s'imprime après chaque vente

#### Manuel
1. Après une vente, cliquez sur **"Imprimer"**
2. Ou depuis l'historique, ouvrez une vente et cliquez sur **"Imprimer"**

### Contenu du Ticket

- Logo du magasin (si configuré)
- Nom du magasin
- Date et heure
- Numéro de ticket
- Liste des articles avec prix
- Sous-total
- Réductions appliquées
- Taxes
- Total
- Mode de paiement
- Points de fidélité gagnés
- Message promotionnel
- Code-barres du ticket (si activé)

---

## 📱 Utilisation Mobile

SmartPOS est une Progressive Web App (PWA) utilisable sur mobile.

### Installer sur Mobile

#### Android
1. Ouvrez SmartPOS dans Chrome
2. Appuyez sur le menu (⋮)
3. Sélectionnez **"Ajouter à l'écran d'accueil"**
4. Confirmez

#### iOS (iPhone/iPad)
1. Ouvrez SmartPOS dans Safari
2. Appuyez sur le bouton **Partager** (□↑)
3. Sélectionnez **"Sur l'écran d'accueil"**
4. Confirmez

### Avantages du Mode PWA

- **Accès hors ligne** : Consultez les données même sans connexion
- **Notifications** : Recevez des alertes de stock bas
- **Performance** : Chargement plus rapide
- **Expérience native** : Comme une application mobile

---

## 🔔 Alertes et Notifications

### Alertes de Stock Bas

Lorsqu'un produit atteint le seuil de stock bas :

1. **Notification visuelle** : Badge rouge dans l'interface
2. **Email** : Si activé pour le produit
3. **Liste des alertes** : Consultez dans le tableau de bord

### Gérer les Alertes

1. Cliquez sur l'**icône cloche** dans l'en-tête
2. Visualisez tous les produits en stock bas
3. Cliquez sur **"Réapprovisionner"** pour agir rapidement

---

## 🎨 Personnalisation

### Thème Clair/Sombre

1. Cliquez sur l'**icône soleil/lune** dans l'en-tête
2. Le thème change instantanément
3. Votre préférence est sauvegardée

### Langue

1. Cliquez sur l'**icône drapeau** dans l'en-tête
2. Sélectionnez **Français** ou **English**
3. L'interface se traduit immédiatement

---

## 🆘 Résolution de Problèmes

### Je ne peux pas me connecter

- Vérifiez votre **nom d'utilisateur** et **mot de passe**
- Assurez-vous que votre compte est **actif**
- Contactez votre administrateur si le problème persiste

### La licence est expirée

- Allez dans **"Licence"**
- Entrez une **nouvelle clé de licence**
- Ou contactez le support pour renouveler

### Un produit n'apparaît pas dans le POS

- Vérifiez que le produit a du **stock disponible**
- Vérifiez que le produit est dans le **bon magasin**
- Rafraîchissez la page (F5)

### L'imprimante ne fonctionne pas

- Vérifiez que l'imprimante est **allumée** et **connectée**
- Vérifiez qu'elle est définie comme **imprimante par défaut**
- Vérifiez la **largeur du papier** dans les paramètres
- Testez l'impression depuis un autre logiciel

### Les données ne se synchronisent pas

- Vérifiez votre **connexion Internet**
- Rafraîchissez la page (F5)
- Déconnectez-vous et reconnectez-vous
- Videz le cache du navigateur

### Erreur lors d'une vente

- Vérifiez que le **stock est suffisant**
- Vérifiez que la **caisse est ouverte**
- Vérifiez que le **client existe** (pour ventes à crédit)
- Consultez le journal d'activité pour plus de détails

---

## 💡 Conseils et Bonnes Pratiques

### Gestion Quotidienne

1. **Ouvrir la caisse** en début de journée
2. **Vérifier les alertes** de stock bas
3. **Fermer la caisse** en fin de journée
4. **Consulter les analytics** pour suivre les performances

### Gestion du Stock

1. **Définir des seuils** de stock bas appropriés
2. **Activer les alertes email** pour les produits critiques
3. **Réapprovisionner régulièrement** avant la rupture
4. **Faire des inventaires** périodiques pour vérifier les quantités

### Gestion des Clients

1. **Enregistrer les clients réguliers** pour le programme de fidélité
2. **Encourager l'utilisation des points** pour fidéliser
3. **Collecter les emails** pour les communications marketing

### Sécurité

1. **Changer les mots de passe** régulièrement
2. **Ne pas partager** les identifiants
3. **Déconnecter** après chaque session
4. **Limiter les permissions** selon les rôles

### Performance

1. **Utiliser des images optimisées** pour les produits (< 500 Ko)
2. **Nettoyer régulièrement** l'historique ancien
3. **Utiliser le mode PWA** sur mobile pour de meilleures performances

---

## 📞 Support et Assistance

### Documentation

- **Guide d'installation** : INSTALLATION.md
- **Guide de déploiement** : DEPLOYMENT.md
- **Guide d'impression** : RECEIPT_PRINTING_GUIDE.md

### Contact

Pour toute question ou problème :
- **Email** : support@smartpos.com
- **Documentation** : Consultez les fichiers .md du projet
- **Journal d'activité** : Consultez les logs pour diagnostiquer les problèmes

---

## 🔄 Mises à Jour

SmartPOS est régulièrement mis à jour avec de nouvelles fonctionnalités et corrections.

### Vérifier les Mises à Jour

- Une **notification** apparaît quand une mise à jour est disponible
- Cliquez sur **"Mettre à jour"** pour recharger l'application
- Vos données sont préservées

### Nouveautés

Consultez le fichier **CHANGELOG.md** pour voir les dernières fonctionnalités ajoutées.

---

## 📊 Glossaire

- **POS** : Point of Sale (Point de Vente)
- **SKU** : Stock Keeping Unit (Référence produit)
- **PWA** : Progressive Web App (Application Web Progressive)
- **KPI** : Key Performance Indicator (Indicateur de Performance)
- **Tenant** : Entreprise/Organisation dans le système multi-tenant
- **Variante** : Déclinaison d'un produit (taille, couleur, etc.)

---

**Version du guide** : 1.0  
**Dernière mise à jour** : Février 2026

---

*Ce guide est conçu pour vous accompagner au quotidien. N'hésitez pas à le consulter régulièrement et à explorer les fonctionnalités de SmartPOS !*
