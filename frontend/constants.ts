
import { User, UserRole, Product, Settings, StockChangeReason, Permissions, PromoCode, Customer, Store, Supplier } from './types';

export const VALID_LICENSE_KEY = 'SMART-POS-DEMO-LICENSE-KEY';

// Configuration du branding SaaS (logo dynamique depuis la base de données)
export const SAAS_BRANDING = {
  appName: 'Smart POS',
  appSlogan: 'Point de Vente Intelligent',
  logoUrl: '', // Pas de logo par défaut - doit être uploadé
  faviconUrl: '',
  alt: 'Smart POS Logo'
};

// Fonction pour récupérer les paramètres SaaS depuis l'API
export const getSaasBranding = async () => {
  try {
    // Importer dynamiquement l'API_URL depuis config.ts
    const { API_URL } = await import('./config');
    const response = await fetch(`${API_URL}/api/app-settings`);
    if (response.ok) {
      const settings = await response.json();
      
      // Construire les URLs complètes pour les logos
      const logoUrl = settings.saas_logo_url 
        ? (settings.saas_logo_url.startsWith('http') 
            ? settings.saas_logo_url 
            : `${API_URL}${settings.saas_logo_url}`)
        : SAAS_BRANDING.logoUrl;
        
      const faviconUrl = settings.saas_favicon_url 
        ? (settings.saas_favicon_url.startsWith('http') 
            ? settings.saas_favicon_url 
            : `${API_URL}${settings.saas_favicon_url}`)
        : SAAS_BRANDING.faviconUrl;
      
      return {
        appName: settings.app_name || SAAS_BRANDING.appName,
        appSlogan: settings.app_slogan || SAAS_BRANDING.appSlogan,
        logoUrl,
        faviconUrl,
        alt: `${settings.app_name || SAAS_BRANDING.appName} Logo`
      };
    }
  } catch (error) {
    console.error('Erreur chargement branding SaaS:', error);
  }
  return SAAS_BRANDING;
};

export const ROLE_PERMISSIONS: { [key in UserRole]: Permissions } = {
  [UserRole.SuperAdmin]: {
    viewAnalytics: false,
    manageProducts: false,
    viewHistory: false,
    accessSettings: false,
    manageUsers: true,
    manageStores: false,
    manageLicenses: true,
  },
  [UserRole.Owner]: {
    viewAnalytics: true,
    manageProducts: true,
    viewHistory: true,
    accessSettings: true,
    manageUsers: true,
    manageStores: true,
    manageLicenses: false,
  },
  [UserRole.Admin]: {
    viewAnalytics: true,
    manageProducts: true,
    viewHistory: true,
    accessSettings: true,
    manageUsers: true,
    manageStores: true,
    manageLicenses: false,
  },
  [UserRole.Manager]: {
    viewAnalytics: true,
    manageProducts: true,
    viewHistory: true,
    accessSettings: false,
    manageUsers: false,
    manageStores: false,
    manageLicenses: false,
  },
  [UserRole.Cashier]: {
    viewAnalytics: false,
    manageProducts: false,
    viewHistory: true,
    accessSettings: false,
    manageUsers: false,
    manageStores: false,
    manageLicenses: false,
  },
};

