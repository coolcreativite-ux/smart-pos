import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { useCustomers } from '../../hooks/useCustomers';
import { useToast } from '../../contexts/ToastContext';
import {
  InvoiceFormData,
  InvoiceTotals,
  INVOICE_TYPE_OPTIONS
} from '../../types/invoice.types';
import { formatCurrency, formatDate } from '../../utils/invoiceCalculations';

interface InvoicePreviewProps {
  formData: InvoiceFormData;
  totals: InvoiceTotals;
  onBack: () => void;
  onSuccess: (invoiceId: string) => void;
}

export function InvoicePreview({
  formData,
  totals,
  onBack,
  onSuccess
}: InvoicePreviewProps) {
  const { user } = useAuth();
  const invoiceContext = useInvoice();
  const { createInvoice } = invoiceContext;
  const { customers, addCustomer, loadCustomers } = useCustomers();
  const { addToast } = useToast();
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Récupérer les infos de l'entreprise depuis le contexte utilisateur
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const companyInfo = {
    name: user?.tenant?.name || 'Nom de l\'entreprise',
    ncc: user?.tenant?.ncc || '',
    rccm: user?.tenant?.rccm || '',
    address: user?.tenant?.address || '',
    phone: user?.tenant?.phone || '',
    email: user?.tenant?.email || '',
    logo: user?.tenant?.logo_url ? `${API_BASE_URL}${user.tenant.logo_url}` : ''
  };

  // Déterminer le titre du document
  const getDocumentTitle = () => {
    if (formData.documentSubtype === 'avoir') {
      return 'AVOIR';
    } else if (formData.documentSubtype === 'proforma') {
      return 'FACTURE PROFORMA';
    } else {
      return formData.documentType === 'invoice' ? 'FACTURE' : 'REÇU';
    }
  };

  // Récupérer le label du type de facturation
  const getInvoiceTypeLabel = () => {
    const option = INVOICE_TYPE_OPTIONS.find(opt => opt.value === formData.invoiceType);
    return option?.label || formData.invoiceType;
  };

  /**
   * Génère la facture finale
   */
  const handleGenerate = async () => {
    if (!user?.tenantId || !user?.id) {
      addToast('Erreur d\'authentification', 'error');
      return;
    }

    setGenerating(true);

    try {
      let finalFormData = { ...formData };

      // Si pas de customerId, créer automatiquement le client
      if (!formData.customerId && formData.customerData.name) {
        console.log('🔍 [InvoicePreview] Création automatique du client:', formData.customerData);
        
        // Vérifier si le client existe déjà
        await loadCustomers();
        
        let existingCustomer = null;
        
        // Pour B2B, chercher par NCC
        if (formData.invoiceType === 'B2B' && formData.customerData.ncc) {
          existingCustomer = customers.find(c => c.ncc === formData.customerData.ncc);
        }
        // Pour B2C/B2F/B2G, chercher par téléphone ou email
        else {
          if (formData.customerData.phone) {
            existingCustomer = customers.find(c => c.phone === formData.customerData.phone);
          }
          if (!existingCustomer && formData.customerData.email) {
            existingCustomer = customers.find(c => c.email === formData.customerData.email);
          }
        }

        if (existingCustomer) {
          console.log('✅ [InvoicePreview] Client existant trouvé:', existingCustomer.id);
          finalFormData = {
            ...finalFormData,
            customerId: existingCustomer.id
          };
        } else {
          // Créer le nouveau client
          const [firstName, ...lastNameParts] = formData.customerData.name.split(' ');
          const lastName = lastNameParts.join(' ') || firstName;
          
          const newCustomer = addCustomer({
            firstName: firstName,
            lastName: lastName,
            email: formData.customerData.email || undefined,
            phone: formData.customerData.phone || undefined,
            ncc: formData.customerData.ncc || undefined,
            address: formData.customerData.address || undefined,
            storeId: user.assignedStoreId
          });
          
          console.log('✅ [InvoicePreview] Nouveau client créé:', newCustomer.id);
          
          finalFormData = {
            ...finalFormData,
            customerId: newCustomer.id
          };
          
          addToast('Client créé et ajouté à votre liste', 'success');
        }
      }

      // Nettoyer les tempId avant d'envoyer au backend
      const cleanedFormData = {
        ...finalFormData,
        items: finalFormData.items.map(({ tempId, ...item }) => item),
        additionalTaxes: finalFormData.additionalTaxes.map(({ tempId, ...tax }) => tax)
      };

      const result = await createInvoice(cleanedFormData, user.tenantId, user.id);
      
      addToast(
        `${getDocumentTitle()} créé${formData.documentType === 'invoice' ? 'e' : ''} avec succès!`,
        'success'
      );

      onSuccess(result.invoice.id);
    } catch (error: any) {
      addToast(error.message || 'Erreur lors de la génération', 'error');
      setGenerating(false);
    }
  };

  /**
   * Affiche un avertissement si les infos entreprise sont incomplètes
   */
  const hasIncompleteCompanyInfo = !companyInfo.ncc || !companyInfo.address;

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 overflow-auto">
      {/* Header avec actions */}
      <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à l'édition
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Prévisualisation - {getDocumentTitle()}
            </h1>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Génération en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmer et générer
              </>
            )}
          </button>
        </div>

        {/* Avertissement infos entreprise incomplètes */}
        {hasIncompleteCompanyInfo && (
          <div className="max-w-5xl mx-auto px-6 pb-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Informations entreprise incomplètes
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {!companyInfo.ncc && 'Le NCC de votre entreprise n\'est pas renseigné. '}
                  {!companyInfo.address && 'L\'adresse de votre entreprise n\'est pas renseignée. '}
                  Vous pouvez quand même générer le document, mais il est recommandé de compléter ces informations dans les paramètres.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prévisualisation du document */}
      <div className="max-w-5xl mx-auto p-6">
        <div
          ref={previewRef}
          className="bg-white shadow-2xl rounded-lg overflow-hidden"
          style={{ minHeight: '297mm' }} // A4 height
        >
          {/* En-tête du document */}
          <div className="border-b-4 border-indigo-600 p-8">
            <div className="flex items-start justify-between mb-6">
              {/* Logo et infos entreprise */}
              <div className="flex-1">
                {companyInfo.logo && (
                  <img
                    src={companyInfo.logo}
                    alt="Logo"
                    className="h-16 mb-4 object-contain"
                  />
                )}
                <h2 className="text-2xl font-black text-slate-900 mb-2">
                  {companyInfo.name}
                </h2>
                {companyInfo.ncc && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">NCC:</span> {companyInfo.ncc}
                  </p>
                )}
                {companyInfo.rccm && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">RCCM:</span> {companyInfo.rccm}
                  </p>
                )}
                {companyInfo.address && (
                  <p className="text-sm text-slate-600">{companyInfo.address}</p>
                )}
                {companyInfo.phone && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Tél:</span> {companyInfo.phone}
                  </p>
                )}
                {companyInfo.email && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Email:</span> {companyInfo.email}
                  </p>
                )}
              </div>

              {/* Type de document */}
              <div className="text-right">
                <div className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg">
                  <h1 className="text-2xl font-black uppercase tracking-wide">
                    {getDocumentTitle()}
                  </h1>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  {getInvoiceTypeLabel()}
                </p>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="p-8 grid grid-cols-2 gap-8">
            {/* Informations document - À GAUCHE */}
            <div>
              <h3 className="text-sm font-black text-slate-500 uppercase mb-3">
                Informations document
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Numéro:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    (Sera généré)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Type:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {getDocumentTitle()} - {formData.invoiceType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Date:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatDate(new Date())}
                  </span>
                </div>
                {formData.dueDate ? (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Échéance:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDate(formData.dueDate)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Validité:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      Immédiate
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Paiement:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formData.paymentMethod}
                  </span>
                </div>
                {user && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Vendeur:</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                    {user.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Email:</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {user.email}
                        </span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Tél:</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {user.phone}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Informations client - À DROITE */}
            <div>
              <h3 className="text-sm font-black text-slate-500 uppercase mb-3">
                Informations client
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="font-bold text-slate-900">{formData.customerData.name}</p>
                {formData.customerData.ncc && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">NCC:</span> {formData.customerData.ncc}
                  </p>
                )}
                {formData.customerData.address && (
                  <p className="text-sm text-slate-600">{formData.customerData.address}</p>
                )}
                {formData.customerData.phone && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Tél:</span> {formData.customerData.phone}
                  </p>
                )}
                {formData.customerData.email && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Email:</span> {formData.customerData.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Table des articles */}
          <div className="px-8 pb-8">
            <h3 className="text-sm font-black text-slate-500 uppercase mb-3">
              Détail des articles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black text-slate-700 uppercase border-b border-slate-200">
                      Désignation
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-slate-700 uppercase border-b border-slate-200">
                      Qté
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-700 uppercase border-b border-slate-200">
                      P.U. HT
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-slate-700 uppercase border-b border-slate-200">
                      Remise
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-700 uppercase border-b border-slate-200">
                      Total HT
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black text-slate-700 uppercase border-b border-slate-200">
                      TVA
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-700 uppercase border-b border-slate-200">
                      Total TTC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {totals.items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-xs text-slate-600">{item.variantName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {formatCurrency(item.unitPriceHT)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-900">
                        {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                        {formatCurrency(item.totalHT)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-900">
                        {item.tvaRate}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                        {formatCurrency(item.totalTTC)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section totaux */}
          <div className="px-8 pb-8">
            <div className="flex justify-end">
              <div className="w-full max-w-md space-y-3">
                {/* Subtotal HT */}
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-600">Sous-total HT:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(totals.subtotalHT)}
                  </span>
                </div>

                {/* Remise globale */}
                {formData.globalDiscountPercent > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">
                      Remise globale ({formData.globalDiscountPercent}%):
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      - {formatCurrency(totals.totalDiscounts)}
                    </span>
                  </div>
                )}

                {/* Total HT après remise */}
                {formData.globalDiscountPercent > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Total HT après remise:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(totals.totalHTAfterDiscount)}
                    </span>
                  </div>
                )}

                {/* Détail TVA par taux */}
                {totals.tvaSummary.map((tva, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">
                      TVA {tva.rate}% (base: {formatCurrency(tva.base)}):
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(tva.amount)}
                    </span>
                  </div>
                ))}

                {/* Total TVA */}
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Total TVA:</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(totals.totalTVA)}
                  </span>
                </div>

                {/* Taxes additionnelles */}
                {formData.additionalTaxes.map((tax, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">{tax.name}:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(tax.amount)}
                    </span>
                  </div>
                ))}

                {/* Total TTC */}
                <div className="flex justify-between py-4 bg-indigo-50 px-4 rounded-lg mt-4">
                  <span className="text-lg font-black text-slate-900 uppercase">
                    Total TTC:
                  </span>
                  <span className="text-2xl font-black text-indigo-600">
                    {formatCurrency(totals.totalTTC)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message commercial */}
          {formData.commercialMessage && (
            <div className="px-8 pb-8">
              <div className="bg-slate-50 rounded-lg p-6 border-l-4 border-indigo-600">
                <p className="text-sm text-slate-700 italic">
                  {formData.commercialMessage}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-slate-100 px-8 py-6 text-center border-t border-slate-200">
            <p className="text-xs text-slate-600">
              Document généré le {formatDate(new Date())} par {companyInfo.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
