import React, { useState, useEffect } from 'react';
import { useCustomers } from '../../hooks/useCustomers';
import { InvoiceType } from '../../types/invoice.types';

interface CustomerSelectorProps {
  invoiceType: InvoiceType;
  selectedCustomerId?: number;
  customerData: {
    name: string;
    ncc?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  onCustomerSelect: (customerId: number | undefined) => void;
  onCustomerDataChange: (data: any) => void;
  errors?: { [key: string]: string };
}

export function CustomerSelector({
  invoiceType,
  selectedCustomerId,
  customerData,
  onCustomerSelect,
  onCustomerDataChange,
  errors = {}
}: CustomerSelectorProps) {
  const { customers, loadCustomers } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    return (
      fullName.includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.includes(search) ||
      customer.ncc?.toLowerCase().includes(search)
    );
  });

  const handleCustomerSelect = (customer: any) => {
    const fullName = `${customer.firstName} ${customer.lastName}`;
    onCustomerSelect(customer.id);
    onCustomerDataChange({
      name: fullName,
      ncc: customer.ncc || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setSearchTerm(fullName);
    setShowDropdown(false);
    setIsManualEntry(false);
  };

  const handleManualEntry = () => {
    onCustomerSelect(undefined);
    setIsManualEntry(true);
    setShowDropdown(false);
  };

  const handleFieldChange = (field: string, value: string) => {
    onCustomerDataChange({
      ...customerData,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Client
        </label>
        <button
          type="button"
          onClick={handleManualEntry}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          + Nouveau client
        </button>
      </div>

      {/* Recherche de client existant */}
      {!isManualEntry && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Rechercher un client..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          {/* Dropdown des résultats */}
          {showDropdown && filteredCustomers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleCustomerSelect(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {customer.ncc && <div>NCC: {customer.ncc}</div>}
                    {customer.phone && <div>Tél: {customer.phone}</div>}
                    {customer.email && <div>Email: {customer.email}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulaire de saisie manuelle */}
      {(isManualEntry || selectedCustomerId) && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du client <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                errors['customerData.name'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nom complet ou raison sociale"
            />
            {errors['customerData.name'] && (
              <p className="mt-1 text-sm text-red-600">{errors['customerData.name']}</p>
            )}
          </div>

          {/* NCC (uniquement pour B2B) */}
          {invoiceType === 'B2B' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NCC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerData.ncc || ''}
                onChange={(e) => handleFieldChange('ncc', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors['customerData.ncc'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="CI-XXX-YYYY-X-NNNNN"
              />
              {errors['customerData.ncc'] && (
                <p className="mt-1 text-sm text-red-600">{errors['customerData.ncc']}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format: CI-XXX-YYYY-X-NNNNN (ex: CI-ABJ-2024-A-12345)
              </p>
            </div>
          )}

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone {invoiceType !== 'B2B' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              value={customerData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                errors['customerData.phone'] || errors['customerData.contact'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+225 XX XX XX XX XX"
            />
            {errors['customerData.phone'] && (
              <p className="mt-1 text-sm text-red-600">{errors['customerData.phone']}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {invoiceType !== 'B2B' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="email"
              value={customerData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                errors['customerData.email'] || errors['customerData.contact'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@example.com"
            />
            {errors['customerData.email'] && (
              <p className="mt-1 text-sm text-red-600">{errors['customerData.email']}</p>
            )}
            {errors['customerData.contact'] && !errors['customerData.email'] && !errors['customerData.phone'] && (
              <p className="mt-1 text-sm text-red-600">{errors['customerData.contact']}</p>
            )}
          </div>

          {/* Adresse (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <textarea
              value={customerData.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Adresse complète du client"
            />
          </div>

          {isManualEntry && (
            <button
              type="button"
              onClick={() => {
                setIsManualEntry(false);
                onCustomerSelect(undefined);
                onCustomerDataChange({
                  name: '',
                  ncc: '',
                  phone: '',
                  email: '',
                  address: ''
                });
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Retour à la recherche
            </button>
          )}
        </div>
      )}
    </div>
  );
}