export const MOCK_STORES: Store[] = [
    // Add missing tenantId
    { id: 1, tenantId: 1, name: 'Siège Principal', location: 'Avenue de l\'Indépendance', phone: '555-0100' },
    // Add missing tenantId
    { id: 2, tenantId: 1, name: 'Succursale Ouest', location: 'Centre Commercial Ouest', phone: '555-0200' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
    // Add missing tenantId
    { id: 1, tenantId: 1, name: 'Global Retail Solutions', contactPerson: 'M. Sow', email: 'sales@globalretail.com', phone: '33-822-0000' },
    // Add missing tenantId
    { id: 2, tenantId: 1, name: 'Textile Africa', contactPerson: 'Mme Diop', email: 'contact@textile.sn', phone: '33-855-1111' },
];

export const MOCK_USERS: User[] = [
  // Add missing tenantId to all mock users
  { id: 0, tenantId: 0, username: 'superadmin', email: 'super@smartpos.app', firstName: 'System', lastName: 'Admin', password: 'superpass', role: UserRole.SuperAdmin, permissions: ROLE_PERMISSIONS[UserRole.SuperAdmin] },
  { id: 1, tenantId: 1, username: 'proprietaire', email: 'owner@example.com', firstName: 'Big', lastName: 'Boss', password: 'owner', role: UserRole.Owner, permissions: ROLE_PERMISSIONS[UserRole.Owner] },
  { id: 2, tenantId: 1, username: 'admin', email: 'admin@example.com', firstName: 'Jean', lastName: 'Dupont', password: 'admin', role: UserRole.Admin, permissions: ROLE_PERMISSIONS[UserRole.Admin], assignedStoreId: 1 },
  { id: 3, tenantId: 1, username: 'gerant', email: 'jane@example.com', firstName: 'Jeanne', lastName: 'Martin', password: 'manager', role: UserRole.Manager, permissions: ROLE_PERMISSIONS[UserRole.Manager], assignedStoreId: 2 },
  { id: 4, tenantId: 1, username: 'employe', email: 'peter@example.com', firstName: 'Pierre', lastName: 'Dubois', password: 'staff', role: UserRole.Cashier, permissions: ROLE_PERMISSIONS[UserRole.Cashier], assignedStoreId: 1 },
  { id: 5, tenantId: 1, username: 'caissiere', email: 'marie@example.com', firstName: 'Marie', lastName: 'Claire', password: 'password', role: UserRole.Cashier, permissions: ROLE_PERMISSIONS[UserRole.Cashier], assignedStoreId: 1 },
];

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: 1, 
    // Add missing tenantId
    tenantId: 1,
    name: 'T-Shirt "Smart POS"', category: 'Vêtements', 
    description: 'Un t-shirt confortable en coton bio avec le logo Smart POS exclusif.',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', 
    low_stock_threshold: 10, enable_email_alert: true,
    attributes: [ { name: 'Taille', values: ['S', 'M', 'L'] }, { name: 'Couleur', values: ['Noir', 'Blanc'] } ],
    variants: [
      { id: 101, selectedOptions: { 'Taille': 'S', 'Couleur': 'Noir'}, price: 15000, costPrice: 8000, stock_quantity: 15, quantityByStore: { 1: 15, 2: 0 }, sku: 'TS-GEM-S-BLK', barcode: '8801010001' },
      { id: 102, selectedOptions: { 'Taille': 'M', 'Couleur': 'Noir'}, price: 15000, costPrice: 8000, stock_quantity: 20, quantityByStore: { 1: 20, 2: 0 }, sku: 'TS-GEM-M-BLK', barcode: '8801010002' },
      { id: 103, selectedOptions: { 'Taille': 'L', 'Couleur': 'Noir'}, price: 15000, costPrice: 8000, stock_quantity: 12, quantityByStore: { 1: 12, 2: 0 }, sku: 'TS-GEM-L-BLK', barcode: '8801010003' },
      { id: 104, selectedOptions: { 'Taille': 'S', 'Couleur': 'Blanc'}, price: 15000, costPrice: 8000, stock_quantity: 18, quantityByStore: { 1: 18, 2: 0 }, sku: 'TS-GEM-S-WHT', barcode: '8801010004' },
      { id: 105, selectedOptions: { 'Taille': 'M', 'Couleur': 'Blanc'}, price: 15000, costPrice: 8000, stock_quantity: 0, quantityByStore: { 1: 0, 2: 0 }, sku: 'TS-GEM-M-WHT', barcode: '8801010005' },
      { id: 106, selectedOptions: { 'Taille': 'L', 'Couleur': 'Blanc'}, price: 15000, costPrice: 8000, stock_quantity: 8, quantityByStore: { 1: 8, 2: 0 }, sku: 'TS-GEM-L-WHT', barcode: '8801010006' },
    ]
  },
  { 
    id: 2, 
    // Add missing tenantId
    tenantId: 1,
    name: 'Portefeuille en cuir', category: 'Accessoires', 
    description: 'Élégant portefeuille en cuir véritable tanné végétalement.',
    imageUrl: 'https://images.unsplash.com/photo-1615393437348-91778c454593?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', 
    low_stock_threshold: 5,
    attributes: [],
    variants: [
        { id: 201, selectedOptions: {}, price: 45000, costPrice: 22000, stock_quantity: 10, quantityByStore: { 1: 10, 2: 0 }, sku: 'ACC-WALLET-LTH', barcode: '8801020001' },
    ]
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  // Add missing tenantId
  { id: 1, tenantId: 1, firstName: 'Alice', lastName: 'Koffi', email: 'alice@example.com', phone: '555-0101', salesHistoryIds: [], loyaltyPoints: 125, storeCredit: 0, storeId: 1 },
  // Add missing tenantId
  { id: 2, tenantId: 1, firstName: 'Bob', lastName: 'Sow', email: 'bob@example.com', phone: '555-0102', salesHistoryIds: [], loyaltyPoints: 480, storeCredit: 5000, storeId: 1 },
];

