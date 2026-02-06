
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface CustomerFormModalProps {
  customerToEdit?: Customer | null;
  // Change signature to Omit tenantId and other auto-managed fields for new customers
  onSave: (customer: Omit<Customer, 'id' | 'salesHistoryIds' | 'loyaltyPoints' | 'storeCredit' | 'tenantId'> | Customer) => void;
  onCancel: () => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customerToEdit, onSave, onCancel }) => {
    const { t } = useLanguage();
    const isEditing = !!customerToEdit;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    
    useEffect(() => {
        if (customerToEdit) {
            setFormData({
                firstName: customerToEdit.firstName,
                lastName: customerToEdit.lastName,
                email: customerToEdit.email || '',
                phone: customerToEdit.phone || '',
            });
        }
    }, [customerToEdit]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && customerToEdit) {
            onSave({ ...customerToEdit, ...formData });
        } else {
            // This now correctly omits tenantId as per the new onSave signature
            onSave(formData);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {isEditing ? t('editCustomer') : t('addCustomer')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerFormModal;
