import { Sale, Store, Settings, CartItem } from '../types';

interface PrintOptions {
  autoPrint?: boolean;
  paperWidth?: '58mm' | '80mm';
  showBarcodes?: boolean;
  promotionalMessage?: string;
  maxItemsPerPage?: number;
  showSummaryOnly?: boolean;
}

// Fonction pour sélectionner un message promotionnel aléatoire
export const getRandomPromotionalMessage = (messages: string[]): string => {
  if (!messages || messages.length === 0) return '';
  return messages[Math.floor(Math.random() * messages.length)];
};

// Fonction pour calculer la longueur estimée du papier (en cm)
export const calculatePaperLength = (itemCount: number, paperWidth: '58mm' | '80mm' = '80mm', hasBarcodes: boolean = false): number => {
  const baseLength = paperWidth === '58mm' ? 12 : 10;
  const itemLength = paperWidth === '58mm' ? 0.8 : 0.6;
  const barcodeLength = paperWidth === '58mm' ? 2 : 1.5;
  
  let totalLength = baseLength;
  totalLength += itemCount * itemLength;
  if (hasBarcodes) {
    totalLength += itemCount * barcodeLength;
  }
  
  return totalLength;
};

// Fonction pour mettre à jour les statistiques d'impression
export const updatePrintStatistics = (settings: Settings, paperLength: number, wasSummary: boolean = false): Settings => {
  const newSettings = { ...settings };
  if (newSettings.printing?.printStatistics) {
    newSettings.printing.printStatistics.totalReceipts += 1;
    
    if (wasSummary) {
      const fullLength = paperLength * 2;
      const savedLength = fullLength - paperLength;
      newSettings.printing.printStatistics.paperSaved += savedLength / 100;
    }
  }
  
  return newSettings;
};

// Fonction d'impression directe sans nouvel onglet
const printDirectly = (htmlContent: string, paperWidth: '58mm' | '80mm') => {
  // Créer un iframe caché pour l'impression
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'absolute';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = 'none';
  
  document.body.appendChild(printFrame);
  
  const frameDoc = printFrame.contentWindow?.document;
  if (!frameDoc) return;
  
  // Écrire le contenu dans l'iframe
  frameDoc.open();
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket de caisse</title>
      <style>
        ${getPrintStyles(paperWidth)}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  frameDoc.close();
  
  // Attendre que le contenu soit chargé puis imprimer
  printFrame.contentWindow?.focus();
  setTimeout(() => {
    printFrame.contentWindow?.print();
    
    // Nettoyer après impression
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 1000);
  }, 250);
};

// Fonction pour générer des séparateurs adaptatifs
const getSeparator = (type: 'thick' | 'thin', paperWidth: '58mm' | '80mm'): string => {
  const length = paperWidth === '58mm' ? 32 : 48;
  const char = type === 'thick' ? '=' : '-';
  return char.repeat(length);
};

// Fonction pour formater les montants avec séparateurs
const formatCurrency = (amount: number | undefined): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Fonction pour générer un numéro de ticket au format "_PJOWVL2"
const getTicketNumber = (saleId: string): string => {
  // Extraire une partie de l'ID de vente pour créer un identifiant unique
  let hash = '';
  
  if (saleId.includes('_')) {
    // Si l'ID contient des underscores, prendre la partie après le dernier underscore
    const parts = saleId.split('_');
    hash = parts[parts.length - 1];
  } else if (saleId.includes('-')) {
    // Si c'est un UUID, prendre la dernière partie
    const parts = saleId.split('-');
    hash = parts[parts.length - 1];
  } else {
    // Sinon, utiliser l'ID tel quel
    hash = saleId;
  }
  
  // Prendre les 7 premiers caractères et les mettre en majuscules
  const ticketSuffix = hash.substring(0, 7).toUpperCase();
  
  // Retourner au format "_XXXXXXX"
  return `_${ticketSuffix}`;
};

