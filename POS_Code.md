# Code de la Page Caisse / POS et Prévisualisation des Paiements

## 1. Page Caisse / POS (`src/screens/StorePOS.tsx`)

Ce fichier contient la logique principale de la caisse, y compris la gestion du panier, des sessions, et l'intégration des modales de paiement et de prévisualisation.

```tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Printer, User, Box, Grid, X, Check, Wifi, Lock, LogOut, ChevronLeft, Ticket, RotateCcw, AlertTriangle, Percent, Calendar, FileText } from 'lucide-react';
import { Button, Modal, Badge, StatusBadge } from '../components/SharedComponents';
import { MOCK_PRODUCTS, formatCurrency, MOCK_STORES, MOCK_TENANTS, MOCK_CUSTOMERS, MOCK_POS_SESSIONS, MOCK_TRANSACTIONS } from '../constants';
import { Product, Transaction, TransactionItem, Customer, PosSession, PaymentDetail } from '../types';
import { ReceiptThermal, InvoiceA4 } from '../components/FiscalDocuments';
import { generateFNENumber, getTaxAmount, getNetAmount } from '../utils/fneUtils';

interface CartItem extends Product {
  quantity: number;
  discount: number; // Montant remise par item
}

interface StorePOSProps {
  activeTab?: string;
}

const PAYMENT_METHOD_TRANSLATIONS: Record<string, string> = {
  'CASH': 'ESPÈCES',
  'MOBILE_MONEY': 'MOBILE MONEY',
  'CARD': 'CARTE',
  'CHEQUE': 'CHÈQUE',
  'VIREMENT': 'VIREMENT',
  'CREDIT_CLIENT': 'CRÉDIT CLIENT'
};

export const StorePOS: React.FC<StorePOSProps> = ({ activeTab = 'pos' }) => {
  // Session State
  const [currentSession, setCurrentSession] = useState<PosSession | null>(MOCK_POS_SESSIONS.find(s => s.status === 'OPEN') || null);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(!currentSession);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);

  // POS State
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('Tout');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(MOCK_CUSTOMERS[0]); // Default "Client Comptant"
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountTendered, setAmountTendered] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD'>('CASH');

  // Return/Refund State
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [returnRef, setReturnRef] = useState('');
  
  // Receipt State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [lastItems, setLastItems] = useState<TransactionItem[]>([]);

  const currentStore = MOCK_STORES[0];
  const currentTenant = MOCK_TENANTS[0];

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    if (activeTab !== 'pos') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') document.getElementById('search-input')?.focus();
      if (e.key === 'F3') setShowCustomerModal(true);
      if (e.key === 'F4') {
        if (cart.length > 0) setShowPaymentModal(true);
      }
      if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowCustomerModal(false);
        setShowReceiptModal(false);
        setShowReturnsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, activeTab]);

  // --- CART LOGIC ---

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const updateDiscount = (id: string, discount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, discount: Math.max(0, discount) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity) - item.discount, 0);
  const taxAmount = getTaxAmount(cartTotal); 

  // --- SESSION LOGIC ---

  const handleOpenSession = () => {
    const newSession: PosSession = {
      id: `sess-${Date.now()}`,
      storeId: currentStore.id,
      cashierId: 'u3', // Mock current user
      startTime: new Date().toISOString(),
      startCash: openingCash,
      totalSales: 0,
      status: 'OPEN'
    };
    setCurrentSession(newSession);
    setShowOpenSessionModal(false);
  };

  const handleCloseSession = () => {
    if (!currentSession) return;
    // Mock save to DB
    setCurrentSession(null);
    setShowCloseSessionModal(false);
    setShowOpenSessionModal(true);
  };

  // --- CHECKOUT LOGIC ---

  const handleCheckout = () => {
    if (!currentSession) return;

    const totalTTC = cartTotal;
    const netAmount = getNetAmount(totalTTC);
    const taxes = getTaxAmount(totalTTC);

    const fneNumber = generateFNENumber(currentTenant.ncc, '24', Math.floor(Math.random() * 1000) + 1, 'RECEIPT');

    const transactionItems: TransactionItem[] = cart.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      total: (item.price * item.quantity) - item.discount,
      discount: item.discount
    }));

    const paymentDetails: PaymentDetail[] = [{
      method: paymentMethod,
      amount: totalTTC // Simple payment for now
    }];

    const newTransaction: Transaction = {
      id: `tr-${Date.now()}`,
      storeId: currentStore.id,
      sessionId: currentSession.id,
      date: new Date().toISOString(),
      total: totalTTC,
      taxAmount: taxes,
      netAmount: netAmount,
      status: 'COMPLETED',
      paymentMethod: paymentMethod, // Legacy field
      payments: paymentDetails,
      items: transactionItems,
      fneNumber: fneNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      type: 'SALE'
    };

    // Update Session Sales (Mock)
    setCurrentSession({ ...currentSession, totalSales: currentSession.totalSales + totalTTC });

    setLastTransaction(newTransaction);
    setLastItems(transactionItems);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setAmountTendered(0);
    setSelectedCustomer(MOCK_CUSTOMERS[0]); // Reset to default client
  };

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Tout' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const categories = ['Tout', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))];

  // --- SUB-VIEWS ---

  const HistoryView = () => (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
       <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-gray-800">Historique des Ventes (Magasin)</h2>
             <div className="flex gap-2">
                <input type="date" className="border rounded-md px-3 py-2 text-sm" />
                <Button variant="secondary" icon={Search}>Rechercher</Button>
             </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-500">
                 <tr>
                   <th className="px-6 py-4">Réf (FNE)</th>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Client</th>
                   <th className="px-6 py-4 text-right">Montant</th>
                   <th className="px-6 py-4">Paiement</th>
                   <th className="px-6 py-4">Statut</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {MOCK_TRANSACTIONS.filter(t => t.storeId === currentStore.id).map(tr => (
                   <tr key={tr.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 font-mono text-xs font-medium text-blue-600">{tr.fneNumber}</td>
                     <td className="px-6 py-4 text-gray-600">{new Date(tr.date).toLocaleString()}</td>
                     <td className="px-6 py-4 font-medium">{tr.customerName}</td>
                     <td className="px-6 py-4 text-right font-bold">{formatCurrency(tr.total)}</td>
                     <td className="px-6 py-4"><Badge>{PAYMENT_METHOD_TRANSLATIONS[tr.paymentMethod] || tr.paymentMethod}</Badge></td>
                     <td className="px-6 py-4"><StatusBadge status={tr.status} /></td>
                     <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="secondary" icon={Printer}>Reçu</Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const StockView = () => (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
       <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-gray-800">Inventaire Local</h2>
             <Button icon={RotateCcw}>Demande Appro.</Button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-500">
                 <tr>
                   <th className="px-6 py-4">Article</th>
                   <th className="px-6 py-4">Catégorie</th>
                   <th className="px-6 py-4 text-right">Prix Vente</th>
                   <th className="px-6 py-4 text-center">Stock Actuel</th>
                   <th className="px-6 py-4">Emplacement</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {MOCK_PRODUCTS.map(p => {
                    const localStock = p.stocks?.find(s => s.storeId === currentStore.id);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          {p.name}
                          <div className="text-xs text-gray-500">{p.sku}</div>
                        </td>
                        <td className="px-6 py-4"><Badge color="gray">{p.category}</Badge></td>
                        <td className="px-6 py-4 text-right">{formatCurrency(p.price)}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`font-bold ${localStock && localStock.quantity < p.minStockLevel ? 'text-red-600' : 'text-green-600'}`}>
                             {localStock?.quantity || 0}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{localStock?.location || '-'}</td>
                      </tr>
                    );
                 })}
               </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  const SessionView = () => (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
       <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestion de Caisse</h2>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-lg font-bold text-gray-900">Session Actuelle</h3>
                   <p className="text-sm text-gray-500">Ouverte le {currentSession ? new Date(currentSession.startTime).toLocaleString() : '-'}</p>
                </div>
                <StatusBadge status={currentSession ? 'OPEN' : 'CLOSED'} />
             </div>

             {currentSession ? (
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                       <p className="text-sm text-blue-600 font-medium">Fond de Caisse</p>
                       <p className="text-2xl font-bold text-blue-900">{formatCurrency(currentSession.startCash)}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                       <p className="text-sm text-green-600 font-medium">Ventes Encaissées</p>
                       <p className="text-2xl font-bold text-green-900">{formatCurrency(currentSession.totalSales)}</p>
                    </div>
                 </div>

                 <div className="border-t pt-6">
                    <h4 className="font-bold text-gray-800 mb-4">Actions</h4>
                    <div className="flex gap-4">
                       <Button variant="danger" icon={LogOut} onClick={() => setShowCloseSessionModal(true)} className="flex-1 justify-center py-3">Clôturer la Caisse</Button>
                       <Button variant="secondary" icon={Printer} className="flex-1 justify-center py-3">Imprimer Rapport X</Button>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="text-center py-8">
                  <Lock size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">La caisse est actuellement fermée.</p>
                  <Button onClick={() => setShowOpenSessionModal(true)}>Ouvrir la Caisse</Button>
               </div>
             )}
          </div>
       </div>
    </div>
  );

  // --- RENDER HELPERS ---

  if (showOpenSessionModal) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
          <div className="bg-blue-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ouvrir la Caisse</h2>
          <p className="text-gray-500 mb-6">Veuillez saisir le fond de caisse initial pour commencer la session.</p>
          
          <div className="text-left mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fond de caisse (FCFA)</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold"
              value={openingCash}
              onChange={(e) => setOpeningCash(parseInt(e.target.value) || 0)}
              autoFocus
            />
          </div>
          
          <Button className="w-full justify-center py-3" onClick={handleOpenSession}>
            Démarrer la Session
          </Button>
        </div>
      </div>
    );
  }

  // View Switcher
  if (activeTab === 'history') return <HistoryView />;
  if (activeTab === 'stock') return <StockView />;
  if (activeTab === 'session') return <SessionView />;

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4 relative">
      
      {/* --- MODALS --- */}

      {/* PAYMENT MODAL */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Paiement">
         <div className="space-y-6">
            <div className="text-center bg-gray-50 p-4 rounded-lg">
               <p className="text-gray-500 text-sm uppercase">Montant à payer</p>
               <p className="text-4xl font-bold text-blue-600">{formatCurrency(cartTotal)}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <button onClick={() => setPaymentMethod('CASH')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${paymentMethod === 'CASH' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="bg-white p-2 rounded-full shadow-sm"><Box size={20}/></div>
                  <span className="font-bold text-sm">Espèces</span>
               </button>
               <button onClick={() => setPaymentMethod('MOBILE_MONEY')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${paymentMethod === 'MOBILE_MONEY' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="bg-white p-2 rounded-full shadow-sm"><Wifi size={20}/></div>
                  <span className="font-bold text-sm">Mobile Money</span>
               </button>
               <button onClick={() => setPaymentMethod('CARD')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${paymentMethod === 'CARD' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="bg-white p-2 rounded-full shadow-sm"><CreditCard size={20}/></div>
                  <span className="font-bold text-sm">Carte</span>
               </button>
            </div>

            {paymentMethod === 'CASH' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant Reçu</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg p-3 text-2xl font-bold text-right"
                  placeholder="0"
                  value={amountTendered || ''}
                  onChange={(e) => setAmountTendered(parseInt(e.target.value) || 0)}
                  autoFocus
                />
                <div className="flex justify-between items-center mt-4 p-4 bg-gray-900 text-white rounded-lg">
                   <span>Monnaie à rendre:</span>
                   <span className="text-2xl font-mono font-bold">{formatCurrency(Math.max(0, amountTendered - cartTotal))}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
               <Button 
                className="w-full justify-center py-4 text-lg" 
                onClick={handleCheckout}
                disabled={paymentMethod === 'CASH' && amountTendered < cartTotal}
               >
                 Valider Paiement (F4)
               </Button>
            </div>
         </div>
      </Modal>

      {/* RECEIPT MODAL */}
      {(showReceiptModal || showInvoiceModal) && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col w-full max-w-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="bg-green-100 p-1 rounded-full" size={24} />
                <span className="font-bold">Paiement Validé & Fiscalisé</span>
              </div>
              <button onClick={() => { setShowReceiptModal(false); setShowInvoiceModal(false); }} className="p-2 hover:bg-gray-200 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 bg-gray-100 overflow-y-auto flex justify-center">
              {showReceiptModal ? (
                <ReceiptThermal transaction={lastTransaction} tenant={currentTenant} store={currentStore} items={lastItems} />
              ) : (
                <div className="scale-75 origin-top w-full flex justify-center">
                   <InvoiceA4 transaction={lastTransaction} tenant={currentTenant} store={currentStore} items={lastItems} />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-center gap-4 bg-white rounded-b-xl sticky bottom-0 z-10">
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimer</Button>
              <Button variant="primary" onClick={() => { setShowReceiptModal(false); setShowInvoiceModal(false); }}>Nouvelle Vente</Button>
              {showReceiptModal && (
                <Button variant="ghost" onClick={() => { setShowReceiptModal(false); setShowInvoiceModal(true); }}>Voir Facture A4</Button>
              )}
               {showInvoiceModal && (
                <Button variant="ghost" onClick={() => { setShowInvoiceModal(false); setShowReceiptModal(true); }}>Voir Ticket</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER MODAL */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Sélectionner Client (F3)">
         <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Rechercher nom, téléphone..." 
              className="w-full border border-gray-300 rounded-lg p-2"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg">
               {MOCK_CUSTOMERS.map(c => (
                 <div 
                   key={c.id} 
                   className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 flex justify-between items-center"
                   onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
                 >
                    <div>
                       <p className="font-bold text-gray-800">{c.name}</p>
                       <p className="text-xs text-gray-500">{c.phone || 'Pas de téléphone'}</p>
                    </div>
                    {c.debt > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Créance: {formatCurrency(c.debt)}</span>
                    )}
                 </div>
               ))}
            </div>
            <Button className="w-full justify-center" icon={Plus}>Nouveau Client</Button>
         </div>
      </Modal>

      {/* RETURNS MODAL */}
      <Modal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} title="Gestion des Retours">
          <div className="space-y-4">
             <p className="text-sm text-gray-500">Scannez le ticket d'origine ou entrez le numéro de référence FNE.</p>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: 9500015F24000000001" 
                  className="w-full border border-gray-300 rounded-lg p-2 font-mono text-sm"
                  value={returnRef}
                  onChange={(e) => setReturnRef(e.target.value)}
                />
                <Button icon={Search}>Chercher</Button>
             </div>
             
             {/* Mock Result */}
             {returnRef && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                   <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm">Ticket Trouvé (Simulé)</span>
                      <span className="text-xs text-gray-500">20/05/2024</span>
                   </div>
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-white rounded border border-gray-100">
                         <span>1x Peinture Pantex</span>
                         <Button size="sm" variant="danger">Rembourser</Button>
                      </div>
                   </div>
                </div>
             )}

             <div className="flex justify-end pt-4">
                <Button variant="secondary" onClick={() => setShowReturnsModal(false)}>Fermer</Button>
             </div>
          </div>
      </Modal>

       {/* CLOSE SESSION MODAL */}
       <Modal isOpen={showCloseSessionModal} onClose={() => setShowCloseSessionModal(false)} title="Clôture de Caisse">
         <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
               <div className="flex justify-between text-sm mb-2">
                 <span>Fond de caisse initial:</span>
                 <span className="font-mono">{formatCurrency(currentSession?.startCash || 0)}</span>
               </div>
               <div className="flex justify-between text-sm mb-2">
                 <span>Ventes Espèces (Théorique):</span>
                 <span className="font-mono">{formatCurrency(currentSession?.totalSales || 0)}</span>
               </div>
               <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                 <span>Total Attendu:</span>
                 <span className="font-mono text-blue-600">{formatCurrency((currentSession?.startCash || 0) + (currentSession?.totalSales || 0))}</span>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Espèces comptées (Réel)</label>
              <input 
                type="number" 
                className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold"
                value={closingCash}
                onChange={(e) => setClosingCash(parseInt(e.target.value) || 0)}
              />
            </div>

            {closingCash !== ((currentSession?.startCash || 0) + (currentSession?.totalSales || 0)) && (
               <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                 <AlertTriangle size={16}/>
                 <span>Écart de caisse: {formatCurrency(closingCash - ((currentSession?.startCash || 0) + (currentSession?.totalSales || 0)))}</span>
               </div>
            )}
            
            <div className="flex gap-2 pt-2">
               <Button variant="secondary" className="flex-1" onClick={() => setShowCloseSessionModal(false)}>Annuler</Button>
               <Button variant="danger" className="flex-1" onClick={handleCloseSession}>Clôturer Caisse</Button>
            </div>
         </div>
       </Modal>

      {/* --- MAIN LAYOUT --- */}

      {/* Left: Product Grid (60%) */}
      <div className="flex-[3] flex flex-col gap-4">
        {/* Top Bar */}
        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1 text-green-600 font-medium">
                 <Wifi size={16}/> <span>En ligne</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div>Session: <span className="font-mono font-bold text-gray-800">#{currentSession?.id.slice(-4)}</span></div>
              <div>Caissier: <span className="font-bold text-gray-800">Awa Touré</span></div>
           </div>
           <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => setShowReturnsModal(true)}>Retours</Button>
              <Button size="sm" variant="danger" icon={LogOut} onClick={() => setShowCloseSessionModal(true)}>Fermer</Button>
           </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              id="search-input"
              type="text" 
              placeholder="Rechercher produit (F2)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden"
              >
                 {product.imageUrl && (
                    <div className="h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                       {/* Mock Image */}
                       <Box className="text-gray-300" size={32}/>
                    </div>
                 )}
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.sku}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.stockQuantity < product.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {product.stockQuantity}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 line-clamp-2 leading-tight">{product.name}</h3>
                <div className="mt-2 flex justify-between items-end">
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
                  <div className="bg-blue-50 p-2 rounded-full text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart & Checkout (40%) */}
      <div className="flex-[2] w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        {/* Customer Header */}
        <div className="p-3 border-b border-gray-100 bg-blue-50 rounded-t-xl cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setShowCustomerModal(true)}>
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-blue-800">
                 <User size={18} />
                 <span className="font-bold text-sm truncate max-w-[150px]">{selectedCustomer.name}</span>
              </div>
              <span className="text-xs text-blue-600 underline">Changer (F3)</span>
           </div>
           {selectedCustomer.debt > 0 && (
             <div className="text-xs text-red-600 mt-1 font-bold flex items-center gap-1">
               <AlertTriangle size={12}/> Créance: {formatCurrency(selectedCustomer.debt)}
             </div>
           )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-50" />
              <p>Le panier est vide</p>
              <p className="text-xs mt-2">Scannez un article ou sélectionnez dans la grille</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative group">
                <div className="flex justify-between items-start">
                   <div className="flex-1">
                     <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.name}</p>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 font-medium">{formatCurrency(item.price)}</span>
                        {item.discount > 0 && (
                           <span className="text-xs bg-red-100 text-red-600 px-1 rounded">- {formatCurrency(item.discount)}</span>
                        )}
                     </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency((item.price * item.quantity) - item.discount)}</p>
                   </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                   <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm">
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="p-1 hover:bg-white rounded text-blue-600 shadow-sm">
                        <Plus size={14} />
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <div className="relative group/discount">
                         <input 
                           type="number" 
                           className="w-16 text-xs border rounded p-1 text-right focus:ring-1 focus:ring-blue-500 outline-none" 
                           placeholder="Remise"
                           value={item.discount > 0 ? item.discount : ''}
                           onChange={(e) => updateDiscount(item.id, parseInt(e.target.value) || 0)}
                         />
                         <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none">Rem.</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Keypad */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl space-y-3">
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span>{formatCurrency(getNetAmount(cartTotal))}</span>
            </div>
            <div className="flex justify-between">
              <span>TVA (18%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-800 text-lg">Total TTC</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(cartTotal)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <Button variant="secondary" className="justify-center" icon={Ticket}>Brouillon</Button>
             <Button 
               className="justify-center shadow-lg shadow-blue-200 transition-transform active:scale-95" 
               disabled={cart.length === 0}
               icon={CreditCard}
               onClick={() => setShowPaymentModal(true)}
             >
               Encaisser (F4)
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 2. Composants de Prévisualisation (`src/components/FiscalDocuments.tsx`)

Ce fichier contient les composants `ReceiptThermal` (Ticket de caisse) et `InvoiceA4` (Facture normalisée) qui sont affichés dans la modale "Paiement Validé & Fiscalisé".

```tsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Transaction, Tenant, Store, TransactionItem, PurchaseOrder, Supplier } from '../types';
import { formatCurrency } from '../constants';
import { getNetAmount, getTaxAmount } from '../utils/fneUtils';
import { CheckCircle, Truck, MapPin, Calendar, FileText } from 'lucide-react';

