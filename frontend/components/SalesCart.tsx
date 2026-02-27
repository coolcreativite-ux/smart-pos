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
import { InvoiceGenerator } from '../components/invoices/InvoiceGenerator';
import { DocumentType, InvoiceFormData, PaymentMethod } from '../types/invoice.types';
import { API_URL } from '../config';

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
    const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
    const [invoiceDocumentType, setInvoiceDocumentType] = useState<DocumentType>('invoice');

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

    /**
     * Ouvre le générateur de factures avec les données de la vente
     */
    const handleGenerateInvoice = (documentType: DocumentType) => {
        setInvoiceDocumentType(documentType);
        setShowInvoiceGenerator(true);
    };

    /**
     * Prépare les données pré-remplies pour le générateur de factures
     */
    const getPrefilledInvoiceData = (): Partial<InvoiceFormData> | undefined => {
        if (!completedSale) return undefined;

        console.log('🔍 [Invoice] Préparation des données depuis la vente:', completedSale);
        console.log('🔍 [Invoice] Premier article complet:', completedSale.items[0]);

        // Déterminer le type de facturation basé sur le client
        let invoiceType: 'B2B' | 'B2C' | 'B2F' | 'B2G' = 'B2C';
        if (assignedCustomer?.ncc) {
            invoiceType = 'B2B';
        }

        // Fonction pour convertir TTC en HT avec un taux de TVA
        const convertTTCtoHT = (priceTTC: number, tvaRate: number): number => {
            return Math.round((priceTTC / (1 + tvaRate / 100)) * 100) / 100;
        };

        const items = completedSale.items.map((item, index) => {
            console.log(`🔍 [Invoice] Article ${index}:`, item);
            
            // Déterminer le taux de TVA (par défaut 18%)
            const tvaRate = 18;
            
            // Le prix est dans item.variant.price
            const priceTTC = item.variant.price;
            
            // Le nom du produit est dans item.productName
            const productName = item.productName;
            
            // Le nom de la variante est dans item.variantName
            const variantName = item.variantName;
            
            // Convertir le prix TTC en HT
            const unitPriceHT = convertTTCtoHT(priceTTC, tvaRate);
            
            // La quantité est dans item.quantity
            const quantity = item.quantity;
            
            console.log(`📦 [Invoice] Article traité: ${productName}, Prix TTC: ${priceTTC}, Prix HT: ${unitPriceHT}, Qté: ${quantity}`);
            
            return {
                productId: item.productId,
                variantId: item.variant.id,
                productName: productName,
                variantName: variantName,
                quantity: quantity,
                unitPriceHT: unitPriceHT,
                discountPercent: 0,
                tvaRate: tvaRate as 0 | 9 | 18
            };
        });

        const data: Partial<InvoiceFormData> = {
            documentType: invoiceDocumentType,
            invoiceType,
            documentSubtype: 'standard' as const,
            customerData: {
                name: assignedCustomer 
                    ? `${assignedCustomer.firstName || ''} ${assignedCustomer.lastName || ''}`.trim() || 'Client'
                    : 'Client',
                ncc: assignedCustomer?.ncc || '',
                phone: assignedCustomer?.phone || '',
                email: assignedCustomer?.email || '',
                address: assignedCustomer?.address || ''
            },
            paymentMethod: (completedSale.paymentMethod === 'cash' ? 'Espèces' : 
                          completedSale.paymentMethod === 'card' ? 'Carte bancaire' :
                          completedSale.paymentMethod === 'credit' ? 'A terme' : 'Espèces') as PaymentMethod,
            items,
            globalDiscountPercent: 0,
            additionalTaxes: [],
            commercialMessage: 'Merci pour votre confiance'
        };

        console.log('✅ [Invoice] Données préparées:', data);
        return data;
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
        
        // Impression automatique intelligente (contrôlée par les paramètres)
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
        // Si le générateur de factures est ouvert
        if (showInvoiceGenerator) {
            return (
                <InvoiceGenerator
                    documentType={invoiceDocumentType}
                    onClose={() => setShowInvoiceGenerator(false)}
                    onSuccess={async (invoiceId) => {
                        setShowInvoiceGenerator(false);
                        addToast('Document généré avec succès!', 'success');
                        
                        // Ouvrir le PDF directement pour impression
                        try {
                            // Gérer les deux formats: camelCase (tenantId) et snake_case (tenant_id)
                            const tenantId = user?.tenantId || (user as any)?.tenant_id;
                            const userId = user?.id;
                            
                            if (!tenantId || !userId) {
                                console.error('🔍 [PDF] User non authentifié:', user);
                                addToast('Erreur: utilisateur non authentifié', 'error');
                                return;
                            }
                            
                            console.log('🔍 [PDF] User:', user);
                            console.log('🔍 [PDF] TenantId:', tenantId);
                            console.log('🔍 [PDF] UserId:', userId);
                            
                            // Ouvrir la fenêtre AVANT la requête async pour éviter le blocage des pop-ups
                            const newWindow = window.open('', '_blank');
                            
                            const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
                                credentials: 'include', // Utiliser les cookies de session
                                headers: {
                                    'x-tenant-id': tenantId.toString(),
                                    'x-user-id': userId.toString()
                                }
                            });
                            
                            console.log('🔍 [PDF] Response status:', response.status);
                            
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
                                const errorText = await response.text();
                                console.error('🔍 [PDF] Error response:', errorText);
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
                    prefilledData={getPrefilledInvoiceData()}
                />
            );
        }

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

                 {/* Boutons de génération de documents */}
                 <div className="space-y-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-3 text-center">
                            Générer un document
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={handlePrintReceipt}
                                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-slate-400 dark:hover:border-slate-500 transition-all group"
                            >
                                <svg className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                                    Ticket
                                </span>
                            </button>

                            <button 
                                onClick={() => handleGenerateInvoice('invoice')}
                                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                            >
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                                    Facture
                                </span>
                            </button>

                            <button 
                                onClick={() => handleGenerateInvoice('receipt')}
                                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                            >
                                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                    Reçu
                                </span>
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-3 text-center">
                            Le ticket thermique reste disponible • Les factures/reçus sont des documents PDF professionnels
                        </p>
                    </div>
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
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-white dark:bg-slate-700 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-[10px] uppercase">
                                    {assignedCustomer.firstName?.[0] || '?'}{assignedCustomer.lastName?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[100px]">
                                        {assignedCustomer.firstName || 'Anonyme'} {assignedCustomer.lastName || ''}
                                    </p>
                                    <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-tighter">{assignedCustomer.loyaltyPoints || 0} PTS disponibles</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {(assignedCustomer.loyaltyPoints || 0) > 0 && (
                                    <button onClick={applyLoyaltyPoints} disabled={loyaltyDiscount > 0} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors" title="Utiliser les points">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                                    </button>
                                )}
                                <button onClick={() => assignCustomer(null)} className="p-1.5 text-slate-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        </div>
                        
                        {/* Indicateur de crédit magasin disponible */}
                        {assignedCustomer.storeCredit > 0 && (
                            <div className="bg-teal-50 dark:bg-teal-900/20 p-2.5 rounded-xl border border-teal-100 dark:border-teal-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-tight">Crédit magasin</p>
                                        <p className="text-xs font-black text-teal-700 dark:text-teal-300">{formatCurrency(assignedCustomer.storeCredit)}</p>
                                    </div>
                                </div>
                                {storeCreditPayment === 0 && (
                                    <button onClick={applyStoreCredit} className="px-2 py-1 bg-teal-600 text-white text-[8px] font-black uppercase rounded-lg hover:bg-teal-700 transition-colors">
                                        Utiliser
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* Indicateur d'échange en cours */}
                        {exchangeCredit > 0 && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-tight">Échange en cours</p>
                                        <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">Crédit: {formatCurrency(exchangeCredit)}</p>
                                    </div>
                                </div>
                                {exchangeContext && (
                                    <p className="text-[8px] text-slate-500 dark:text-slate-400 italic">
                                        Vente originale: #{exchangeContext.originalSaleId.slice(-8).toUpperCase()}
                                    </p>
                                )}
                            </div>
                        )}
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
                            
                            {/* Afficher le crédit d'échange si applicable */}
                            {exchangeCredit > 0 && (
                                <div className="flex justify-between items-center py-1 px-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">🔄 Crédit échange</span>
                                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">-{formatCurrency(exchangeCredit)}</span>
                                </div>
                            )}
                            
                            {/* Afficher le crédit magasin utilisé si applicable */}
                            {storeCreditPayment > 0 && (
                                <div className="flex justify-between items-center py-1 px-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                                    <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400">💳 Crédit magasin</span>
                                    <span className="text-[10px] font-black text-teal-700 dark:text-teal-300">-{formatCurrency(storeCreditPayment)}</span>
                                </div>
                            )}
                            
                            {/* CRITIQUE : Masquer les points à gagner si mode crédit */}
                            {assignedCustomer && pointsToEarn > 0 && !isCreditMode && (
                                <div className="flex justify-between items-center py-1 px-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">{t('pointsToEarnLabel')}</span>
                                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">+{pointsToEarn} PTS</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                                <span className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                                    {(exchangeCredit > 0 || storeCreditPayment > 0) ? 'Net à payer' : t('total')}
                                </span>
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