// Styles CSS simples et épurés
const getPrintStyles = (paperWidth: '58mm' | '80mm') => {
  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  const fontSize = paperWidth === '58mm' ? '9px' : '10px';
  const padding = paperWidth === '58mm' ? '4mm' : '5mm';
  const lineHeight = paperWidth === '58mm' ? '1.3' : '1.4';
  
  return `
    @media print {
      @page {
        size: ${width} auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      font-size: ${fontSize};
      line-height: ${lineHeight};
      margin: 0;
      padding: 0;
      width: ${width};
      color: #000;
      background: #fff;
    }
    
    .receipt {
      width: 100%;
      padding: ${padding};
      background: #fff;
      max-width: ${width};
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      padding-bottom: 5px;
    }
    
    .store-name {
      font-weight: bold;
      font-size: ${paperWidth === '58mm' ? '11px' : '12px'};
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .store-info {
      font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
      margin: 2px 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .ticket-info {
      margin: 8px 0;
      font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
      padding: 3px 0;
    }
    
    .ticket-number {
      text-align: right;
      font-weight: bold;
      margin-bottom: 2px;
    }
    
    .separator {
      text-align: center;
      margin: 5px 0;
      font-weight: bold;
      font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
      overflow: hidden;
    }
    
    .separator-thin {
      text-align: center;
      margin: 4px 0;
      font-size: ${paperWidth === '58mm' ? '7px' : '8px'};
      overflow: hidden;
    }
    
    .separator-thick {
      text-align: center;
      margin: 5px 0;
      font-weight: bold;
      font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
      overflow: hidden;
    }
    
    .summary-notice {
      text-align: center;
      font-weight: bold;
      margin: 8px 0;
      padding: 3px 0;
      font-size: ${paperWidth === '58mm' ? '9px' : '10px'};
    }
    
    .line {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      padding: 1px 0;
      align-items: center;
      min-height: ${paperWidth === '58mm' ? '12px' : '14px'};
    }
    
    .line span {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .line span:first-child {
      flex: 1;
      margin-right: 5px;
    }
    
    .line span:last-child {
      flex-shrink: 0;
      text-align: right;
      min-width: ${paperWidth === '58mm' ? '35px' : '45px'};
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      padding: 2px 0;
      font-weight: bold;
      font-size: ${paperWidth === '58mm' ? '10px' : '11px'};
      align-items: center;
      min-height: ${paperWidth === '58mm' ? '14px' : '16px'};
    }
    
    .total-line span:first-child {
      flex: 1;
      margin-right: 5px;
    }
    
    .total-line span:last-child {
      flex-shrink: 0;
      text-align: right;
      min-width: ${paperWidth === '58mm' ? '40px' : '50px'};
    }
    
    .item {
      margin: 5px 0;
      padding: 2px 0;
    }
    
    .item-name {
      font-weight: bold;
      margin-bottom: 2px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.2;
    }
    
    .item-options {
      font-size: ${paperWidth === '58mm' ? '7px' : '8px'};
      margin-bottom: 2px;
      font-style: italic;
      color: #666;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .item-line {
      display: flex;
      justify-content: space-between;
      margin-top: 2px;
      align-items: center;
      min-height: ${paperWidth === '58mm' ? '12px' : '14px'};
    }
    
    .item-line span:first-child {
      flex: 1;
      margin-right: 5px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .item-line span:last-child {
      flex-shrink: 0;
      text-align: right;
      min-width: ${paperWidth === '58mm' ? '35px' : '45px'};
    }
    
    .barcode {
      text-align: center;
      margin: 3px 0;
      font-size: ${paperWidth === '58mm' ? '6px' : '7px'};
      padding: 2px 0;
    }
    
    .barcode-number {
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
    }
    
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
      padding-top: 5px;
    }
    
    .payment-info {
      margin: 5px 0;
      padding: 2px 0;
    }
    
    .payment-info div {
      margin: 2px 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .thank-you {
      font-weight: bold;
      margin: 8px 0;
      text-transform: uppercase;
      font-size: ${paperWidth === '58mm' ? '9px' : '10px'};
      padding: 3px 0;
    }
    
    .footer-info {
      margin: 3px 0;
      font-size: ${paperWidth === '58mm' ? '7px' : '8px'};
      line-height: 1.3;
      word-wrap: break-word;
      overflow-wrap: break-word;
      padding: 1px 0;
    }
    
    .promotional-message {
      margin: 6px 0;
      text-align: center;
      font-style: italic;
      padding: 3px 0;
      font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.4;
    }
    
    /* Éviter les coupures de page */
    .item, .line, .total-line {
      page-break-inside: avoid;
    }
    
    /* Assurer que le texte ne déborde pas */
    * {
      max-width: 100%;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
  `;
};

