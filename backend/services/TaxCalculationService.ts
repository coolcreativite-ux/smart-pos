/**
 * Service de calcul des taxes et totaux pour factures et reçus
 * Gère les taux de TVA ivoiriens: 0%, 9%, 18%
 * Gère les remises par article et globales
 * Gère les taxes additionnelles (timbre de quittance, etc.)
 */

export interface InvoiceItem {
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  quantity: number;
  unitPriceHT: number;
  discountPercent: number;
  tvaRate: 0 | 9 | 18;
}

export interface InvoiceItemWithTotals extends InvoiceItem {
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
}

export interface AdditionalTax {
  name: string;
  amount: number;
}

export interface TVASummary {
  rate: number;
  base: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotalHT: number;
  totalDiscounts: number;
  totalHTAfterDiscount: number;
  tvaSummary: TVASummary[];
  totalTVA: number;
  totalAdditionalTaxes: number;
  totalTTC: number;
  items: InvoiceItemWithTotals[];
}

export class TaxCalculationService {
  /**
   * Calcule le montant HT à partir du TTC et du taux de TVA
   */
  calculateHT(ttc: number, tvaRate: number): number {
    return this.round(ttc / (1 + tvaRate / 100));
  }

  /**
   * Calcule le montant de TVA à partir du HT et du taux
   */
  calculateTVA(ht: number, tvaRate: number): number {
    return this.round(ht * (tvaRate / 100));
  }

  /**
   * Applique une remise à un montant
   */
  applyDiscount(amount: number, discountPercent: number): number {
    return this.round(amount * (1 - discountPercent / 100));
  }

  /**
   * Arrondit un montant à 2 décimales
   */
  private round(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Calcule les totaux complets d'une facture
   * Applique les remises par article, puis la remise globale, puis calcule les taxes
   */
  calculateInvoiceTotals(
    items: InvoiceItem[],
    globalDiscountPercent: number,
    additionalTaxes: AdditionalTax[]
  ): InvoiceTotals {
    // 1. Calculer HT par article après remise article
    const itemsWithTotals: InvoiceItemWithTotals[] = items.map(item => {
      const htBeforeDiscount = item.quantity * item.unitPriceHT;
      const htAfterDiscount = this.applyDiscount(htBeforeDiscount, item.discountPercent);
      const tvaAmount = this.calculateTVA(htAfterDiscount, item.tvaRate);
      const ttc = htAfterDiscount + tvaAmount;

      return {
        ...item,
        totalHT: this.round(htAfterDiscount),
        tvaAmount: this.round(tvaAmount),
        totalTTC: this.round(ttc)
      };
    });

    // 2. Calculer subtotal HT (avant remise globale)
    const subtotalHT = this.round(
      itemsWithTotals.reduce((sum, item) => sum + item.totalHT, 0)
    );

    // 3. Appliquer remise globale
    const discountAmount = this.round(subtotalHT * (globalDiscountPercent / 100));
    const totalHTAfterGlobalDiscount = this.round(subtotalHT - discountAmount);

    // 4. Recalculer TVA après remise globale (proportionnellement)
    const discountRatio = subtotalHT > 0 ? totalHTAfterGlobalDiscount / subtotalHT : 1;
    const tvaSummary = this.calculateTVASummary(itemsWithTotals, discountRatio);

    // 5. Calculer total TVA
    const totalTVA = this.round(
      tvaSummary.reduce((sum, tva) => sum + tva.amount, 0)
    );

    // 6. Calculer total taxes additionnelles
    const totalAdditionalTaxes = this.round(
      additionalTaxes.reduce((sum, tax) => sum + tax.amount, 0)
    );

    // 7. Calculer total TTC
    const totalTTC = this.round(
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
   * Groupe et calcule la TVA par taux
   * Applique le ratio de remise globale à chaque article
   */
  calculateTVASummary(
    items: InvoiceItemWithTotals[],
    discountRatio: number
  ): TVASummary[] {
    const tvaByRate = new Map<number, { base: number; amount: number }>();

    items.forEach(item => {
      const adjustedHT = item.totalHT * discountRatio;
      const adjustedTVA = this.calculateTVA(adjustedHT, item.tvaRate);

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
        base: this.round(data.base),
        amount: this.round(data.amount)
      }))
      .sort((a, b) => a.rate - b.rate);
  }

  /**
   * Ajoute automatiquement le timbre de quittance si paiement en espèces
   * Montant: 100 FCFA (standard ivoirien)
   */
  addTimbreIfCash(
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
    }
    
    return additionalTaxes;
  }

  /**
   * Valide qu'un taux de TVA est valide pour la Côte d'Ivoire
   */
  isValidTVARate(rate: number): boolean {
    return [0, 9, 18].includes(rate);
  }

  /**
   * Calcule le montant TTC à partir du HT et du taux de TVA
   */
  calculateTTC(ht: number, tvaRate: number): number {
    return this.round(ht * (1 + tvaRate / 100));
  }
}
