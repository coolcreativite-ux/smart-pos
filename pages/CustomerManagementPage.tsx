
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useCustomers } from '../hooks/useCustomers';
import { useToast } from '../contexts/ToastContext';
import { Customer } from '../types';
import CustomerFormModal from '../components/CustomerFormModal';
import { useStores } from '../contexts/StoreContext';

const CustomerManagementPage: React.FC = () => {
    const { t } = useLanguage();
    const { customers, addCustomer, updateCustomer } = useCustomers();
    const { addToast } = useToast();
    const { stores, currentStore } = useStores();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<number | 'all'>(() => {
        // Si l'utilisateur n'a accès qu'à un seul magasin, l'utiliser par défaut
        if (stores.length === 1) {
            return stores[0].id;
        }
        return currentStore?.id || 'all';
    });

     const sortedCustomers = useMemo(() => {
        let sortableItems = [...customers];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a];
                const bValue = b[sortConfig.key as keyof typeof b];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;
                
                // @ts-ignore
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                // @ts-ignore
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [customers, sortConfig]);

    const filteredCustomers = useMemo(() => {
        let filtered = sortedCustomers;
        
        // Filtrer par magasin si un magasin spécifique est sélectionné
        if (selectedStoreId !== 'all') {
            filtered = filtered.filter(c => c.storeId === selectedStoreId);
        }
        
        // Filtrer par terme de recherche
        return filtered.filter(c =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        );
    }, [sortedCustomers, searchTerm, selectedStoreId]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span className="text-slate-400 dark:text-slate-500">↕</span>;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    const handleAdd = () => {
        setCustomerToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsFormOpen(true);
    };

    const handleSave = (customerData: Omit<Customer, 'id' | 'salesHistoryIds' | 'loyaltyPoints' | 'storeCredit' | 'tenantId'> | Customer) => {
        if ('id' in customerData) {
            updateCustomer(customerData as Customer);
            addToast(t('customerUpdatedSuccess'), 'success');
        } else {
            // Context addCustomer handles tenantId
            addCustomer(customerData as Omit<Customer, 'id' | 'tenantId' | 'salesHistoryIds' | 'loyaltyPoints' | 'storeCredit'>);
            addToast(t('customerAddedSuccess'), 'success');
        }
        setIsFormOpen(false);
        setCustomerToEdit(null);
    };

    const getStoreName = (storeId?: number) => {
        if (!storeId) return '-';
        return stores.find(s => s.id === storeId)?.name || 'Unknown Store';
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('customers')}</h2>
                <div className="flex items-center space-x-3">
                    {/* Sélecteur de magasin */}
                    {stores.length > 1 && (
                        <select
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{t('allStores')}</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    )}
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('searchCustomers')}
                        className="px-4 py-2 text-slate-900 dark:text-white bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg transition-colors hover:bg-indigo-700" >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span>{t('addCustomer')}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="hidden md:table w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('fullName')}</th>
                                <th scope="col" className="px-6 py-3">{t('email')}</th>
                                <th scope="col" className="px-6 py-3">{t('phone')}</th>
                                <th scope="col" className="px-6 py-3">{t('storeName')}</th>
                                <th scope="col" className="px-6 py-3">
                                    <button onClick={() => requestSort('loyaltyPoints')} className="flex items-center gap-1">
                                        {t('loyaltyPoints')}
                                        {getSortIndicator('loyaltyPoints')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span>{`${customer.firstName} ${customer.lastName}`}</span>
                                            {customer.loyaltyPoints > 0 && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <title>{`${customer.loyaltyPoints} ${t('loyaltyPoints')}`}</title>
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            )}
                                        </div>
                                    </th>
                                    <td className="px-6 py-4">{customer.email || '-'}</td>
                                    <td className="px-6 py-4">{customer.phone || '-'}</td>
                                    <td className="px-6 py-4">{getStoreName(customer.storeId)}</td>
                                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{customer.loyaltyPoints}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleEdit(customer)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{t('edit')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredCustomers.map(customer => (
                            <div key={customer.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>{`${customer.firstName} ${customer.lastName}`}</span>
                                            {customer.loyaltyPoints > 0 && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <title>{`${customer.loyaltyPoints} ${t('loyaltyPoints')}`}</title>
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            )}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{customer.email || customer.phone || 'No contact info'}</p>
                                        <p className="text-xs text-indigo-500 mt-1">{getStoreName(customer.storeId)}</p>
                                    </div>
                                    <button onClick={() => handleEdit(customer)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0 ml-4">{t('edit')}</button>
                                </div>
                                <div className="mt-2">
                                    <p className="text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">{t('loyaltyPoints')}: </span>
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{customer.loyaltyPoints}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {isFormOpen && <CustomerFormModal customerToEdit={customerToEdit} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
        </div>
    );
};

export default CustomerManagementPage;