// En-tête du ticket simple
const getReceiptHeader = (store?: Store | null, settings?: Settings, ticketId?: string, sale?: Sale) => {
  const storeName = store?.name || settings?.storeName || 'POINT DE VENTE';
  const storeLocation = store?.location || '';
  const storePhone = store?.phone || '';
  const currentDate = new Date();
  
  return `
    <div class="header">
      <div class="store-name">${storeName.toUpperCase()}</div>
      ${storeLocation ? `<div class="store-info">${storeLocation}</div>` : ''}
      ${storePhone ? `<div class="store-info">Tél: ${storePhone}</div>` : ''}
    </div>
    
    <div class="ticket-info">
      <div class="ticket-number">N° TICKET: ${ticketId || 'XXXXXX'}</div>
      <div>Date/Heure: ${currentDate.toLocaleDateString('fr-FR')} ${currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div>Caissier: ${sale?.user?.username?.toUpperCase() || 'CAISSIERE'}</div>
    </div>
  `;
};

// Pied de page du ticket simple
const getReceiptFooter = (sale: Sale, promotionalMessage: string, settings?: Settings, store?: Store | null, paperWidth: '58mm' | '80mm' = '80mm') => {
  const paymentMethodText = sale.paymentMethod === 'cash' ? 'ESPÈCES' : 
                           sale.paymentMethod === 'card' ? 'CARTE' : 'CRÉDIT';
  
  return `
    <div class="footer">
      <div class="payment-info">
        <div>MODE DE PAIEMENT: ${paymentMethodText}</div>
        <div>Montant payé: ${formatCurrency(sale.totalPaid)} F CFA</div>
      </div>
      
      <div class="separator-thin">${getSeparator('thin', paperWidth)}</div>
      
      <div class="separator-thick">${getSeparator('thick', paperWidth)}</div>
      
      <div class="thank-you">MERCI DE VOTRE VISITE !</div>
      
      <div class="footer-info">Conservez votre ticket pour tout échange ou</div>
      <div class="footer-info">retour.</div>
      <div class="footer-info"></div>
      <div class="footer-info">Les articles vendus ne sont ni repris ni échangés</div>
      <div class="footer-info">sans ce ticket.</div>
      <div class="footer-info"></div>
      <div class="footer-info">TVA incluse - Prix TTC</div>
      <div class="footer-info">Ticket édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div class="footer-info"></div>
      <div class="footer-info">Service client: ${store?.phone || '555-0100'}</div>
      <div class="footer-info"></div>
      <div class="footer-info">Powered by Smart POS v2.0</div>
      <div class="footer-info"></div>
      <div class="separator">* ${getSeparator('thin', paperWidth).substring(2, -2)} *</div>
      
      ${promotionalMessage ? `
        <div class="promotional-message">
          ${promotionalMessage}
        </div>
      ` : ''}
    </div>
  `;
};

