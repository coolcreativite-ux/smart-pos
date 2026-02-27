import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProduct } from '../../contexts/ProductContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { useToast } from '../../contexts/ToastContext';
import {
  InvoiceFormData,
  InvoiceType,
  DocumentType,
  DocumentSubtype,
  PaymentMethod,
  InvoiceItemInput,
  AdditionalTax,
  PAYMENT_METHODS
} from '../../types/invoice.types';
import { InvoiceTypeSelector } from './InvoiceTypeSelector';
import { CustomerSelector } from './CustomerSelector';
import { InvoiceItemRow } from './InvoiceItemRow';
import { InvoiceTotalsDisplay } from './InvoiceTotalsDisplay';
import { InvoicePreview } from './InvoicePreview';
import { calculateInvoiceTotals, addTimbreIfCash } from '../../utils/invoiceCalculations';

interface InvoiceGeneratorProps {
  documentType: DocumentType;
  onClose: () => void;
  onSuccess?: (invoiceId: string) => void;
  prefilledData?: Partial<InvoiceFormData>;
}

export function InvoiceGenerator({
  documentType,
  onClose,
  onSuccess,
  prefilledData
}: InvoiceGeneratorProps) {
  const { user } = useAuth();
  const { products } = useProduct();
  const { createInvoice, loading } = useInvoice();
  const { addToast } = useToast();

  // État du formulaire
  const [formData, setFormData] = useState<InvoiceFormData>({
    documentType,
    invoiceType: 'B2C',
    documentSubtype: 'standard',
    customerId: undefined,
    customerData: {
      name: '',
      ncc: '',
      phone: '',
      email: '',
      address: ''
    },
    dueDate: undefined,
    paymentMethod: 'Espèces',
    items: [],
    globalDiscountPercent: 0,
    additionalTaxes: [],
    commercialMessage: '',
    ...prefilledData
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Calculer les totaux en temps réel avec debounce
  const totals = useMemo(() => {
    const taxesWithTimbre = addTimbreIfCash(
      formData.paymentMethod,
      formData.additionalTaxes
    );
    
    return calculateInvoiceTotals(
      formData.items,
      formData.globalDiscountPercent,
      taxesWithTimbre
    );
  }, [formData.items, formData.globalDiscountPercent, formData.additionalTaxes, formData.paymentMethod]);

  // Mettre à jour les taxes additionnelles quand le mode de paiement change
  useEffect(() => {
    const taxesWithTimbre = addTimbreIfCash(
      formData.paymentMethod,
      formData.additionalTaxes
    );
    
    if (JSON.stringify(taxesWithTimbre) !== JSON.stringify(formData.additionalTaxes)) {
      setFormData(prev => ({
        ...prev,
        additionalTaxes: taxesWithTimbre
      }));
    }
  }, [formData.paymentMethod]);

  /**
   * Gestion du changement de type de facturation
   */
  const handleInvoiceTypeChange = (invoiceType: InvoiceType) => {
    setFormData(prev => ({
      ...prev,
      invoiceType,
      customerData: {
        name: '',
        ncc: '',
        phone: '',
        email: '',
        address: ''
      }
    }));
    setErrors({});
  };

  /**
   * Gestion de la sélection de client
   */
  const handleCustomerSelect = (customerId: number | undefined) => {
    setFormData(prev => ({ ...prev, customerId }));
  };

  const handleCustomerDataChange = (data: any) => {
    setFormData(prev => ({
      ...prev,
      customerData: { ...prev.customerData, ...data }
    }));
  };

  /**
   * Gestion des articles
   */
  const handleAddItem = (product: any, variant: any) => {
    const newItem: InvoiceItemInput = {
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name || 'Standard',
      quantity: 1,
      unitPriceHT: variant.price || 0,
      discountPercent: 0,
      tvaRate: 18 // Taux par défaut
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowProductSelector(false);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItemInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  /**
   * Validation du formulaire
   */
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validation client
    if (!formData.customerData.name || formData.customerData.name.trim() === '' || formData.customerData.name === 'Client') {
      newErrors['customerData.name'] = 'Veuillez saisir le nom du client';
    }

    if (formData.invoiceType === 'B2B') {
      if (!formData.customerData.ncc || formData.customerData.ncc.trim() === '') {
        newErrors['customerData.ncc'] = 'NCC requis pour facturation B2B';
      }
    } else {
      // Pour B2C, B2F, B2G - au moins un moyen de contact requis
      const hasPhone = formData.customerData.phone && formData.customerData.phone.trim() !== '';
      const hasEmail = formData.customerData.email && formData.customerData.email.trim() !== '';
      
      if (!hasPhone && !hasEmail) {
        newErrors['customerData.contact'] = 'Veuillez saisir au moins un téléphone ou un email';
      }
    }

    // Validation articles
    if (formData.items.length === 0) {
      newErrors['items'] = 'Au moins un article requis';
    }

    formData.items.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`items[${index}].quantity`] = 'Quantité invalide';
      }
      if (item.unitPriceHT === undefined || item.unitPriceHT === null || item.unitPriceHT < 0) {
        newErrors[`items[${index}].unitPriceHT`] = 'Prix invalide';
      }
    });

    // Afficher un message plus explicite si c'est un problème de client
    if (newErrors['customerData.name'] || newErrors['customerData.contact'] || newErrors['customerData.ncc']) {
      console.warn('⚠️ [Validation] Informations client incomplètes');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Passer à la prévisualisation
   */
  const handlePreview = () => {
    if (!validateForm()) {
      addToast('Veuillez corriger les erreurs', 'error');
      return;
    }

    setShowPreview(true);
  };

  /**
   * Retour à l'édition depuis la prévisualisation
   */
  const handleBackToEdit = () => {
    setShowPreview(false);
  };

  /**
   * Succès de la génération
   */
  const handleGenerateSuccess = (invoiceId: string) => {
    if (onSuccess) {
      onSuccess(invoiceId);
    }
    onClose();
  };

  // Si on est en mode prévisualisation, afficher le composant de prévisualisation
  if (showPreview) {
    return (
      <InvoicePreview
        formData={formData}
        totals={totals}
        onBack={handleBackToEdit}
        onSuccess={handleGenerateSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700">
          <h2 className="text-2xl font-bold text-white">
            {documentType === 'invoice' ? 'Nouvelle Facture' : 'Nouveau Reçu'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Section 1: Type de facturation */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <InvoiceTypeSelector
                selectedType={formData.invoiceType}
                onChange={handleInvoiceTypeChange}
                disabled={loading}
              />
            </div>

            {/* Section 2: Informations générales */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations générales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sous-type de document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de document
                  </label>
                  <select
                    value={formData.documentSubtype}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      documentSubtype: e.target.value as DocumentSubtype
                    }))}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="avoir">Avoir (crédit)</option>
                    <option value="proforma">Proforma</option>
                  </select>
                </div>

                {/* Date d'échéance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dueDate: e.target.value ? new Date(e.target.value) : undefined
                    }))}
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de paiement <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      paymentMethod: e.target.value as PaymentMethod
                    }))}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  {formData.paymentMethod === 'Espèces' && (
                    <p className="mt-1 text-xs text-blue-600">
                      ℹ️ Timbre de quittance (100 FCFA) ajouté automatiquement
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Client */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <CustomerSelector
                invoiceType={formData.invoiceType}
                selectedCustomerId={formData.customerId}
                customerData={formData.customerData}
                onCustomerSelect={handleCustomerSelect}
                onCustomerDataChange={handleCustomerDataChange}
                errors={errors}
              />
            </div>

            {/* Section 4: Articles */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Articles
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProductSelector(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un article
                </button>
              </div>

              {errors['items'] && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors['items']}
                </div>
              )}

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <InvoiceItemRow
                    key={index}
                    item={item}
                    index={index}
                    onUpdate={handleUpdateItem}
                    onRemove={handleRemoveItem}
                    errors={errors}
                    readOnly={loading}
                  />
                ))}

                {formData.items.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>Aucun article ajouté</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter un article" pour commencer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Remise globale et taxes */}
            {formData.items.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Remises et taxes
                </h3>

                <div className="space-y-4">
                  {/* Remise globale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remise globale (%)
                    </label>
                    <input
                      type="number"
                      value={formData.globalDiscountPercent}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        globalDiscountPercent: parseFloat(e.target.value) || 0
                      }))}
                      disabled={loading}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Taxes additionnelles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxes additionnelles
                    </label>
                    <div className="space-y-2">
                      {formData.additionalTaxes.map((tax, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-1 text-sm font-medium text-gray-700">
                            {tax.name}
                          </span>
                          <span className="text-sm text-gray-900">
                            {tax.amount.toLocaleString('fr-FR')} FCFA
                          </span>
                          {tax.name !== 'Timbre de quittance' && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                additionalTaxes: prev.additionalTaxes.filter((_, i) => i !== index)
                              }))}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: Message commercial */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message commercial (optionnel)
              </label>
              <textarea
                value={formData.commercialMessage}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  commercialMessage: e.target.value
                }))}
                disabled={loading}
                rows={3}
                placeholder="Ex: Merci pour votre confiance..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Section 7: Totaux */}
            {formData.items.length > 0 && (
              <InvoiceTotalsDisplay totals={totals} />
            )}
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading || formData.items.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Prévisualiser
          </button>
        </div>
      </div>

      {/* Modal de sélection de produit */}
      {showProductSelector && (
        <ProductSelectorModal
          products={products}
          onSelect={handleAddItem}
          onClose={() => setShowProductSelector(false)}
        />
      )}
    </div>
  );
}

/**
 * Modal de sélection de produit
 */
interface ProductSelectorModalProps {
  products: any[];
  onSelect: (product: any, variant: any) => void;
  onClose: () => void;
}

function ProductSelectorModal({ products, onSelect, onClose }: ProductSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sélectionner un produit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{product.category}</p>
                
                <div className="space-y-2">
                  {product.variants?.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => onSelect(product, variant)}
                      className="w-full px-3 py-2 text-left border border-gray-200 rounded hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{variant.name || 'Standard'}</span>
                        <span className="text-sm text-indigo-600 font-semibold">
                          {variant.price?.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
