import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/invoiceCalculations';
import Spinner from '../Spinner';

interface InvoiceDetailsModalProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceDetailsModal({ invoiceId, onClose }: InvoiceDetailsModalProps) {
  const { user } = useAuth();
  const { currentInvoice, loading, fetchInvoiceDetails, downloadPDF, downloadCSV } = useInvoice();
  const { addToast } = useToast();

  useEffect(() => {
    if (user?.tenantId && user?.id && invoiceId) {
      fetchInvoiceDetails(invoiceId, user.tenantId, user.id);
    }
  }, [invoiceId, user]);

  const handleDownloadPDF = async () => {
    if (!user?.tenantId || !user?.id) return;

    try {
      await downloadPDF(invoiceId, user.tenantId, user.id);
      addToast('PDF téléchargé avec succès', 'success');
    } catch (error: any) {
      addToast(error.message || 'Erreur lors du téléchargement', 'error');
    }
  };

  const handleDownloadCSV = async () => {
    if (!user?.tenantId || !user?.id) return;

    try {
      await downloadCSV(invoiceId, user.tenantId, user.id);
      addToast('CSV téléchargé avec succès', 'success');
    } catch (error: any) {
      addToast(error.message || 'Erreur lors du téléchargement', 'error');
    }
  };

  const handlePrint = async () => {
    if (!user?.tenantId || !user?.id) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${API_BASE_URL}/api/invoices/${invoiceId}/pdf`;
      
      const response = await fetch(url, {
        headers: {
          'x-tenant-id': user.tenantId.toString(),
          'x-user-id': user.id.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du PDF');
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error: any) {
      addToast(error.message || 'Erreur lors de l\'impression', 'error');
    }
  };

  const getDocumentTitle = () => {
    if (!currentInvoice) return '';
    
    if (currentInvoice.documentSubtype === 'avoir') {
      return 'AVOIR';
    } else if (currentInvoice.documentSubtype === 'proforma') {
      return 'FACTURE PROFORMA';
    } else {
      return currentInvoice.documentType === 'invoice' ? 'FACTURE' : 'REÇU';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700">
          <h2 className="text-xl font-bold text-white">
            Détails - {getDocumentTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner />
            </div>
          ) : !currentInvoice ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p>Impossible de charger les détails</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mb-3">
                    Informations document
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Numéro:</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentInvoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Type:</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {currentInvoice.documentType === 'invoice' ? 'Facture' : 'Reçu'} - {currentInvoice.invoiceType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Date:</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatDate(currentInvoice.date)}
                      </span>
                    </div>
                    {currentInvoice.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Échéance:</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatDate(currentInvoice.dueDate)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Paiement:</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {currentInvoice.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mb-3">
                    Informations client
                  </h3>
                  <div className="space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {currentInvoice.customer.name}
                    </p>
                    {currentInvoice.customer.ncc && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">NCC:</span> {currentInvoice.customer.ncc}
                      </p>
                    )}
                    {currentInvoice.customer.address && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {currentInvoice.customer.address}
                      </p>
                    )}
                    {currentInvoice.customer.phone && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">Tél:</span> {currentInvoice.customer.phone}
                      </p>
                    )}
                    {currentInvoice.customer.email && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">Email:</span> {currentInvoice.customer.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Articles */}
              <div>
                <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mb-3">
                  Articles
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-200 dark:border-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                          Désignation
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                          Qté
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                          P.U. HT
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                          Remise
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                          Total HT
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                          TVA
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                          Total TTC
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {currentInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">
                            <div className="font-semibold">{item.productName}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{item.variantName}</div>
                          </td>
                          <td className="px-4 py-2 text-sm text-center text-slate-900 dark:text-white">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-slate-900 dark:text-white">
                            {formatCurrency(item.unitPriceHT)}
                          </td>
                          <td className="px-4 py-2 text-sm text-center text-slate-900 dark:text-white">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(item.totalHT)}
                          </td>
                          <td className="px-4 py-2 text-sm text-center text-slate-900 dark:text-white">
                            {item.tvaRate}%
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(item.totalTTC)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="flex justify-end">
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Sous-total HT:</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(currentInvoice.subtotalHT)}
                    </span>
                  </div>

                  {currentInvoice.totalDiscounts > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Remises:</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        - {formatCurrency(currentInvoice.totalDiscounts)}
                      </span>
                    </div>
                  )}

                  {currentInvoice.tvaSummary.map((tva, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        TVA {tva.rate}% (base: {formatCurrency(tva.base)}):
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(tva.amount)}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total TVA:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(currentInvoice.totalTVA)}
                    </span>
                  </div>

                  {currentInvoice.additionalTaxes.map((tax, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{tax.name}:</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(tax.amount)}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between py-3 bg-indigo-50 dark:bg-indigo-900/20 px-4 rounded-lg mt-3">
                    <span className="text-lg font-black text-slate-900 dark:text-white uppercase">
                      Total TTC:
                    </span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(currentInvoice.totalTTC)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message commercial */}
              {currentInvoice.commercialMessage && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border-l-4 border-indigo-600">
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                    {currentInvoice.commercialMessage}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Fermer
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
