
import React, { useState, useMemo } from 'react';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useLanguage } from '../hooks/useLanguage';
import { getVariantName, Sale } from '../types';
import { useCustomers } from '../hooks/useCustomers';
import ReturnModal from '../components/ReturnModal';

const ITEMS_PER_PAGE = 5;

const SalesHistory: React.FC = () => {
  const { sales } = useSalesHistory();
  const { customers } = useCustomers();
  const { t, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);

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

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  {t('viewDetails')}
                </summary>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">{t('itemsSold')}:</h4>
                    <button
                        onClick={() => setReturnModalSale(sale)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                        {t('returnExchange')}
                    </button>
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
    </>
  );
};

export default SalesHistory;
