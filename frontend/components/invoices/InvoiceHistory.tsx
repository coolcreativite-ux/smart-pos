import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Invoice,
  InvoiceFilters,
  DocumentType,
  InvoiceType
} from '../../types/invoice.types';
import { formatCurrency, formatDate } from '../../utils/invoiceCalculations';
import Spinner from '../Spinner';

interface InvoiceHistoryProps {
  onViewDetails?: (invoiceId: string) => void;
}

export function InvoiceHistory({ onViewDetails }: InvoiceHistoryProps) {
  const { user } = useAuth();
  const { invoices, pagination, loading, error, fetchInvoices, downloadPDF, downloadCSV } = useInvoice();
  const { addToast } = useToast();

  // État des filtres
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Charger les factures au montage et quand les filtres changent
  useEffect(() => {
    console.log('🔍 [InvoiceHistory] useEffect déclenché');
    console.log('🔍 [InvoiceHistory] User:', user);
    
    // Gérer les deux formats: camelCase (tenantId) et snake_case (tenant_id)
    const tenantId = user?.tenantId || (user as any)?.tenant_id;
    const userId = user?.id;
    
    console.log('🔍 [InvoiceHistory] TenantId:', tenantId);
    console.log('🔍 [InvoiceHistory] UserId:', userId);
    
    if (tenantId && userId) {
      console.log('🔍 [InvoiceHistory] Appel fetchInvoices avec:', { tenantId, userId, currentPage, filters });
      fetchInvoices(tenantId, userId, currentPage, filters);
    }
  }, [user, currentPage, filters, fetchInvoices]);

  /**
   * Gestion des filtres
   */
  const handleFilterChange = (field: keyof InvoiceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
    setCurrentPage(1); // Retour à la première page
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  /**
   * Téléchargement de fichiers
   */
  const handleDownloadPDF = async (invoiceId: string) => {
    // Gérer les deux formats: camelCase (tenantId) et snake_case (tenant_id)
    const tenantId = user?.tenantId || (user as any)?.tenant_id;
    const userId = user?.id;
    
    if (!tenantId || !userId) return;

    try {
      await downloadPDF(invoiceId, tenantId, userId);
      addToast('PDF téléchargé avec succès', 'success');
    } catch (error: any) {
      addToast(error.message || 'Erreur lors du téléchargement', 'error');
    }
  };

  const handleDownloadCSV = async (invoiceId: string) => {
    // Gérer les deux formats: camelCase (tenantId) et snake_case (tenant_id)
    const tenantId = user?.tenantId || (user as any)?.tenant_id;
    const userId = user?.id;
    
    if (!tenantId || !userId) return;

    try {
      await downloadCSV(invoiceId, tenantId, userId);
      addToast('CSV téléchargé avec succès', 'success');
    } catch (error: any) {
      addToast(error.message || 'Erreur lors du téléchargement', 'error');
    }
  };

  /**
   * Impression PDF
   */
  const handlePrintPDF = async (invoiceId: string) => {
    // Gérer les deux formats: camelCase (tenantId) et snake_case (tenant_id)
    const tenantId = user?.tenantId || (user as any)?.tenant_id;
    const userId = user?.id;
    
    if (!tenantId || !userId) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = `${API_BASE_URL}/api/invoices/${invoiceId}/pdf`;
      
      const response = await fetch(url, {
        headers: {
          'x-tenant-id': tenantId.toString(),
          'x-user-id': userId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du PDF');
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      
      // Ouvrir dans une nouvelle fenêtre pour impression
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

  /**
   * Pagination
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Affichage de {((currentPage - 1) * pagination.limit) + 1} à{' '}
          {Math.min(currentPage * pagination.limit, pagination.total)} sur {pagination.total} résultats
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                1
              </button>
              {startPage > 2 && <span className="text-slate-400">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border rounded-lg text-sm ${
                page === currentPage
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="text-slate-400">...</span>}
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {pagination.totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barre de filtres */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Filtres de recherche
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg">
                {Object.values(filters).filter(v => v !== undefined && v !== '').length} actif(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Réinitialiser
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Plage de dates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={filters.startDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={filters.endDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Nom du client */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={filters.customerName || ''}
                  onChange={(e) => handleFilterChange('customerName', e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Numéro de facture */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Numéro de document
                </label>
                <input
                  type="text"
                  value={filters.invoiceNumber || ''}
                  onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
                  placeholder="Ex: 2025-00001"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Type de document */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type de document
                </label>
                <select
                  value={filters.documentType || ''}
                  onChange={(e) => handleFilterChange('documentType', e.target.value as DocumentType)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tous</option>
                  <option value="invoice">Facture</option>
                  <option value="receipt">Reçu</option>
                </select>
              </div>

              {/* Type de facturation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Type de facturation
                </label>
                <select
                  value={filters.invoiceType || ''}
                  onChange={(e) => handleFilterChange('invoiceType', e.target.value as InvoiceType)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tous</option>
                  <option value="B2B">B2B - Entreprise</option>
                  <option value="B2C">B2C - Particulier</option>
                  <option value="B2F">B2F - International</option>
                  <option value="B2G">B2G - Administration</option>
                </select>
              </div>

              {/* Montant minimum */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Montant minimum (FCFA)
                </label>
                <input
                  type="number"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Montant maximum */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Montant maximum (FCFA)
                </label>
                <input
                  type="number"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Illimité"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Liste des factures */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {hasActiveFilters ? 'Aucun résultat trouvé' : 'Aucune facture trouvée'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      Numéro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </span>
                        {invoice.documentSubtype !== 'standard' && (
                          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                            ({invoice.documentSubtype === 'avoir' ? 'Avoir' : 'Proforma'})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                            invoice.documentType === 'invoice'
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {invoice.documentType === 'invoice' ? 'Facture' : 'Reçu'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {invoice.invoiceType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white">
                        {invoice.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(invoice.totalTTC)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {onViewDetails && (
                            <button
                              onClick={() => onViewDetails(invoice.id)}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Voir détails"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Télécharger PDF"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownloadCSV(invoice.id)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Télécharger CSV"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePrintPDF(invoice.id)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Imprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
}