interface DocumentProps {
  transaction: Transaction;
  tenant: Tenant;
  store: Store;
  items: TransactionItem[];
}

interface PODocumentProps {
  po: PurchaseOrder;
  tenant: Tenant;
  store: Store;
  supplier: Supplier | undefined;
}

/**
 * Sticker Électronique Officiel
 * Présent sur tous les documents normalisés
 */
const FNESticker: React.FC<{ fneNumber: string; transaction: Transaction; compact?: boolean }> = ({ fneNumber, transaction, compact = false }) => {
  const qrData = JSON.stringify({
    n: fneNumber,
    d: transaction.date,
    t: transaction.total,
    i: transaction.taxAmount,
  });

  if (compact) {
    // Version pour Ticket de caisse (RNE)
    return (
      <div className="border-2 border-dashed border-gray-800 p-2 mb-4 flex flex-col items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-bold text-xs border border-black px-1">DGI</div>
          <span className="text-[10px] uppercase font-bold">République de Côte d'Ivoire</span>
        </div>
        <div className="my-2">
           <QRCodeSVG value={qrData} size={80} level="M" />
        </div>
        <div className="text-[10px] font-mono text-center">
          <div className="font-bold">CODE: {fneNumber}</div>
          <div>RNE CERTIFIÉ</div>
        </div>
      </div>
    );
  }

  // Version pour Facture A4 (FNE)
  return (
    <div className="absolute top-0 right-0 border-2 border-blue-900 rounded-lg p-3 bg-white w-64 shadow-sm">
      <div className="flex justify-between items-start mb-2 border-b border-blue-100 pb-2">
        <div className="text-xs font-bold text-blue-900">
          DGI - CÔTE D'IVOIRE
          <div className="text-[10px] font-normal text-gray-600">Direction Générale des Impôts</div>
        </div>
        <div className="bg-blue-900 text-white text-[10px] px-1 font-bold">FNE</div>
      </div>
      <div className="flex gap-3 items-center">
        <QRCodeSVG value={qrData} size={64} level="M" />
        <div className="flex-1">
          <div className="text-[9px] text-gray-500 uppercase">Numéro de Facture</div>
          <div className="text-xs font-mono font-bold text-gray-800 break-all leading-tight">{fneNumber}</div>
          <div className="mt-1 flex items-center gap-1">
             <CheckCircle size={10} className="text-green-600"/>
             <span className="text-[9px] text-green-700 font-medium">Document Certifié</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Ticket de Caisse Thermique (RNE) - 80mm
 */
export const ReceiptThermal: React.FC<DocumentProps> = ({ transaction, tenant, store, items }) => {
  return (
    <div className="w-[300px] bg-white p-4 font-mono-receipt text-xs leading-relaxed text-gray-900 mx-auto shadow-xl border-t-4 border-gray-800">
      {/* Header */}
      <div className="text-center mb-4">
        <FNESticker fneNumber={transaction.fneNumber} transaction={transaction} compact={true} />
        <h2 className="font-bold text-lg uppercase mb-1">{tenant.companyName}</h2>
        <p>{store.location}</p>
        <p>Tél: {store.phone}</p>
        <p className="mt-1">NCC: {tenant.ncc}</p>
        <p>RCCM: {tenant.rccm}</p>
      </div>

      <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

      {/* Info Transaction */}
      <div className="flex justify-between mb-1">
        <span>Date:</span>
        <span>{new Date(transaction.date).toLocaleString('fr-CI')}</span>
      </div>
      <div className="flex justify-between mb-3">
        <span>Caisse:</span>
        <span>POS-01 / {store.managerName.split(' ')[0]}</span>
      </div>

      {/* Items */}
      <table className="w-full text-left mb-4">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1 w-1/2">Art.</th>
            <th className="py-1 text-right">Qté</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 pr-1 truncate max-w-[120px]">{item.name}</td>
              <td className="py-1 text-right">x{item.quantity}</td>
              <td className="py-1 text-right font-bold">{formatCurrency(item.total).replace(' F CFA', '')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

      {/* Totals */}
      <div className="space-y-1 text-right">
        <div className="flex justify-between">
          <span>HT (18%):</span>
          <span>{formatCurrency(getNetAmount(transaction.total))}</span>
        </div>
        <div className="flex justify-between">
          <span>TVA (18%):</span>
          <span>{formatCurrency(getTaxAmount(transaction.total))}</span>
        </div>
        <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-black">
          <span>TOTAL TTC:</span>
          <span>{formatCurrency(transaction.total)}</span>
        </div>
      </div>

      <div className="mt-4 text-center text-[10px]">
        <p>Mode de paiement: {transaction.paymentMethod}</p>
        <p className="mt-4 font-bold">MERCI DE VOTRE VISITE</p>
        <p className="mt-1 italic">Les marchandises vendues ne sont ni reprises ni échangées</p>
        <p className="mt-2 text-[9px] text-gray-500">Logiciel certifié IvoirQuincaillerie SaaS</p>
      </div>
    </div>
  );
};

/**
 * Facture Normalisée A4 (FNE)
 */
export const InvoiceA4: React.FC<DocumentProps> = ({ transaction, tenant, store, items }) => {
  return (
    <div className="w-full max-w-[210mm] bg-white p-12 mx-auto shadow-xl relative min-h-[297mm] text-sm text-gray-800">
      
      {/* Sticker Top Right */}
      <FNESticker fneNumber={transaction.fneNumber} transaction={transaction} />

      {/* Header Company */}
      <div className="mb-12 mt-4 max-w-[60%]">
        <h1 className="text-3xl font-bold text-blue-900 uppercase mb-2">{tenant.companyName}</h1>
        <p className="text-gray-600">{store.location}</p>
        <p className="text-gray-600">Tél: {store.phone} | Email: {tenant.email}</p>
        <div className="mt-4 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
          <p><span className="font-semibold">NCC:</span> {tenant.ncc}</p>
          <p><span className="font-semibold">RCCM:</span> {tenant.rccm}</p>
          <p><span className="font-semibold">Régime:</span> {tenant.taxRegime}</p>
          <p><span className="font-semibold">Centre Impôts:</span> {tenant.taxCenter}</p>
        </div>
      </div>

      {/* Title & Client Info */}
      <div className="flex justify-between items-end border-b-2 border-blue-900 pb-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Facture de Vente</h2>
          <p className="text-gray-500 mt-1">N°: {transaction.fneNumber}</p>
          <p className="text-gray-500">Date: {new Date(transaction.date).toLocaleDateString('fr-CI')}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Client</p>
          <p className="font-bold text-lg">{transaction.customerName || 'CLIENT COMPTANT'}</p>
          <p className="text-gray-600">Côte d'Ivoire</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8">
        <thead className="bg-gray-50 text-gray-900 font-bold uppercase text-xs">
          <tr>
            <th className="py-3 px-4 text-left">Désignation</th>
            <th className="py-3 px-4 text-center">Qté</th>
            <th className="py-3 px-4 text-right">P.U. TTC</th>
            <th className="py-3 px-4 text-right">Total TTC</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, idx) => (
             <tr key={idx}>
               <td className="py-3 px-4">{item.name}</td>
               <td className="py-3 px-4 text-center">{item.quantity}</td>
               <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
               <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.total)}</td>
             </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end mb-12">
        <div className="w-1/2 bg-gray-50 p-6 rounded-lg">
           <div className="flex justify-between mb-2 text-gray-600">
             <span>Total HT (Hors Taxes)</span>
             <span>{formatCurrency(getNetAmount(transaction.total))}</span>
           </div>
           <div className="flex justify-between mb-2 text-gray-600">
             <span>TVA (18%)</span>
             <span>{formatCurrency(getTaxAmount(transaction.total))}</span>
           </div>
           <div className="border-t border-gray-300 my-3"></div>
           <div className="flex justify-between text-xl font-bold text-blue-900">
             <span>Net à Payer</span>
             <span>{formatCurrency(transaction.total)}</span>
           </div>
           <div className="text-xs text-gray-500 text-right mt-2 italic">
             Arrêté la présente facture à la somme de {formatCurrency(transaction.total)}
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 left-12 right-12 text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
        <p>Ce document est une facture normalisée conforme à la réglementation fiscale en vigueur en République de Côte d'Ivoire.</p>
        <p>Les articles 384, 385 et suivants du CGI et les articles 144 et suivants du LPF rendent obligatoire la délivrance de facture normalisée.</p>
      </div>

    </div>
  );
};
```
