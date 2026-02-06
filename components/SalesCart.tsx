
import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
// Import useSalesHistory from contexts
import { useSalesHistory } from '../contexts/SalesHistoryContext';
import { useProducts } from '../hooks/useProducts';
import SalesConfirmationModal from './SalesConfirmationModal';
import { CartItem, StockChangeReason, Sale, Customer } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useCustomers } from '../hooks/useCustomers';
import { useSettings } from '../contexts/SettingsContext';
import CustomerSelectionModal from './CustomerSelectionModal';
import { useStores } from '../contexts/StoreContext';
import { printReceipt, printReceiptSmart } from '../utils/printUtils';
import PrintableReceipt from './PrintableReceipt';
import ReceiptPreviewModal from './ReceiptPreviewModal';
import SuspendedOrdersModal from './SuspendedOrdersModal';
import { useCashDrawer } from '../contexts/CashDrawerContext';

interface SalesCartProps {
    isMobileView?: boolean;
    onClose?: () => void;
}

const SalesCart: React.FC<SalesCartProps> = ({ isMobileView = false, onClose }) => {
    const { 
      cartItems, removeFromCart, updateQuantity, clearCart, 
      subtotal, tax, total, promoDiscount, loyaltyDiscount, exchangeCredit, storeCreditPayment,
      manualDiscount, applyManualDiscount,
      applyPromoCode, removePromoCode, appliedPromoCode,
      assignedCustomer, assignCustomer, applyLoyaltyPoints, pointsToEarn,
      exchangeContext, applyStoreCredit,
      suspendedOrders, suspendCurrentOrder
    } = useCart();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { addSale } = useSalesHistory();
    const { updateVariantStock, loadProducts } = useProducts();
    const { addToast } = useToast();
    const { updateCustomerAfterSale, useStoreCredit, addStoreCredit } = useCustomers();
    const { settings } = useSettings();
    const { currentStore } = useStores();
    const { recordSale } = useCashDrawer();

    const [isConfirming, setIsConfirming] = useState(false);
    const [saleCompleted, setSaleCompleted] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);

    // Helper pour calculer le stock du magasin actuel
    const getStoreStock = (item: CartItem) => {
        return currentStore 
            ? (item.variant.quantityByStore?.[currentStore.id] || 0)
            : item.variant.stock_quantity; // Fallback si pas de magasin sélectionné
    };

    // Credit logic
    const [isCreditMode, setIsCreditMode] = useState(false);
    const [initialDeposit, setInitialDeposit] = useState<number | ''>('');
    const [itemStatus, setItemStatus] = useState<'taken' | 'reserved'>('taken');

    useEffect(() => {
        if (saleCompleted && completedSale) {
            setShowReceiptPreview(true);
        }
    }, [saleCompleted, completedSale]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
    };

    const handleCheckout = () => {
        if (cartItems.length === 0 && exchangeCredit === 0) return;
        
        if (isCreditMode && !assignedCustomer) {
            addToast(t('customerRequiredForCredit'), 'error');
            setIsCustomerModalOpen(true);
            return;
        }

        setIsConfirming(true);
    };

    const handlePrintReceipt = () => {
        if (completedSale) {
            setShowReceiptPreview(false);
            printReceipt(completedSale, currentStore);
        }
    };

    const handleCloseReceiptPreview = () => {
        setShowReceiptPreview(false);
        setSaleCompleted(false);
        setCompletedSale(null);
    };

    const handleConfirmSale = () => {
        if (!user) return;
        
        const loyaltyPointsUsed = loyaltyDiscount > 0 ? Math.round(loyaltyDiscount / settings.loyaltyProgram.pointValue) : 0;
        const depositAmount = isCreditMode ? (Number(initialDeposit) || 0) : total;

        // CRITIQUE : Pas de points gagnés pour les ventes à crédit
        const pointsEarned = isCreditMode ? 0 : pointsToEarn;

        const newSale: Sale = {
            id: `sale_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`,
            // Add missing tenantId
            tenantId: user.tenantId,
            items: [...cartItems],
            subtotal,
            total,
            tax,
            promoCode: appliedPromoCode?.code,
            discount: promoDiscount + manualDiscount,
            loyaltyDiscount: loyaltyDiscount,
            user,
            timestamp: new Date(),
            customerId: assignedCustomer?.id,
            storeId: currentStore?.id,
            loyaltyPointsEarned: pointsEarned,
            loyaltyPointsUsed,
            paymentMethod: isCreditMode ? 'credit' : 'cash', 
            isCredit: isCreditMode,
            totalPaid: depositAmount,
            itemStatus: isCreditMode ? itemStatus : 'taken',
            installments: depositAmount > 0 ? [{
                id: `inst_${Date.now()}`,
                timestamp: new Date(),
                amount: depositAmount,
                method: 'cash',
                userId: user.id,
                username: user.username
            }] : [],
            returnDetails: exchangeContext ? { originalSaleId: exchangeContext.originalSaleId, returnedAmount: exchangeContext.returnCredit } : undefined,
        };

        newSale.items.forEach(cartItem => {
            updateVariantStock(cartItem.productId, cartItem.variant.id, -cartItem.quantity, StockChangeReason.Sale, user, `Sale ID: ${newSale.id}`);
        });
        
        // Recharger les produits depuis la base de données pour synchroniser l'inventaire
        setTimeout(() => {
            loadProducts();
        }, 500);
        
        if (assignedCustomer) {
            updateCustomerAfterSale(assignedCustomer.id, newSale.id, pointsEarned, loyaltyPointsUsed);
            if(storeCreditPayment > 0) useStoreCredit(assignedCustomer.id, storeCreditPayment);
        }
        
        if (depositAmount > 0) {
            recordSale(depositAmount, user);
        }

        setCompletedSale(newSale);
        addSale(newSale);
        clearCart();
        setIsConfirming(false);
        setSaleCompleted(true);
        setIsCreditMode(false);
        setInitialDeposit('');
        
        // Impression automatique intelligente
        if (settings.printing?.autoPrint) {
            setTimeout(() => {
                printReceiptSmart(newSale, currentStore, settings);
            }, 500); // Petit délai pour laisser le temps à l'interface de se mettre à jour
        }
    };

    const handleApplyPromo = () => {
        if (!promoCodeInput) return;
        if (applyPromoCode(promoCodeInput)) {
            addToast(t('promoCodeApplied'), 'success');
            setPromoCodeInput('');
        } else {
            addToast(t('promoCodeInvalid'), 'error');
        }
    };

    const handleSuspendAction = () => {
        if (cartItems.length === 0) {
            addToast("Le panier est vide", "error");
            return;
        }
        const label = prompt("Nom de la commande / Table (Optionnel) :");
        if (label !== null) {
            suspendCurrentOrder(label);
            addToast("Commande mise en attente", "info");
            if (isMobileView && onClose) onClose();
        }
    };

    const handleQuantityChange = (item: CartItem, delta: number) => {
        const newQuantity = item.quantity + delta;
        const storeStock = getStoreStock(item);
        
        if (newQuantity <= storeStock) {
            updateQuantity(item.id, newQuantity);
        }
    };

    if (saleCompleted && completedSale) {
        return (
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl flex flex-col h-full p-6 text-center animate-in fade-in duration-300">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{t('saleCompleted')} !</h2>
                 <div className="flex-grow flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">{t('totalAmount')}</p>
                    <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-2">{formatCurrency(completedSale.total)}</p>
                    {completedSale.isCredit && (
                        <p className="text-sm font-bold text-amber-600 uppercase mb-2">Crédit : Reste {formatCurrency(completedSale.total - completedSale.totalPaid)}</p>
                    )}
                    {completedSale.loyaltyPointsEarned > 0 && (
                        <p className="text-xs font-bold text-emerald-500 uppercase">+{completedSale.loyaltyPointsEarned} {t('loyaltyPointsEarned')}</p>
                    )}
                 </div>
                 <button onClick={() => { setSaleCompleted(false); setCompletedSale(null); }} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
                    {t('newSale')}
                 </button>
             </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('salesCart')}</h2>
                    {currentStore && <span className="text-[10px] text-slate-500 font-bold uppercase">{currentStore.name}</span>}
                </div>
                <button onClick={() => setIsSuspendedModalOpen(true)} className="relative p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {suspendedOrders.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{suspendedOrders.length}</span>}
                </button>
            </div>

            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-indigo-50/30 dark:bg-indigo-900/10">
                {assignedCustomer ? (
                    <div className="flex justify-between items-center bg-white dark:bg-slate-700 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-[10px] uppercase">{assignedCustomer.firstName[0]}{assignedCustomer.lastName[0]}</div>
                            <div>
                                <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[100px]">{assignedCustomer.firstName} {assignedCustomer.lastName}</p>
                                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-tighter">{assignedCustomer.loyaltyPoints} PTS disponibles</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {assignedCustomer.loyaltyPoints > 0 && (
                                <button onClick={applyLoyaltyPoints} disabled={loyaltyDiscount > 0} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors" title="Utiliser les points">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                                </button>
                            )}
                            <button onClick={() => assignCustomer(null)} className="p-1.5 text-slate-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                    </div>
                ) : (
                     <button onClick={() => setIsCustomerModalOpen(true)} className="w-full py-2.5 bg-white dark:bg-slate-700 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {t('associateCustomer')}
                    </button>
                )}
            </div>

            <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
                    <button 
                        onClick={() => setIsCreditMode(false)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!isCreditMode ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        {t('fullPayment')}
                    </button>
                    <button 
                        onClick={() => setIsCreditMode(true)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${isCreditMode ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        {t('creditPayment')}
                    </button>
                </div>

                {isCreditMode && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">{t('initialDeposit')}</label>
                                <input 
                                    type="number" 
                                    value={initialDeposit}
                                    onChange={(e) => setInitialDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">{t('itemStatus')}</label>
                                <select 
                                    value={itemStatus}
                                    onChange={(e) => setItemStatus(e.target.value as any)}
                                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="taken">{t('taken')}</option>
                                    <option value="reserved">{t('reserved')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 italic">
                        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        <p className="text-sm font-bold uppercase tracking-widest">{t('emptyCart')}</p>
                    </div>
                ) : (
                    cartItems.map(item => (
                        <div key={item.id} className="flex gap-3 group">
                            <img src={item.imageUrl} className="w-14 h-14 object-cover rounded-xl shadow-sm border border-slate-100 dark:border-slate-700" />
                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{item.productName}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{item.variantName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <button onClick={() => handleQuantityChange(item, -1)} className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-200">-</button>
                                    <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(item, 1)} disabled={item.quantity >= getStoreStock(item)} className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-200">+</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.variant.price * item.quantity)}</p>
                                <button onClick={() => removeFromCart(item.id)} className="mt-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 space-y-4">
                {cartItems.length > 0 && (
                    <>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <input 
                                        type="text" 
                                        value={promoCodeInput} 
                                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                        placeholder={t('promoCode')} 
                                        className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    />
                                    <button onClick={handleApplyPromo} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 font-black text-[10px] uppercase">OK</button>
                                </div>
                                <div className="flex gap-1.5">
                                    {[5, 10, 15].map(pct => (
                                        <button key={pct} onClick={() => applyManualDiscount(pct)} className={`px-3 rounded-xl text-[10px] font-black uppercase border transition-all ${manualDiscount > 0 && manualDiscount === (subtotal * pct / 100) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>
                                            -{pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {appliedPromoCode && (
                                <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">Code: {appliedPromoCode.code} (-{formatCurrency(promoDiscount)})</span>
                                    <button onClick={removePromoCode} className="text-emerald-600"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-3">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>{t('subtotal')}</span><span className="text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span></div>
                            {(manualDiscount > 0 || promoDiscount > 0 || loyaltyDiscount > 0) && (
                                <div className="flex justify-between text-[10px] font-black uppercase text-rose-500">
                                    <span>{t('totalDiscounts')}</span>
                                    <span>-{formatCurrency(manualDiscount + promoDiscount + loyaltyDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>{t('tax')} ({settings.taxRate}%)</span><span className="text-slate-900 dark:text-white">{formatCurrency(tax)}</span></div>
                            
                            {/* CRITIQUE : Masquer les points à gagner si mode crédit */}
                            {assignedCustomer && pointsToEarn > 0 && !isCreditMode && (
                                <div className="flex justify-between items-center py-1 px-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">{t('pointsToEarnLabel')}</span>
                                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">+{pointsToEarn} PTS</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white">{t('total')}</span>
                                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleSuspendAction} className="py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">{t('wait')}</button>
                            <button onClick={handleCheckout} className="py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 transition-all">{t('payment')}</button>
                        </div>
                    </>
                )}
            </div>
            
            {isCustomerModalOpen && (
                <CustomerSelectionModal 
                    onClose={() => setIsCustomerModalOpen(false)} 
                    onSelectCustomer={(customer) => {
                        assignCustomer(customer);
                        setIsCustomerModalOpen(false);
                    }} 
                />
            )}
            {isSuspendedModalOpen && <SuspendedOrdersModal onClose={() => setIsSuspendedModalOpen(false)} />}
            
            {showReceiptPreview && completedSale && (
                <ReceiptPreviewModal 
                    sale={completedSale} 
                    store={currentStore}
                    onClose={handleCloseReceiptPreview}
                    onPrint={handlePrintReceipt}
                />
            )}
            
            
            <SalesConfirmationModal isOpen={isConfirming} onClose={() => setIsConfirming(false)} onConfirm={handleConfirmSale} cartItems={cartItems} subtotal={subtotal} tax={tax} total={total} discount={promoDiscount + manualDiscount + loyaltyDiscount} loyaltyDiscount={loyaltyDiscount} promoCode={appliedPromoCode?.code} />
        </div>
    );
};

export default SalesCart;
