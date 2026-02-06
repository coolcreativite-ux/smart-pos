import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { usePromoCodes } from '../hooks/usePromoCodes';
import { useToast } from '../contexts/ToastContext';
import { PromoCode } from '../types';

interface PromoCodeFormModalProps {
  onClose: () => void;
}

const PromoCodeFormModal: React.FC<PromoCodeFormModalProps> = ({ onClose }) => {
    const { t } = useLanguage();
    const { addPromoCode } = usePromoCodes();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : (name === 'code' ? value.toUpperCase() : value)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code.trim() || formData.value <= 0) return;

        const success = addPromoCode({
            code: formData.code.trim(),
            type: formData.type,
            value: formData.value,
        });

        if (success) {
            addToast(t('promoCodeAddedSuccess'), 'success');
            onClose();
        } else {
            addToast(t('promoCodeExistsError'), 'error');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('addPromoCode')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('code')}</label>
                        <input type="text" name="code" id="code" value={formData.code} onChange={handleChange} required className="mt-1 w-full px-3 py-2 uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('type')}</label>
                            <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 w-full px-3 py-2">
                                <option value="percentage">{t('percentage')}</option>
                                <option value="fixed">{t('fixed')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('value')}</label>
                            <input type="number" name="value" id="value" value={formData.value} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 w-full px-3 py-2" />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromoCodeFormModal;
