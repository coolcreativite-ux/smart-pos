
import React from 'react';
import { Sale, Store, getVariantName } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useSettings } from '../contexts/SettingsContext';
import { useCustomers } from '../hooks/useCustomers';
import QRCodeGenerator from './QRCodeGenerator';
import { getRandomPromotionalMessage } from '../utils/printUtils';

interface PrintableReceiptProps {
  sale: Sale;
  store?: Store | null;
  paperWidth?: '58mm' | '80mm';
  showBarcodes?: boolean;
  promotionalMessage?: string;
  isSummary?: boolean;
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ 
  sale, 
  store, 
  paperWidth = '80mm',
  showBarcodes = true,
  promotionalMessage,
  isSummary = false
}) => {
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const { customers } = useCustomers();

  // Utiliser le message promotionnel fourni ou en sélectionner un aléatoire
  const finalPromotionalMessage = promotionalMessage || 
    getRandomPromotionalMessage(settings.printing?.promotionalMessages || []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Trouver le client si disponible
  const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;

  // Calculs financiers pour le reçu
  const sousTotal = sale.subtotal;
  const totalRemises = (sale.discount || 0) + (sale.loyaltyDiscount || 0);
  const montantHT = sousTotal - totalRemises;
  const montantTTC = sale.total;
  const tauxTVA = montantHT > 0 ? ((sale.tax / montantHT) * 100) : settings.taxRate;

  // Générer un ID court pour le ticket
  const ticketId = sale.id.substring(sale.id.length - 8).toUpperCase();
  
  // Données pour le QR code (JSON avec infos essentielles du ticket)
  const qrData = JSON.stringify({
    id: ticketId,
    date: sale.timestamp.toISOString().split('T')[0],
    total: sale.total,
    store: store?.name || settings.storeName,
    items: sale.items.length
  });

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            margin: 0;
            padding: 4mm;
            width: 80mm;
            background: white;
            font-family: 'Courier New', monospace;
          }
          body > *:not(#printable-receipt) {
            display: none !important;
          }
          #printable-receipt {
            display: block !important;
            width: 100%;
          }
          .receipt-line {
            border-bottom: 1px dashed #000;
            margin: 8px 0;
            padding-bottom: 4px;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 12px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 16px;
            border-top: 2px solid #000;
            padding-top: 8px;
          }
        }
      `}</style>
      
      <div id="printable-receipt" className="bg-white text-black font-mono text-[10px] leading-tight max-w-[80mm] mx-auto p-4">
      
      {/* Header: Logo, Nom, Adresse */}
      <div className="receipt-header">
        {settings.storeLogoUrl && (
          <div className="flex justify-center mb-3">
            <img 
              src={settings.storeLogoUrl} 
              alt="Logo du magasin" 
              className="w-20 h-20 object-contain grayscale contrast-150" 
              style={{ filter: 'brightness(0) contrast(2)' }} 
            />
          </div>
        )}
        <h1 className="text-sm font-black uppercase tracking-wider mb-1">{settings.storeName}</h1>
        {store && (
          <div className="text-[9px] leading-relaxed">
            <p className="font-bold uppercase">{store.name}</p>
            {store.location && <p>{store.location}</p>}
            {store.phone && <p>Tél: {store.phone}</p>}
          </div>
        )}
        <div className="mt-2 text-[8px]">
          <p>================================</p>
        </div>
      </div>

      {/* Info Vente: N° Ticket, Horodatage, Client */}
      <div className="receipt-line text-[9px] space-y-1">
        <div className="flex justify-between">
          <span className="font-bold">N° TICKET:</span>
          <span className="font-bold">{ticketId}</span>
        </div>
        <div className="flex justify-between">
          <span>Date/Heure:</span>
          <span>{formatDate(sale.timestamp)}</span>
        </div>
        <div className="flex justify-between">
          <span>Caissier:</span>
          <span className="uppercase">{sale.user.username}</span>
        </div>
        {customer && (
          <div className="flex justify-between">
            <span>Client:</span>
            <span className="uppercase">{customer.firstName} {customer.lastName}</span>
          </div>
        )}
        {sale.isCredit && (
          <div className="flex justify-between font-bold">
            <span>MODE:</span>
            <span>VENTE À CRÉDIT</span>
          </div>
        )}
      </div>

      {/* Table des articles */}
      <div className="mb-4">
        <div className="text-[8px] font-bold mb-2 text-center">
          ================================
        </div>
        
        {sale.items.map((item, idx) => (
          <div key={idx} className="mb-3 text-[9px]">
            {/* Nom du produit */}
            <div className="font-bold uppercase leading-tight">
              {item.productName}
            </div>
            
            {/* Variante si différente */}
            {item.variantName && item.variantName !== 'Standard' && (
              <div className="text-[8px] text-gray-600 italic">
                {item.variantName}
              </div>
            )}
            
            {/* Ligne de détail: Qté x Prix = Total */}
            <div className="flex justify-between items-center mt-1">
              <span>{item.quantity} x {formatCurrency(item.variant.price)}</span>
              <span className="font-bold">{formatCurrency(item.variant.price * item.quantity)}</span>
            </div>
            
            {/* Retours partiels si applicable */}
            {item.returnedQuantity && item.returnedQuantity > 0 && (
              <div className="text-[8px] text-red-600 mt-1">
                Retourné: {item.returnedQuantity} x {formatCurrency(item.variant.price)} = -{formatCurrency(item.variant.price * item.returnedQuantity)}
              </div>
            )}
            
            {/* Ligne de séparation entre articles */}
            {idx < sale.items.length - 1 && (
              <div className="text-[8px] text-center mt-2">- - - - - - - - - - - - - - - -</div>
            )}
          </div>
        ))}
        
        <div className="text-[8px] font-bold text-center">
          ================================
        </div>
      </div>

      {/* Récapitulatif financier */}
      <div className="space-y-1 text-[9px]">
        <div className="flex justify-between">
          <span>SOUS-TOTAL:</span>
          <span>{formatCurrency(sousTotal)}</span>
        </div>
        
        {/* Remises détaillées */}
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Remise {sale.promoCode ? `(${sale.promoCode})` : 'manuelle'}:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        
        {sale.loyaltyDiscount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Remise fidélité ({sale.loyaltyPointsUsed} pts):</span>
            <span>-{formatCurrency(sale.loyaltyDiscount)}</span>
          </div>
        )}
        
        {totalRemises > 0 && (
          <div className="flex justify-between font-bold">
            <span>TOTAL REMISES:</span>
            <span>-{formatCurrency(totalRemises)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>MONTANT HT:</span>
          <span>{formatCurrency(montantHT)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>TVA ({tauxTVA.toFixed(1)}%):</span>
          <span>{formatCurrency(sale.tax)}</span>
        </div>

        {/* Ligne de séparation avant total */}
        <div className="border-t-2 border-black pt-2 mt-2">
          <div className="flex justify-between font-black text-xs uppercase">
            <span>TOTAL TTC:</span>
            <span>{formatCurrency(montantTTC)}</span>
          </div>
        </div>
      </div>

      {/* Informations de paiement */}
      <div className="receipt-line text-[9px] space-y-1">
        <div className="flex justify-between">
          <span>MODE DE PAIEMENT:</span>
          <span className="uppercase font-bold">
            {sale.paymentMethod === 'cash' ? 'ESPÈCES' : 
             sale.paymentMethod === 'card' ? 'CARTE' : 'CRÉDIT'}
          </span>
        </div>
        
        {sale.isCredit ? (
          <>
            <div className="flex justify-between">
              <span>Montant payé:</span>
              <span>{formatCurrency(sale.totalPaid)}</span>
            </div>
            <div className="flex justify-between font-bold text-red-600">
              <span>RESTE À PAYER:</span>
              <span>{formatCurrency(sale.total - sale.totalPaid)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <span>Montant payé:</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
        )}
      </div>

      {/* Programme de fidélité */}
      {(sale.loyaltyPointsEarned > 0 || customer) && (
        <div className="receipt-line text-[9px] text-center space-y-1">
          <p className="font-bold uppercase">PROGRAMME FIDÉLITÉ</p>
          {sale.loyaltyPointsEarned > 0 && (
            <p>Points gagnés: <span className="font-bold">+{sale.loyaltyPointsEarned}</span></p>
          )}
          {customer && (
            <p>Points disponibles: <span className="font-bold">{customer.loyaltyPoints}</span></p>
          )}
        </div>
      )}

      {/* Avertissements et conditions */}
      {sale.isCredit && (
        <div className="text-[8px] text-center mt-4 p-2 border border-black">
          <p className="font-bold uppercase">ATTENTION - VENTE À CRÉDIT</p>
          <p>Ce ticket fait office de reconnaissance de dette.</p>
          <p>Conservez-le précieusement.</p>
        </div>
      )}

      {/* Footer */}
      <div className="receipt-footer text-[8px] space-y-1">
        <p className="font-bold text-xs uppercase">MERCI DE VOTRE VISITE !</p>
        <p>Conservez votre ticket pour tout échange ou retour.</p>
        <p>Les articles vendus ne sont ni repris ni échangés sans ce ticket.</p>
        
        {/* Informations légales et personnalisables */}
        <div className="mt-3 text-[7px] opacity-70 space-y-1">
          <p>TVA incluse - Prix TTC</p>
          <p>Ticket généré le {formatDate(new Date())}</p>
          {store?.phone && <p>Service client: {store.phone}</p>}
          <p className="font-mono">Powered by Smart POS v2.0</p>
        </div>
        
        {/* QR Code avec infos du ticket */}
        <div className="mt-4 flex justify-center">
          <div className="flex flex-col items-center">
            <QRCodeGenerator 
              value={qrData} 
              size={48} 
              className="mb-1"
            />
            <p className="text-[6px] opacity-70">#{ticketId}</p>
          </div>
        </div>
      </div>
      
      {/* Espace pour découpe */}
      <div className="h-8 text-center text-[6px] opacity-50 flex items-center justify-center">
        ✂ - - - - - - - - - - - - - - - - - - - - ✂
      </div>
    </div>
    </>
  );
};

export default PrintableReceipt;