// Impression ticket résumé (pour gros paniers)
export const printReceiptSummary = (sale: Sale, store?: Store | null, settings?: Settings, options?: PrintOptions) => {
  const paperWidth = options?.paperWidth || '80mm';
  const promotionalMessage = options?.promotionalMessage || '';
  
  const paperLength = calculatePaperLength(sale.items.length, paperWidth, false);
  const ticketId = getTicketNumber(sale.id);
  
  const htmlContent = `
    <div class="receipt">
      ${getReceiptHeader(store, settings, ticketId, sale)}
      
      <div class="separator">${getSeparator('thick', paperWidth)}</div>
      
      <div class="summary-notice">
        TICKET RÉSUMÉ - ${sale.items.length} ARTICLES
      </div>
      
      <div class="separator">${getSeparator('thick', paperWidth)}</div>
      
      <div class="line">
        <span>Articles (${sale.items.length})</span>
        <span>${formatCurrency(sale.subtotal)} F CFA</span>
      </div>
      ${(sale.discount || 0) > 0 ? `<div class="line"><span>Remise</span><span>-${formatCurrency(sale.discount)} F CFA</span></div>` : ''}
      ${(sale.loyaltyDiscount || 0) > 0 ? `<div class="line"><span>Fidélité</span><span>-${formatCurrency(sale.loyaltyDiscount)} F CFA</span></div>` : ''}
      
      <div class="separator-thin">${getSeparator('thin', paperWidth)}</div>
      
      <div class="line">
        <span>SOUS-TOTAL:</span>
        <span>${formatCurrency((sale.subtotal || 0) - (sale.discount || 0) - (sale.loyaltyDiscount || 0))} F CFA</span>
      </div>
      <div class="line">
        <span>MONTANT HT:</span>
        <span>${formatCurrency((sale.subtotal || 0) - (sale.discount || 0) - (sale.loyaltyDiscount || 0))} F CFA</span>
      </div>
      ${(sale.tax || 0) > 0 ? `<div class="line"><span>TVA:</span><span>${formatCurrency(sale.tax)} F CFA</span></div>` : ''}
      
      <div class="separator-thick">${getSeparator('thick', paperWidth)}</div>
      
      <div class="total-line">
        <span>TOTAL TTC:</span>
        <span>${formatCurrency(sale.total)} F CFA</span>
      </div>
      
      <div class="separator-thick">${getSeparator('thick', paperWidth)}</div>
      
      ${getReceiptFooter(sale, promotionalMessage, settings, store, paperWidth)}
    </div>
  `;

  printDirectly(htmlContent, paperWidth);

  if (settings) {
    updatePrintStatistics(settings, paperLength, true);
  }
};

