import React from 'react';
import { InvoiceType, INVOICE_TYPE_OPTIONS } from '../../types/invoice.types';

interface InvoiceTypeSelectorProps {
  selectedType: InvoiceType;
  onChange: (type: InvoiceType) => void;
  disabled?: boolean;
}

export function InvoiceTypeSelector({ 
  selectedType, 
  onChange, 
  disabled = false 
}: InvoiceTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Type de facturation
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INVOICE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`
              relative flex items-start p-4 border-2 rounded-lg transition-all
              ${selectedType === option.value
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
                : 'border-gray-200 bg-white hover:border-indigo-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{option.icon}</span>
                <span className="font-semibold text-gray-900">
                  {option.label}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {option.description}
              </p>
            </div>
            
            {selectedType === option.value && (
              <div className="flex-shrink-0 ml-3">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Informations supplémentaires selon le type */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg
            className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            {selectedType === 'B2B' && (
              <p>
                Pour la facturation B2B, le <strong>NCC (Numéro de Compte Contribuable)</strong> du client est obligatoire.
                Format: CI-XXX-YYYY-X-NNNNN
              </p>
            )}
            {selectedType === 'B2C' && (
              <p>
                Pour la facturation B2C, le <strong>nom, téléphone et email</strong> du client sont obligatoires.
              </p>
            )}
            {selectedType === 'B2F' && (
              <p>
                Pour la facturation internationale, le <strong>nom, téléphone et email</strong> du client sont obligatoires.
              </p>
            )}
            {selectedType === 'B2G' && (
              <p>
                Pour la facturation administration publique, le <strong>nom, téléphone et email</strong> sont obligatoires.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
