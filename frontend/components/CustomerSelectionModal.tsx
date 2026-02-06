import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useCustomers } from '../hooks/useCustomers';
import { useToast } from '../contexts/ToastContext';

interface CustomerSelectionModalProps {
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

const AddCustomerForm: React.FC<{ onCustomerAdded: (customer: Customer) => void, onBack: () => void }> = ({ onCustomerAdded, onBack }) => {
    const { t } = useLanguage();
    const { addCustomer } = useCustomers();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newCustomer = addCustomer(formData);
        addToast(t('customerAddedSuccess'), 'success');
        onCustomerAdded(newCustomer);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('firstName')}</label>
                    <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('lastName')}</label>
                    <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('email')}</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('phone')}</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={onBack} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">{t('backToSearch')}</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{t('save')}</button>
            </div>
        </form>
    );
};


const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({ onClose, onSelectCustomer }) => {
    const { t } = useLanguage();
    const { customers } = useCustomers();
    const [view, setView] = useState<'search' | 'add'>('search');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    const handleSelect = (customer: Customer) => {
        onSelectCustomer(customer);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {view === 'search' ? t('selectCustomer') : t('addNewCustomer')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {view === 'search' ? (
                    <>
                        <div className="mb-4 flex-shrink-0">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('searchOrAddCustomer')}
                                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                            {filteredCustomers.length > 0 ? (
                                <ul className="space-y-2">
                                    {filteredCustomers.map(c => (
                                        <li key={c.id} onClick={() => handleSelect(c)} className="p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                            <p className="font-semibold text-slate-800 dark:text-white">{`${c.firstName} ${c.lastName}`}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{c.email || c.phone}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-4 text-slate-500 dark:text-slate-400">{t('noCustomerFound')}</p>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <button onClick={() => setView('add')} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                                {t('addNewCustomer')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow overflow-y-auto">
                        <AddCustomerForm 
                            onCustomerAdded={(customer) => onSelectCustomer(customer)}
                            onBack={() => setView('search')} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerSelectionModal;