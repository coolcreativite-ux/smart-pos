import React, { useState, useMemo, useEffect } from 'react';
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useLanguage } from '../hooks/useLanguage';
import { Sale } from '../types';
import { useCustomers } from '../hooks/useCustomers';
import { useStores } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import ReturnModal from '../components/ReturnModal';
import { InvoiceGenerator } from '../components/invoices/InvoiceGenerator';
import { DocumentType } from '../types/invoice.types';
import { printReceipt } from '../utils/printUtils';
import { useToast } from '../contexts/ToastContext';
import { API_URL } from '../config';

const SalesHistory: React.FC = () => {
  const { sales, loadSales } = useSalesHistory();
  const { customers } = useCustomers();
  const { stores, currentStore } = useStores();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { addToast } = useToast();

  // États pour le filtrage et le tri
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'credit'>('all');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // État pour l'expansion des détails
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // États pour les actions
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
  const [invoiceGeneratorSale, setInvoiceGeneratorSale] = useState<Sale | null>(null);
  const [invoiceDocumentType, setInvoiceDocumentType] = useState<DocumentType>('invoice');

  // Charger les ventes au montage
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Filtrage et Tri
  const processedSales = useMemo(() => {
    let filtered = [...sales];

    // Filtrer par utilisateur si c'est une caissière
    if (user?.role === 'cashier') {
      filtered = filtered.filter(sale => sale.user.id === user.id);
    }

    // Filtrer par magasin
    if (currentStore) {
      filtered = filtered.filter(sale => sale.storeId === currentStore.id);
    }

    // Filtre recherche textuelle
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => {
        const customer = customers.find(c => c.id === sale.customerId);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
        return sale.id.toLowerCase().includes(query) || customerName.includes(query);
      });
    }

    // Filtre par date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(sale => new Date(sale.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sale => new Date(sale.timestamp) <= end);
    }

    // Filtre par méthode de paiement
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let valA = sortBy === 'date' ? new Date(a.timestamp).getTime() : a.total;
      let valB = sortBy === 'date' ? new Date(b.timestamp).getTime() : b.total;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return filtered;
  }, [sales, searchTerm, startDate, endDate, currentStore, sortBy, sortOrder, paymentFilter, customers, user]);

  // Statistiques
  const stats = useMemo(() => {
    const totalItems = processedSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const creditSales = processedSales.filter(s => s.isCredit).length;
    
    return { totalItems, creditSales, totalSales: processedSales.length };
  }, [processedSales]);

  // Pagination
  const totalPages = Math.ceil(processedSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedSales.slice(startIndex, startIndex + itemsPerPage);
  }, [processedSales, currentPage, itemsPerPage]);

  // Reset pagination au changement de filtres
  useEffect(() => {
    setCurrentPage(1);
    setExpandedSaleId(null);
  }, [searchTerm, startDate, endDate, currentStore, itemsPerPage, sortBy, sortOrder, paymentFilter]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF', 
      maximumFractionDigits: 0 
    }).format(amount);
  };
  
  const getStoreName = (storeId?: number) => {
    if (!storeId) return 'Magasin inconnu';
    return stores.find(s => s.id === storeId)?.name || 'Magasin inconnu';
  };

  const getCustomerName = (customerId?: number) => {
    if (!customerId) return 'Anonyme';
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
  };

  const handlePrintTicket = (sale: Sale) => {
    printReceipt(sale, stores.find(s => s.id === sale.storeId) || null);
  };

  const handleGenerateDocument = (sale: Sale, documentType: DocumentType) => {
    setInvoiceDocumentType(documentType);
    setInvoiceGeneratorSale(sale);
  };

  const getPrefilledInvoiceDataFromSale = (sale: Sale) => {
    const customer = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;
    
    const convertTTCtoHT = (priceTTC: number, tvaRate: number): number => {
      return Math.round((priceTTC / (1 + tvaRate / 100)) * 100) / 100;
    };

    const items = sale.items.map((item) => {
      const tvaRate = 18;
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
      paymentMethod: (sale.paymentMethod === 'cash' ? 'Espèces' : 
                    sale.paymentMethod === 'card' ? 'Carte bancaire' :
                    sale.paymentMethod === 'credit' ? 'A terme' : 'Espèces') as 'Espèces' | 'Carte bancaire' | 'A terme',
      items,
      globalDiscountPercent: 0,
      additionalTaxes: [],
      commercialMessage: 'Merci pour votre confiance'
    };
  };

  const handleExportCSV = () => {
    if (processedSales.length === 0) {
      addToast('Aucune vente à exporter', 'error');
      return;
    }

    const headers = ["ID Vente", "Date", "Magasin", "Utilisateur", "Client", "Total TTC", "Méthode Paiement", "Statut"];
    const csvRows = [headers.join(',')];

    for (const sale of processedSales) {
      const row = [
        `"${sale.id}"`,
        `"${new Date(sale.timestamp).toISOString()}"`,
        `"${getStoreName(sale.storeId)}"`,
        `"${sale.user.username}"`,
        `"${getCustomerName(sale.customerId)}"`,
        sale.total,
        `"${sale.paymentMethod}"`,
        `"${sale.isCredit ? 'Crédit' : 'Complet'}"`
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historique-ventes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    addToast(`${processedSales.length} ventes exportées`, 'success');
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* EN-TÊTE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {t('salesHistory')}
          </h2>
          {currentStore && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Magasin : <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentStore.name}</span>
            </p>
          )}
        </div>
        <button 
          onClick={handleExportCSV} 
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter CSV ({processedSales.length})
        </button>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-[10px] font-black uppercase opacity-80 mb-2">Total Ventes</p>
          <p className="text-3xl font-black">{stats.totalSales}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-[10px] font-black uppercase opacity-80 mb-2">Articles Vendus</p>
          <p className="text-3xl font-black">{stats.totalItems}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-[10px] font-black uppercase opacity-80 mb-2">Ventes à Crédit</p>
          <p className="text-3xl font-black">{stats.creditSales}</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Recherche</label>
            <input
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ID, Client..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Date Début</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Date Fin</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Paiement</label>
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value as any)} 
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold outline-none"
            >
              <option value="all">Tous</option>
              <option value="cash">Espèces</option>
              <option value="card">Carte</option>
              <option value="credit">Crédit</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Trier par</label>
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)} 
                className="flex-1 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none rounded-xl text-xs font-black uppercase outline-none"
              >
                <option value="date">Date</option>
                <option value="total">Montant</option>
              </select>
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={sortOrder === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LISTE DES VENTES */}
      <div className="space-y-4">
        {paginatedSales.length > 0 ? paginatedSales.map(sale => {
          const isExpanded = expandedSaleId === sale.id;
          const hasReturns = sale.items.some(item => (item.returnedQuantity || 0) > 0);
          const totalReturned = sale.items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);
          const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
          const isFullyReturned = totalReturned === totalItems;
          
          return (
            <div 
              key={sale.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 transition-all hover:shadow-indigo-500/10 border border-slate-100 dark:border-slate-700"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="grid grid-cols-2 md:grid-cols-5 flex-grow gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">ID Vente</p>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-800 dark:text-white truncate font-bold">
                        #{sale.id.substring(sale.id.length - 8).toUpperCase()}
                      </p>
                      {hasReturns && (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          isFullyReturned 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        }`}>
                          {isFullyReturned ? '🔴 Retour complet' : '🟠 Retour partiel'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Date & Heure</p>
                    <p className="text-slate-800 dark:text-white font-bold text-xs">{formatDate(sale.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Magasin</p>
                    <p className="text-purple-600 dark:text-purple-400 font-black text-xs truncate">
                      {getStoreName(sale.storeId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Client</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-black truncate">
                      {getCustomerName(sale.customerId)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total</p>
                    <p className="font-black text-xl text-slate-900 dark:text-white">{formatCurrency(sale.total)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 dark:border-slate-700">
                  <button 
                    onClick={() => handlePrintTicket(sale)} 
                    className="p-3 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm" 
                    title="Imprimer ticket"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleGenerateDocument(sale, 'invoice')} 
                    className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl transition-all shadow-sm" 
                    title="Générer facture"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleGenerateDocument(sale, 'receipt')} 
                    className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl transition-all shadow-sm" 
                    title="Générer reçu"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setReturnModalSale(sale)} 
                    className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl transition-all shadow-sm" 
                    title="Retour/Échange"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  </button>
                  <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-700 mx-2 hidden md:block"></div>
                  <button 
                    onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                    className={`text-[10px] font-black uppercase transition-colors px-4 py-2 rounded-xl ${
                      isExpanded 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
                  >
                    {isExpanded ? 'Fermer' : 'Détails'}
                  </button>
                </div>
              </div>

              {/* DÉTAILS EXPANDABLES */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Liste des articles */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
                        Articles achetés
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-white dark:bg-slate-800 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                              <th className="px-4 py-3">Produit / Variante</th>
                              <th className="px-4 py-3 text-center">Quantité</th>
                              <th className="px-4 py-3 text-right">Prix Unitaire</th>
                              <th className="px-4 py-3 text-right">Sous-total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sale.items.map(item => {
                              const activeQuantity = item.quantity - (item.returnedQuantity || 0);
                              const originalSubtotal = item.variant.price * item.quantity;
                              const activeSubtotal = item.variant.price * activeQuantity;
                              const hasItemReturns = item.returnedQuantity && item.returnedQuantity > 0;
                              
                              return (
                                <tr key={item.id}>
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-slate-800 dark:text-white uppercase">
                                      {item.productName}
                                    </p>
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                      {item.variantName}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold">
                                    {item.quantity}
                                    {hasItemReturns && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black">
                                        -{item.returnedQuantity}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-500">
                                    {formatCurrency(item.variant.price)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-black">
                                    {hasItemReturns ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-slate-400 line-through text-xs">
                                          {formatCurrency(originalSubtotal)}
                                        </span>
                                        <span className="text-slate-900 dark:text-white">
                                          {formatCurrency(activeSubtotal)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-900 dark:text-white">
                                        {formatCurrency(originalSubtotal)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Récapitulatif financier */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-3xl space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 text-center">
                        Récapitulatif
                      </h4>
                      
                      <div className="space-y-2 border-b border-slate-200 dark:border-slate-700 pb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Sous-total HT</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(sale.subtotal)}
                          </span>
                        </div>
                        {(sale.discount > 0) && (
                          <div className="flex justify-between text-xs text-rose-500 font-bold">
                            <span>Remise promo ({sale.promoCode || 'Manuel'})</span>
                            <span>-{formatCurrency(sale.discount)}</span>
                          </div>
                        )}
                        {(sale.loyaltyDiscount > 0) && (
                          <div className="flex justify-between text-xs text-rose-500 font-bold">
                            <span>Remise Fidélité ({sale.loyaltyPointsUsed} pts)</span>
                            <span>-{formatCurrency(sale.loyaltyDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            TVA ({Math.round((sale.tax / (sale.subtotal - (sale.discount || 0) - (sale.loyaltyDiscount || 0))) * 100)}%)
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(sale.tax)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-black uppercase text-slate-900 dark:text-white">
                          Total TTC
                        </span>
                        <span className="text-2xl font-black text-indigo-600">
                          {formatCurrency(sale.total)}
                        </span>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                            sale.isCredit 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {sale.isCredit ? 'À Crédit' : 'Complet'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Paiement via {sale.paymentMethod.toUpperCase()}
                          </span>
                        </div>
                        {sale.loyaltyPointsEarned > 0 && (
                          <p className="text-[10px] font-black text-emerald-600 uppercase">
                            +{sale.loyaltyPointsEarned} points fidélité gagnés
                          </p>
                        )}
                        {sale.isCredit && (
                          <p className="text-[10px] font-black text-rose-500 uppercase">
                            Reste à payer : {formatCurrency(sale.total - sale.totalPaid)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-400 font-bold italic">Aucune vente ne correspond à vos critères.</p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Afficher</label>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs font-bold outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">par page</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${
                  currentPage === pageNum
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Page {currentPage} sur {totalPages}
          </div>
        </div>
      )}

      {/* MODALS */}
      {returnModalSale && (
        <ReturnModal 
          sale={returnModalSale} 
          onClose={() => setReturnModalSale(null)} 
        />
      )}
      
      {invoiceGeneratorSale && (
        <InvoiceGenerator
          documentType={invoiceDocumentType}
          onClose={() => setInvoiceGeneratorSale(null)}
          onSuccess={async (invoiceId) => {
            setInvoiceGeneratorSale(null);
            addToast('Document généré avec succès!', 'success');
            
            try {
              const tenantId = user?.tenantId || (user as any)?.tenant_id;
              const userId = user?.id;
              
              if (!tenantId || !userId) {
                console.error('🔍 [PDF] User non authentifié:', user);
                addToast('Erreur: utilisateur non authentifié', 'error');
                return;
              }
              
              const newWindow = window.open('', '_blank');
              
              const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
                credentials: 'include',
                headers: {
                  'x-tenant-id': tenantId.toString(),
                  'x-user-id': userId.toString()
                }
              });
              
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                if (newWindow) {
                  newWindow.location.href = url;
                  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                } else {
                  addToast('Pop-up bloqué. Veuillez autoriser les pop-ups pour ce site.', 'error');
                  window.URL.revokeObjectURL(url);
                }
              } else {
                addToast('Erreur lors de l\'ouverture du PDF', 'error');
                if (newWindow) newWindow.close();
              }
            } catch (error) {
              console.error('Erreur ouverture PDF:', error);
              addToast('Erreur lors de l\'ouverture du PDF', 'error');
            }
          }}
          prefilledData={getPrefilledInvoiceDataFromSale(invoiceGeneratorSale)}
        />
      )}
    </div>
  );
};

export default SalesHistory;
