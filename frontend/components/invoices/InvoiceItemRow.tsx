import React from 'react';
import { InvoiceItemInput, TVA_RATES } from '../../types/invoice.types';

interface InvoiceItemRowProps {
  item: InvoiceItemInput;
  index: number;
  onUpdate: (index: number, field: keyof InvoiceItemInput, value: any) => void;
  onRemove: (index: number) => void;
  errors?: { [key: string]: string };
  readOnly?: boolean;
}

export function InvoiceItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  errors = {},
  readOnly = false
}: InvoiceItemRowProps) {
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Calculs en temps réel avec protection contre NaN
  const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
  const unitPriceHT = typeof item.unitPriceHT === 'number' && !isNaN(item.unitPriceHT) ? item.unitPriceHT : 0;
  const discountPercent = typeof item.discountPercent === 'number' && !isNaN(item.discountPercent) ? item.discountPercent : 0;
  const tvaRate = typeof item.tvaRate === 'number' && !isNaN(item.tvaRate) ? item.tvaRate : 18;

  const htBeforeDiscount = quantity * unitPriceHT;
  const discountAmount = htBeforeDiscount * (discountPercent / 100);
  const totalHT = htBeforeDiscount - discountAmount;
  const tvaAmount = totalHT * (tvaRate / 100);
  const totalTTC = totalHT + tvaAmount;

  return (
    <div className="grid grid-cols-12 gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* Numéro de ligne */}
      <div className="col-span-1 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
      </div>

      {/* Description du produit */}
      <div className="col-span-3">
        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
        <div className="text-xs text-gray-500">{item.variantName}</div>
      </div>

      {/* Quantité */}
      <div className="col-span-1">
        <label className="block text-xs text-gray-600 mb-1">Qté</label>
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          min="0"
          step="0.01"
          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 ${
            errors[`items[${index}].quantity`] ? 'border-red-500' : 'border-gray-300'
          } ${readOnly ? 'bg-gray-50' : ''}`}
        />
      </div>

      {/* Prix unitaire HT */}
      <div className="col-span-2">
        <label className="block text-xs text-gray-600 mb-1">Prix HT</label>
        <input
          type="number"
          value={item.unitPriceHT}
          onChange={(e) => onUpdate(index, 'unitPriceHT', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          min="0"
          step="1"
          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 ${
            errors[`items[${index}].unitPriceHT`] ? 'border-red-500' : 'border-gray-300'
          } ${readOnly ? 'bg-gray-50' : ''}`}
        />
      </div>

      {/* Remise % */}
      <div className="col-span-1">
        <label className="block text-xs text-gray-600 mb-1">Rem. %</label>
        <input
          type="number"
          value={item.discountPercent}
          onChange={(e) => onUpdate(index, 'discountPercent', parseFloat(e.target.value) || 0)}
          disabled={readOnly}
          min="0"
          max="100"
          step="0.1"
          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 ${
            errors[`items[${index}].discountPercent`] ? 'border-red-500' : 'border-gray-300'
          } ${readOnly ? 'bg-gray-50' : ''}`}
        />
      </div>

      {/* TVA % */}
      <div className="col-span-1">
        <label className="block text-xs text-gray-600 mb-1">TVA %</label>
        <select
          value={item.tvaRate}
          onChange={(e) => onUpdate(index, 'tvaRate', parseInt(e.target.value) as 0 | 9 | 18)}
          disabled={readOnly}
          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 ${
            errors[`items[${index}].tvaRate`] ? 'border-red-500' : 'border-gray-300'
          } ${readOnly ? 'bg-gray-50' : ''}`}
        >
          {TVA_RATES.map(rate => (
            <option key={rate} value={rate}>{rate}%</option>
          ))}
        </select>
      </div>

      {/* Total TTC (calculé) */}
      <div className="col-span-2">
        <label className="block text-xs text-gray-600 mb-1">Total TTC</label>
        <div className="px-2 py-1 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded border border-indigo-200">
          {formatCurrency(totalTTC)} F
        </div>
      </div>

      {/* Bouton supprimer */}
      {!readOnly && (
        <div className="col-span-1 flex items-end justify-center">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer cet article"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Détails des calculs (ligne complète en dessous) */}
      <div className="col-span-12 pt-2 border-t border-gray-100">
        <div className="flex gap-4 text-xs text-gray-600">
          <span>HT avant remise: {formatCurrency(htBeforeDiscount)} F</span>
          {item.discountPercent > 0 && (
            <span>Remise: -{formatCurrency(discountAmount)} F</span>
          )}
          <span>Total HT: {formatCurrency(totalHT)} F</span>
          <span>TVA ({item.tvaRate}%): {formatCurrency(tvaAmount)} F</span>
        </div>
      </div>

      {/* Erreurs */}
      {Object.keys(errors).some(key => key.startsWith(`items[${index}]`)) && (
        <div className="col-span-12 mt-2">
          {Object.entries(errors)
            .filter(([key]) => key.startsWith(`items[${index}]`))
            .map(([key, message]) => (
              <p key={key} className="text-sm text-red-600">{message}</p>
            ))}
        </div>
      )}
    </div>
  );
}