// Impression ticket complet
export const printReceiptComplete = (sale: Sale, store?: Store | null, settings?: Settings, options?: PrintOptions) => {
  const paperWidth = options?.paperWidth || '80mm';
  const showBarcodes = options?.showBarcodes || true;
  const promotionalMessage = options?.promotionalMessage || '';
  
  const paperLength = calculatePaperLength(sale.items.length, paperWidth, showBarcodes);
  const ticketId = getTicketNumber(sale.id);
  
  const htmlContent = `
    <div class="receipt">
      ${getReceiptHeader(store, settings, ticketId, sale)}
      
      <div class="separator">${getSeparator('thick', paperWidth)}</div>
      
      ${sale.items.map((item: CartItem, index: number) => `
        <div class="item">
          <div class="item-name">${(item.productName || 'Article').toUpperCase()}</div>
          ${item.variant.selectedOptions && Object.keys(item.variant.selectedOptions).length > 0 ? 
            `<div class="item-options">${Object.entries(item.variant.selectedOptions).map(([key, value]) => `${key} / ${value}`).join(' ')}</div>` : ''
          }
          <div class="item-line">
            <span>${item.quantity || 1} x ${formatCurrency(item.variant.price)} F CFA</span>
            <span>${formatCurrency((item.variant.price || 0) * (item.quantity || 1))} F CFA</span>
          </div>
          ${showBarcodes && item.variant.barcode ? `
            <div class="barcode">
              <div class="barcode-number">${item.variant.barcode}</div>
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      <div class="separator">${getSeparator('thick', paperWidth)}</div>
      
      <div class="line">
        <span>SOUS-TOTAL:</span>
        <span>${formatCurrency(sale.subtotal)} F CFA</span>
      </div>
      <div class="line">
        <span>MONTANT HT:</span>
        <span>${formatCurrency((sale.subtotal || 0) - (sale.discount || 0) - (sale.loyaltyDiscount || 0))} F CFA</span>
      </div>
      ${(sale.tax || 0) > 0 ? `<div class="line"><span>TVA:</span><span>${formatCurrency(sale.tax)} F CFA</span></div>` : ''}
      
      <div class="separator-thick">${getSeparator('thick', paperWidth)}</div>
      
      <div class="total-line">
        <span>TOTAL TTC:</span>
        <span>${formatCurrency(sale.total)} F CFA</span>
      </div>
      
      <div class="separator-thick">${getSeparator('thick', paperWidth)}</div>
      
      ${getReceiptFooter(sale, promotionalMessage, settings, store, paperWidth)}
    </div>
  `;

  printDirectly(htmlContent, paperWidth);

  if (settings) {
    updatePrintStatistics(settings, paperLength, false);
  }
};

// Fonction d'impression avec choix utilisateur
export const printReceipt = (sale: Sale, store?: Store | null, settings?: Settings, options?: PrintOptions) => {
  const maxItems = options?.maxItemsPerPage || 20;
  const showSummaryOnly = options?.showSummaryOnly || false;
  
  if (sale.items.length > maxItems && !showSummaryOnly) {
    const userChoice = confirm(
      `Ce ticket contient ${sale.items.length} articles.\n\n` +
      `Voulez-vous :\n` +
      `• OK = Imprimer un résumé condensé (recommandé)\n` +
      `• Annuler = Imprimer tous les articles (ticket très long)`
    );
    
    if (userChoice) {
      printReceiptSummary(sale, store, settings, options);
      return;
    } else {
      const confirmLong = confirm(
        `⚠️ ATTENTION ⚠️\n\n` +
        `Le ticket complet fera environ ${Math.ceil(sale.items.length / 10)} mètres de long !\n\n` +
        `Cela consommera beaucoup de papier.\n` +
        `Êtes-vous sûr de vouloir continuer ?`
      );
      
      if (!confirmLong) return;
    }
  }
  
  printReceiptComplete(sale, store, settings, options);
};

// Fonction principale d'impression intelligente avec auto-print
export const printReceiptSmart = (sale: Sale, store?: Store | null, settings?: Settings) => {
  const autoPrint = settings?.printing?.autoPrint || false;
  const paperWidth = settings?.printing?.paperWidth || '80mm';
  const showBarcodes = settings?.printing?.showBarcodes || true;
  const promotionalMessages = settings?.printing?.promotionalMessages || [];
  
  const promotionalMessage = getRandomPromotionalMessage(promotionalMessages);
  
  const options: PrintOptions = {
    autoPrint,
    paperWidth,
    showBarcodes,
    promotionalMessage
  };
  
  if (autoPrint) {
    if (sale.items.length > 20) {
      printReceiptSummary(sale, store, settings, options);
    } else {
      printReceiptComplete(sale, store, settings, options);
    }
  } else {
    printReceipt(sale, store, settings, options);
  }
};

// Fonctions de compatibilité pour l'ancien code
export const printReceiptSummaryOnly = (sale: Sale, store?: Store | null, settings?: Settings) => {
  printReceiptSummary(sale, store, settings);
};

export const printReceiptOnly = (sale: Sale, store?: Store | null, settings?: Settings) => {
  printReceiptComplete(sale, store, settings);
};