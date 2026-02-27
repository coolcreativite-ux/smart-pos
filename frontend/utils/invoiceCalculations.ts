import {
  InvoiceItemInput,
  InvoiceItemWithTotals,
  InvoiceTotals,
  TVASummary,
  AdditionalTax
} from '../frontend/types/invoice.types';

/**
 * Utilitaires de calcul pour les factures (côté frontend)
 * Réplique la logique du TaxCalculationService backend
 */

/**
 * Arrondit un montant à 2 décimales
 */
function round(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calcule le montant HT à partir du TTC et du taux de TVA
 */
export function calculateHT(ttc: number, tvaRate: number): number {
  return round(ttc / (1 + tvaRate / 100));
}

/**
 * Calcule le montant de TVA à partir du HT et du taux
 */
export function calculateTVA(ht: number, tvaRate: number): number {
  return round(ht * (tvaRate / 100));
}

/**
 * Applique une remise à un montant
 */
export function applyDiscount(amount: number, discountPercent: number): number {
  return round(amount * (1 - discountPercent / 100));
}

/**
 * Calcule le montant TTC à partir du HT et du taux de TVA
 */
export function calculateTTC(ht: number, tvaRate: number): number {
  return round(ht * (1 + tvaRate / 100));
}

/**
 * Calcule les totaux d'un article
 */
export function calculateItemTotals(item: InvoiceItemInput): InvoiceItemWithTotals {
  const htBeforeDiscount = item.quantity * item.unitPriceHT;
  const htAfterDiscount = applyDiscount(htBeforeDiscount, item.discountPercent);
  const tvaAmount = calculateTVA(htAfterDiscount, item.tvaRate);
  const ttc = htAfterDiscount + tvaAmount;

  return {
    ...item,
    totalHT: round(htAfterDiscount),
    tvaAmount: round(tvaAmount),
    totalTTC: round(ttc)
  };
}

/**
 * Groupe et calcule la TVA par taux
 */
function calculateTVASummary(
  items: InvoiceItemWithTotals[],
  discountRatio: number
): TVASummary[] {
  const tvaByRate = new Map<number, { base: number; amount: number }>();

  items.forEach(item => {
    const adjustedHT = item.totalHT * discountRatio;
    const adjustedTVA = calculateTVA(adjustedHT, item.tvaRate);

    if (tvaByRate.has(item.tvaRate)) {
      const current = tvaByRate.get(item.tvaRate)!;
      tvaByRate.set(item.tvaRate, {
        base: current.base + adjustedHT,
        amount: current.amount + adjustedTVA
      });
    } else {
      tvaByRate.set(item.tvaRate, {
        base: adjustedHT,
        amount: adjustedTVA
      });
    }
  });

  return Array.from(tvaByRate.entries())
    .map(([rate, data]) => ({
      rate,
      base: round(data.base),
      amount: round(data.amount)
    }))
    .sort((a, b) => a.rate - b.rate);
}

/**
 * Calcule les totaux complets d'une facture
 */
export function calculateInvoiceTotals(
  items: InvoiceItemInput[],
  globalDiscountPercent: number,
  additionalTaxes: AdditionalTax[]
): InvoiceTotals {
  // 1. Calculer les totaux par article
  const itemsWithTotals = items.map(item => calculateItemTotals(item));

  // 2. Calculer subtotal HT (avant remise globale)
  const subtotalHT = round(
    itemsWithTotals.reduce((sum, item) => sum + item.totalHT, 0)
  );

  // 3. Appliquer remise globale
  const discountAmount = round(subtotalHT * (globalDiscountPercent / 100));
  const totalHTAfterGlobalDiscount = round(subtotalHT - discountAmount);

  // 4. Recalculer TVA après remise globale (proportionnellement)
  const discountRatio = subtotalHT > 0 ? totalHTAfterGlobalDiscount / subtotalHT : 1;
  const tvaSummary = calculateTVASummary(itemsWithTotals, discountRatio);

  // 5. Calculer total TVA
  const totalTVA = round(
    tvaSummary.reduce((sum, tva) => sum + tva.amount, 0)
  );

  // 6. Calculer total taxes additionnelles
  const totalAdditionalTaxes = round(
    additionalTaxes.reduce((sum, tax) => sum + tax.amount, 0)
  );

  // 7. Calculer total TTC
  const totalTTC = round(
    totalHTAfterGlobalDiscount + totalTVA + totalAdditionalTaxes
  );

  return {
    subtotalHT,
    totalDiscounts: discountAmount,
    totalHTAfterDiscount: totalHTAfterGlobalDiscount,
    tvaSummary,
    totalTVA,
    totalAdditionalTaxes,
    totalTTC,
    items: itemsWithTotals
  };
}

/**
 * Ajoute automatiquement le timbre de quittance si paiement en espèces
 */
export function addTimbreIfCash(
  paymentMethod: string,
  additionalTaxes: AdditionalTax[]
): AdditionalTax[] {
  if (paymentMethod === 'Espèces') {
    const hasTimbre = additionalTaxes.some(
      tax => tax.name === 'Timbre de quittance'
    );
    
    if (!hasTimbre) {
      return [
        ...additionalTaxes,
        { name: 'Timbre de quittance', amount: 100 }
      ];
    }
  } else {
    // Retirer le timbre si le mode de paiement n'est plus espèces
    return additionalTaxes.filter(tax => tax.name !== 'Timbre de quittance');
  }
  
  return additionalTaxes;
}

/**
 * Formate un montant en FCFA
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`;
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