export const DEFAULT_SETTINGS: Settings = {
  // Add missing tenantId
  tenantId: 1,
  storeName: 'Smart Retail',
  taxRate: 18, 
  loyaltyProgram: {
    enabled: true,
    pointsPerDollar: 0.01, 
    pointValue: 1 
  },
  printing: {
    autoPrint: true, // Activé par défaut pour les tests
    paperWidth: '80mm',
    showBarcodes: true,
    promotionalMessages: [
      'Merci pour votre visite ! Revenez nous voir bientôt.',
      'Suivez-nous sur les réseaux sociaux pour nos offres spéciales.',
      'Recommandez-nous à vos amis et obtenez 10% de réduction.',
      'Prochaine visite : -5% avec ce ticket (valable 30 jours).',
      'Votre satisfaction est notre priorité. Merci de votre confiance.'
    ],
    printStatistics: {
      enabled: true,
      totalReceipts: 0,
      paperSaved: 0
    }
  }
};

export const MOCK_PROMO_CODES: PromoCode[] = [
  // Add missing tenantId
  { id: 1, tenantId: 1, code: 'SAVE10', type: 'percentage', value: 10, isActive: true },
  // Add missing tenantId
  { id: 2, tenantId: 1, code: '500OFF', type: 'fixed', value: 500, isActive: true },
];

