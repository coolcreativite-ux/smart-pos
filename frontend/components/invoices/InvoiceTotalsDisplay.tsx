import React from 'react';
import { InvoiceTotals } from '../../types/invoice.types';

interface InvoiceTotalsDisplayProps {
  totals: InvoiceTotals;
  className?: string;
}

export function InvoiceTotalsDisplay({ totals, className = '' }: InvoiceTotalsDisplayProps) {
  const formatCurrency = (amount: number): string => {
    // Protection contre NaN
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `${validAmount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`;
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Totaux</h3>
      
      <div className="space-y-3">
        {/* Total HT */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total HT</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(totals.subtotalHT)}
          </span>
        </div>

        {/* Remises */}
        {totals.totalDiscounts > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remises</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(totals.totalDiscounts)}
            </span>
          </div>
        )}

        {/* Ligne de séparation */}
        {totals.totalDiscounts > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total HT après remise</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totals.totalHTAfterDiscount)}
              </span>
            </div>
          </div>
        )}

        {/* TVA par taux */}
        <div className="border-t border-gray-200 pt-3 space-y-2">
          {totals.tvaSummary.map((tva) => (
            <div key={tva.rate} className="flex justify-between text-sm">
              <span className="text-gray-600">
                TVA {tva.rate}% (base: {formatCurrency(tva.base)})
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(tva.amount)}
              </span>
            </div>
          ))}
          
          {/* Total TVA */}
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-300">
            <span className="text-gray-700">Total TVA</span>
            <span className="text-gray-900">
              {formatCurrency(totals.totalTVA)}
            </span>
          </div>
        </div>

        {/* Taxes additionnelles */}
        {totals.totalAdditionalTaxes > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Autres taxes</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totals.totalAdditionalTaxes)}
              </span>
            </div>
          </div>
        )}

        {/* Total TTC */}
        <div className="border-t-2 border-gray-300 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total TTC</span>
            <span className="text-2xl font-bold text-indigo-600">
              {formatCurrency(totals.totalTTC)}
            </span>
          </div>
        </div>
      </div>

      {/* Détails des calculs (optionnel, pour debug) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            Détails des calculs
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(totals, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
