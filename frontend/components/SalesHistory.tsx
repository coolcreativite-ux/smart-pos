
import React, { useState, useMemo } from 'react';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useLanguage } from '../hooks/useLanguage';
import { getVariantName, Sale } from '../types';
import { useCustomers } from '../hooks/useCustomers';
import { useAuth } from '../contexts/AuthContext';
import ReturnModal from '../components/ReturnModal';
import { InvoiceGenerator } from '../components/invoices/InvoiceGenerator';
import { DocumentType } from '../types/invoice.types';
import { printReceipt } from '../utils/printUtils';
import { useStores } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { API_URL } from '../config';

const ITEMS_PER_PAGE = 5;

const SalesHistory: React.FC = () => {
  const { sales } = useSalesHistory();
  const { customers } = useCustomers();
  const { t, language } = useLanguage();
  const { currentStore } = useStores();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
  const [invoiceGeneratorSale, setInvoiceGeneratorSale] = useState<Sale | null>(null);
  const [invoiceDocumentType, setInvoiceDocumentType] = useState<DocumentType>('invoice');

  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales;
    return sales.filter(sale => sale.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sales, searchTerm]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);

  // Reset to page 1 when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };
  
  const getCustomerName = (customerId?: number) => {
    if (!customerId) return 'N/A';
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
  }

  const handlePrintTicket = (sale: Sale) => {
    printReceipt(sale, currentStore);
  };

  const handleGenerateDocument = (sale: Sale, documentType: DocumentType) => {
    setInvoiceDocumentType(documentType);
    setInvoiceGeneratorSale(sale);
  };

  const getPrefilledInvoiceDataFromSale = (sale: Sale) => {
    const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;
    
    // Fonction pour convertir TTC en HT avec un taux de TVA
    const convertTTCtoHT = (priceTTC: number, tvaRate: number): number => {
      return Math.round((priceTTC / (1 + tvaRate / 100)) * 100) / 100;
    };

    const items = sale.items.map((item) => {
      const tvaRate = 18; // Par défaut 18%
      const priceTTC = item.variant?.price || 0;
      const unitPriceHT = convertTTCtoHT(priceTTC, tvaRate);
      
      return {
        productId: item.productId || 0,
        variantId: item.variant?.id || 0,
        productName: item.productName || 'Produit',
        variantName: item.variantName || 'Standard',
        quantity: item.quantity || 1,
        unitPriceHT: unitPriceHT,
        discountPercent: 0,
        tvaRate: tvaRate as 0 | 9 | 18
      };
    });

    return {
      documentType: invoiceDocumentType,
      invoiceType: (customer?.ncc ? 'B2B' : 'B2C') as 'B2B' | 'B2C' | 'B2F' | 'B2G',
      documentSubtype: 'standard' as const,
      customerData: {
        name: customer ? `${customer.firstName} ${customer.lastName}` : 'Client',
        ncc: (customer as any)?.ncc || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: (customer as any)?.address || ''
      },
      paymentMethod: sale.paymentMethod === 'cash' ? 'Espèces' : 
                    sale.paymentMethod === 'card' ? 'Carte bancaire' :
                    sale.paymentMethod === 'credit' ? 'A terme' : 'Espèces',
      items,
      globalDiscountPercent: 0,
      additionalTaxes: [],
      commercialMessage: 'Merci pour votre confiance'
    };
  };

  const handleExportCSV = () => {
    if (sales.length === 0) return;

    const headers = [
      "Sale ID", "Timestamp", "User", "Customer", "Product ID", "Product Name", 
      "Variant ID", "Variant Name", "Quantity", "Price per Item", "Row Total"
    ];

    const csvRows = [headers.join(',')];

    for (const sale of sales) {
      for (const item of sale.items) {
        const variantName = getVariantName(item.variant);
        const row = [
          `"${sale.id}"`,
          `"${sale.timestamp.toISOString()}"`,
          `"${sale.user.username}"`,
          `"${getCustomerName(sale.customerId)}`,
          item.productId,
          `"${item.productName.replace(/"/g, '""')}"`,
          item.variant.id,
          `"${variantName.replace(/"/g, '""')}"`,
          item.quantity,
          item.variant.price.toFixed(2),
          (item.quantity * item.variant.price).toFixed(2)
        ];
        csvRows.push(row.join(','));
      }
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  if (sales.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('salesHistory')}</h2>
        <div className="flex items-center justify-center h-full pt-10">
          <p className="text-slate-500 dark:text-slate-400 text-lg">{t('noSalesRecorded')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('salesHistory')}</h2>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg transition-colors hover:bg-green-700"
            title={t('exportToCSV')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">{t('exportToCSV')}</span>
          </button>
        </div>

        <div className="mb-4">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchById')}
                className="w-full max-w-sm px-4 py-2 text-slate-900 dark:text-white bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>

        <div className="space-y-4">
          {paginatedSales.map(sale => (
            <div key={sale.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 transition-all hover:shadow-indigo-500/10">
              {/* Desktop View */}
              <div className="hidden md:grid md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">{t('saleId')}</p>
                  <p className="text-slate-800 dark:text-white truncate" title={sale.id}>{sale.id.substring(sale.id.length - 12)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">{t('timestamp')}</p>
                  <p className="text-slate-800 dark:text-white">{formatDate(sale.timestamp)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">{t('customer')}</p>
                  <p className="text-slate-800 dark:text-white">{getCustomerName(sale.customerId)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">{t('user')}</p>
                  <p className="text-slate-800 dark:text-white">{sale.user.username}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">{t('totalAmount')}</p>
                  <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatCurrency(sale.total)}</p>
                </div>
              </div>
              {/* Mobile View */}
              <div className="md:hidden space-y-3 text-sm">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="font-semibold text-slate-500 dark:text-slate-400">{t('saleId')}</p>
                          <p className="text-slate-800 dark:text-white truncate" title={sale.id}>{sale.id.substring(sale.id.length - 12)}</p>
                      </div>
                      <div className="text-right">
                          <p className="font-semibold text-slate-500 dark:text-slate-400">{t('totalAmount')}</p>
                          <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatCurrency(sale.total)}</p>
                      </div>
                  </div>
                  <div>
                      <p className="font-semibold text-slate-500 dark:text-slate-400">{t('timestamp')}</p>
                      <p className="text-slate-800 dark:text-white">{formatDate(sale.timestamp)}</p>
                  </div>
                  <div>
                      <p className="font-semibold text-slate-500 dark:text-slate-400">{t('customer')}</p>
                      <p className="text-slate-800 dark:text-white">{getCustomerName(sale.customerId)}</p>
                  </div>
                  <div>
                      <p className="font-semibold text-slate-500 dark:text-slate-400">{t('user')}</p>
                      <p className="text-slate-800 dark:text-white">{sale.user.username}</p>
                  </div>
              </div>

              {/* Boutons de génération de documents - Toujours visibles */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">
                  Générer un document
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePrintTicket(sale)}
                    className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-all group"
                  >
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                      Ticket
                    </span>
                  </button>

                  <button
                    onClick={() => handleGenerateDocument(sale, 'invoice')}
                    className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                  >
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                      Facture
                    </span>
                  </button>

                  <button
                    onClick={() => handleGenerateDocument(sale, 'receipt')}
                    className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                  >
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                      Reçu
                    </span>
                  </button>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  {t('viewDetails')}
                </summary>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">{t('itemsSold')}:</h4>
                    <button
                        onClick={() => setReturnModalSale(sale)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                        {t('returnExchange')}
                    </button>
                  </div>

                  {/* Boutons de génération de documents */}
                  <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">
                      Générer un document
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handlePrintTicket(sale)}
                        className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-all group"
                      >
                        <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                          Ticket
                        </span>
                      </button>

                      <button
                        onClick={() => handleGenerateDocument(sale, 'invoice')}
                        className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                      >
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                          Facture
                        </span>
                      </button>

                      <button
                        onClick={() => handleGenerateDocument(sale, 'receipt')}
                        className="flex flex-col items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                      >
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                          Reçu
                        </span>
                      </button>
                    </div>
                  </div>

                  <ul className="space-y-1 text-sm list-disc list-inside">
                    {sale.items.map(item => (
                      <li key={item.id} className="text-slate-600 dark:text-slate-400">
                        {item.quantity} x {item.productName} <span className="text-indigo-600 dark:text-indigo-400">({item.variantName})</span> @ {formatCurrency(item.variant.price)}
                        {item.returnedQuantity && item.returnedQuantity > 0 && 
                          <span className="text-xs ml-2 text-red-500">({item.returnedQuantity} retournés)</span>
                        }
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 text-sm space-y-1">
                      {sale.discount > 0 && (
                          <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">{t('discount')} ({sale.promoCode}):</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">- {formatCurrency(sale.discount)}</span>
                          </div>
                      )}
                      {sale.loyaltyDiscount > 0 && (
                          <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">{t('loyaltyDiscount')} ({sale.loyaltyPointsUsed} pts):</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">- {formatCurrency(sale.loyaltyDiscount)}</span>
                          </div>
                      )}
                      {sale.loyaltyPointsEarned > 0 && (
                          <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">{t('loyaltyPoints')} Earned:</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">+ {sale.loyaltyPointsEarned}</span>
                          </div>
                      )}
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                  Previous
              </button>
              <div className="hidden sm:block">
                  <p className="text-sm text-slate-700 dark:text-slate-400">
                      Page <span className="font-medium text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                  </p>
              </div>
              <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                  Next
              </button>
          </div>
        )}
      </div>
      {returnModalSale && (
        <ReturnModal sale={returnModalSale} onClose={() => setReturnModalSale(null)} />
      )}
      {invoiceGeneratorSale && (
        <InvoiceGenerator
          documentType={invoiceDocumentType}
          onClose={() => setInvoiceGeneratorSale(null)}
          onSuccess={async (invoiceId) => {
            setInvoiceGeneratorSale(null);
            addToast('Document généré avec succès!', 'success');
            
            // Ouvrir le PDF dans une nouvelle fenêtre pour impression
            try {
              // Gérer les deux formats: camelCase (tenantId) et snake_case (tenant_id)
              const tenantId = user?.tenantId || (user as any)?.tenant_id;
              const userId = user?.id;
              
              if (!tenantId || !userId) {
                console.error('🔍 [PDF] User non authentifié:', user);
                addToast('Erreur: utilisateur non authentifié', 'error');
                return;
              }
              
              // Ouvrir la fenêtre AVANT la requête async pour éviter le blocage des pop-ups
              const newWindow = window.open('', '_blank');
              
              const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
                credentials: 'include', // Utiliser les cookies de session
                headers: {
                  'x-tenant-id': tenantId.toString(),
                  'x-user-id': userId.toString()
                }
              });
              
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Utiliser la fenêtre déjà ouverte
                if (newWindow) {
                  newWindow.location.href = url;
                  // Nettoyer l'URL après un délai
                  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                } else {
                  // Fallback si la fenêtre a été bloquée
                  addToast('Pop-up bloqué. Veuillez autoriser les pop-ups pour ce site.', 'error');
                  window.URL.revokeObjectURL(url);
                }
              } else {
                addToast('Erreur lors de l\'ouverture du PDF', 'error');
                // Fermer la fenêtre vide en cas d'erreur
                if (newWindow) {
                  newWindow.close();
                }
              }
            } catch (error) {
              console.error('Erreur ouverture PDF:', error);
              addToast('Erreur lors de l\'ouverture du PDF', 'error');
            }
          }}
          prefilledData={getPrefilledInvoiceDataFromSale(invoiceGeneratorSale)}
        />
      )}
    </>
  );
};

export default SalesHistory;