export const TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
    fr: {
        // Rôles
        superadmin: "Super Admin",
        owner: "Propriétaire",
        admin: "Administrateur",
        manager: "Gérant",
        cashier: "Caissier",

        // Navigation
        posTerminal: "Caisse (POS)",
        analytics: "Analyses",
        products: "Produits",
        inventory: "Inventaire",
        purchases: "Achats",
        suppliers: "Fournisseurs",
        customers: "Clients",
        stores: "Magasins",
        viewHistory: "Ventes",
        appSettings: "Paramètres",
        superAdmin: "Système",
        debts: "Dettes",

        // Ventes / Panier
        salesCart: "Panier de vente",
        associateCustomer: "Associer un client",
        emptyCart: "Le panier est vide",
        subtotal: "Sous-total",
        tax: "TVA",
        total: "Total TTC",
        newSale: "Nouvelle Vente",
        amountReceived: "Montant reçu",
        changeToReturn: "Monnaie à rendre",
        confirmSale: "Confirmer la vente",
        confirmAndPay: "Confirmer et Payer",
        productAdded: "Produit ajouté au panier",
        productNotFound: "Produit non trouvé",
        scanBarcode: "Scanner un code-barres",
        searchProducts: "Rechercher un produit...",
        quickView: "Aperçu rapide",
        addToCartAction: "Ajouter au panier",
        selectVariant: "Choisir la variante",
        addToCart: "Ajouter",
        promoCodeApplied: "Code promo appliqué",
        promoCodeInvalid: "Code promo invalide",
        promoCode: "Code Promo",
        openCart: "Ouvrir Panier",
        login: "Connexion",
        logout: "Déconnexion",
        loginTitle: "Connexion POS",
        username: "Nom d'utilisateur",
        password: "Mot de passe",
        licenseKey: "Clé de Licence",
        loginError: "Utilisateur ou licence invalide",
        saleCompleted: "Vente Terminée",
        itemsCount: "articles",
        totalDiscounts: "Total Remises",
        pointsToEarnLabel: "Points à gagner",
        payment: "Paiement",
        wait: "Attente",

        // Crédit & Dettes
        paymentType: "Type de paiement",
        fullPayment: "Complet",
        creditPayment: "À Crédit",
        initialDeposit: "Acompte initial",
        itemStatus: "Statut articles",
        taken: "Emporté",
        reserved: "Réservé",
        debtManagement: "Gestion des Créances",
        totalDebt: "Dette Totale",
        remainingBalance: "Reste à payer",
        addInstallment: "Encaisser versement",
        installmentAmount: "Montant du versement",
        installmentSuccess: "Versement enregistré avec succès",
        noDebts: "Aucune dette en cours.",
        customerRequiredForCredit: "Un client est obligatoire pour une vente à crédit.",
        amountPaid: "Payé",
        statusReserved: "Réservé",
        statusTaken: "Emporté",

        // Inventaire
        inventoryAudit: "Audit d'Inventaire",
        inventoryValue: "Valeur de Vente",
        costValue: "Valeur d'Achat",
        potentialProfit: "Bénéfice Potentiel",
        productName: "Désignation",
        stock: "Stock",
        costPrice: "Prix d'achat",
        price: "Prix de vente",
        margin: "Marge",
        profitValue: "Marge Brute",
        actions: "Actions",
        outOfStock: "Rupture",
        warning: "Stock Bas",
        healthy: "Stock OK",
        allStores: "Tous les magasins",
        lowStock: "Stock Faible",
        inStock: "en stock",
        restock: "Réappro.",
        restockProduct: "Réapprovisionner le produit",
        quantityToAdd: "Quantité à ajouter",
        restockNotes: "Notes de réapprovisionnement",
        productRestockedSuccess: "Produit réapprovisionné avec succès",
        quantityMustBePositive: "La quantité doit être positive",
        stockChangePlaceholder: "Ex: Arrivage fournisseur, correction...",
        stockTransfer: "Transfert de stock",
        sourceStore: "Depuis",
        destinationStore: "Vers",
        transferQuantity: "Quantité à transférer",
        transferNotes: "Notes de transfert",
        transferSuccess: "Transfert effectué avec succès",
        insufficientStock: "Stock insuffisant dans le magasin source",

        // Gestion Produits
        editProduct: "Modifier le produit",
        addProduct: "Ajouter un produit",
        subscribeToAlerts: "Alertes Stocks",
        addCategory: "Nouvelle Catégorie",
        imagePreview: "Aperçu de l'image",
        uploadImage: "Importer une image",
        changeImage: "Changer l'image",
        imageSizeHint: "Utilisez une image carrée pour un meilleur rendu.",
        category: "Catégorie",
        attributes: "Attributs (Taille, Couleur...)",
        attributeNamePlaceholder: "Ex: Taille",
        attributeValuesPlaceholder: "Valeur1, Valeur2...",
        addAttribute: "Ajouter un attribut",
        generateVariants: "Générer les variantes",
        variants: "Variantes",
        addVariant: "Ajouter une variante",
        variantName: "Nom de variante",
        defaultVariantName: "Standard",
        removeVariant: "Supprimer la variante",
        stockQuantity: "Quantité en stock",
        stockHistory: "Historique du stock",
        sku: "Référence (SKU)",
        barcode: "Code-barres",
        generateSku: "Générer SKU",
        generateBarcode: "Générer Code-barres",
        lowStockThreshold: "Seuil d'alerte stock bas",
        expectedRestockDate: "Date de réappro. prévue",
        enableEmailAlerts: "Activer les alertes par email",
        save: "Enregistrer",
        cancel: "Annuler",
        edit: "Modifier",
        delete: "Supprimer",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer cet élément ?",
        variantsGenerated: "Variantes générées avec succès",
        imageRequiredError: "L'image du produit est obligatoire",
        priceNegativeError: "Le prix ne peut pas être négatif",
        stockNegativeError: "Le stock ne peut pas être négatif",
        newCategory: "Nouvelle Catégorie",
        categoryName: "Nom de la catégorie",
        categoryAddedSuccess: "Catégorie ajoutée",
        categoryExistsError: "Cette catégorie existe déjà",
        exportBarcodes: "Étiquettes",
        exportBarcodeLabels: "Exporter Étiquettes Code-barres",
        generatePDF: "Générer PDF",
        productsSelected: "{count} produits sélectionnés",
        selectAll: "Tout cocher",
        deselectAll: "Tout décocher",

        // Analyses
        salesAnalytics: "Tableau de Bord Analytique",
        totalSales: "Chiffre d'Affaires",
        avgOrderValue: "Panier Moyen",
        loadingInsights: "Génération de l'analyse IA...",
        getInsights: "Analyse IA",
        thisWeek: "Cette Semaine",
        thisMonth: "Ce Mois",
        from: "Du",
        to: "Au",
        salesTrend: "Tendance des Ventes (TTC)",
        categorySales: "Ventes par Catégorie",
        bestSellingItems: "Produits les plus vendus",
        storeComparison: "Performance par Magasin",
        insightsTitle: "Recommandations Stratégiques IA",
        topSpendingCustomers: "Top Clients",
        visits: "visites",

        // Paramètres
        generalSettings: "Paramètres Généraux",
        storeName: "Nom de l'enseigne",
        taxRate: "Taux de TVA (%)",
        saveSettings: "Enregistrer les modifications",
        settingsSaved: "Paramètres mis à jour",
        loyaltyProgram: "Programme de Fidélité",
        loyaltySettingsDesc: "Configurez comment vos clients gagnent et passent des points.",
        enableLoyaltyProgram: "Activer la fidélité",
        pointsPerDollar: "Points gagnés par FCFA dépensé",
        pointValue: "Valeur d'un point (en FCFA)",
        userManagement: "Gestion des Utilisateurs",
        addUser: "Ajouter un compte",
        fullName: "Nom complet",
        firstName: "Prénom",
        lastName: "Nom",
        email: "Adresse Email",
        assignedStore: "Magasin affecté",
        role: "Rôle / Niveau d'accès",
        userUpdatedSuccess: "Utilisateur mis à jour",
        userAddedSuccess: "Utilisateur créé",
        userExistsError: "Ce nom d'utilisateur est déjà pris",
        emailExistsError: "Cette adresse email est déjà utilisée",
        cannotDeleteSelf: "Vous ne pouvez pas supprimer votre propre compte",
        confirmDeleteUser: "Supprimer cet utilisateur définitivement ?",
        userDeletedSuccess: "Utilisateur supprimé",
        activityLog: "Journal d'activité",
        timestamp: "Date/Heure",
        user: "Utilisateur",
        action: "Action",
        details: "Détails",
        noActivityLog: "Aucun log d'activité récent.",
        dangerZone: "Zone de Danger",
        dataManagement: "Gestion des données système",
        clearSalesHistory: "Purger les ventes",
        resetProducts: "Réinitialiser produits",
        clearSalesHistoryConfirm: "ATTENTION : Cela supprimera TOUTES les ventes. Continuer ?",
        salesHistoryCleared: "Historique des ventes purgé",
        resetProductsConfirm: "Réinitialiser les produits aux données démo ?",
        productsReset: "Produits réinitialisés",
        theme: "Thème",
        light: "Clair",
        dark: "Sombre",
        settings: "Préférences",
        close: "Fermer",
        accountSettings: "Mon Compte",
        currentPassword: "Mot de passe actuel",
        newPassword: "Nouveau mot de passe",
        confirmNewPassword: "Confirmer nouveau mot de passe",
        changePassword: "Changer le mot de passe",

        // Achats & Fournisseurs
        purchaseOrders: "Bons de Commande",
        addPurchaseOrder: "Nouvelle Commande",
        markAsReceived: "Réceptionner",
        receiveOrder: "Confirmer Réception",
        selectSupplier: "Choisir Fournisseur",
        totalCost: "Coût Total",
        orderStatus: "Statut",
        draft: "Brouillon",
        ordered: "Commandé",
        received: "Reçu",
        cancelled: "Annulé",

        // Clients
        searchCustomers: "Rechercher un client...",
        addCustomer: "Ajouter Client",
        customerUpdatedSuccess: "Fiche client mise à jour",
        customerAddedSuccess: "Client ajouté à la base",
        loyaltyPoints: "Points Fidélité",
        phone: "Téléphone",
        selectCustomer: "Sélectionner un client",
        addNewCustomer: "Nouveau Client",
        noCustomerFound: "Aucun client ne correspond.",
        
        // Magasins
        storeManagement: "Gestion des Magasins",
        addStore: "Ajouter Magasin",
        editStore: "Modifier Magasin",
        location: "Emplacement",
        storePhone: "Téléphone",
        currentStore: "Magasin actuel",
        noStoresFound: "Aucun magasin enregistré.",
        confirmDeleteStore: "Supprimer ce magasin ?",
        storeAddedSuccess: "Magasin ajouté",
        storeUpdatedSuccess: "Magasin mis à jour",
        storeDeletedSuccess: "Magasin supprimé",

        // Ventes (Historique)
        salesHistory: "Historique des Ventes",
        saleId: "ID Vente",
        customer: "Client",
        totalAmount: "Montant Total",
        loyaltyPointsEarned: "Points fidélité gagnés",

        // Stock (Historique)
        change: "Variation",
        newStockLevel: "Nouveau Stock",
        notes: "Notes / Obs.",
        
        // Caisse
        cashManagement: "Gestion de Caisse",
        openCashDrawer: "Ouvrir Caisse",
        closeCashDrawer: "Fermer Caisse",
        openingCash: "Fond de caisse initial",
        currentCash: "Espèces attendues",
        cashTransactions: "Mouvements de caisse",
        addTransaction: "Ajouter Mouvement",
        cashIn: "Entrée (Dépôt)",
        cashOut: "Sortie (Retrait)",
        reason: "Raison / Motif",
        
        // Divers
        printReceipt: "Imprimer Ticket",
        returnExchange: "Retour / Échange",
        itemsSold: "Articles vendus",
        noSalesRecorded: "Aucune vente enregistrée pour le moment.",
        viewDetails: "Voir détails",
        discount: "Remise",
        loyaltyDiscount: "Remise Fidélité",
        exportToCSV: "Exporter CSV",
        searchById: "Chercher par ID...",
        
        // Retour / Echange
        selectItemsToReturn: "Sélectionnez les articles à retourner",
        purchased: "Acheté",
        returnQuantity: "Qté à retourner",
        max: "max",
        totalRefundValue: "Valeur totale du remboursement",
        issueStoreCredit: "Émettre un avoir",
        startExchange: "Commencer l'échange",
        noCustomerForCredit: "Client requis pour l'avoir/échange",
        storeCreditIssued: "Avoir émis avec succès",
        exchangeStarted: "Échange initié",
        
        // Stock Alertes
        severelyOutOfStock: "RUPTURE CRITIQUE",
        severelyOutOfStockMessage: "Les produits suivants sont en rupture depuis plus de 7 jours :",
        lowStockAlertTitle: "ALERTE STOCK FAIBLE",
        lowStockAlertMessage: "Les produits suivants ont atteint leur seuil critique :",
        expectedRestock: "Réappro. estimé",
        lowSince: "Bas depuis le",
        dismiss: "Ignorer",

        // Système / SaaS Admin
        licenseManagement: "Gestion des Licences",
        manageOwners: "Gérer Propriétaires",
        ownerManagement: "Gestion des Propriétaires",
        addOwner: "Ajouter Propriétaire",
        noOwnersFound: "Aucun propriétaire enregistré.",
        generateLicense: "Générer une Licence",
        licenseAdded: "Licence générée avec succès",
        licenseRevoked: "Licence révoquée",
        copyKey: "Copier la clé",
        assignStore: "Affecter au magasin",
        permissions: "Permissions du profil",
        permissionViewAnalytics: "Voir les analyses",
        permissionManageProducts: "Gérer l'inventaire",
        permissionViewHistory: "Voir l'historique",
        permissionAccessSettings: "Accéder aux paramètres",
        permissionManageUsers: "Gérer les utilisateurs",
        permissionManageStores: "Gérer les magasins",
        permissionManageLicenses: "Gérer les licences (Admin SaaS)",
        sendInvite: "Envoyer invitation",
        sendInviteDesc: "L'utilisateur recevra ses accès par email.",
    },
    en: {
        // Non utilisé
    }
};
