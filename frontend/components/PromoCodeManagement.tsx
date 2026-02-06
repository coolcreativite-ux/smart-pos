
import React, { useState } from 'react';
import { usePromoCodes } from '../hooks/usePromoCodes';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../contexts/ToastContext';
import { PromoCode } from '../types';
import PromoCodeFormModal from './PromoCodeFormModal';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
        >
            <span
                aria-hidden="true"
                className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    );
};


const PromoCodeManagement: React.FC = () => {
    const { promoCodes, updatePromoCode, deletePromoCode } = usePromoCodes();
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleToggleStatus = (promoCode: PromoCode) => {
        updatePromoCode({ ...promoCode, isActive: !promoCode.isActive });
        addToast(t('promoCodeUpdatedSuccess'), 'success');
    };

    const handleDelete = (promoCodeId: number) => {
        if (window.confirm(t('confirmDeletePromoCode'))) {
            deletePromoCode(promoCodeId);
            addToast(t('promoCodeDeletedSuccess'), 'success');
        }
    };
    
    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{t('promoCodeManagement')}</h3>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg transition-colors hover:bg-indigo-700"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span>{t('addPromoCode')}</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="hidden md:table w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('code')}</th>
                                <th scope="col" className="px-6 py-3">{t('type')}</th>
                                <th scope="col" className="px-6 py-3">{t('value')}</th>
                                <th scope="col" className="px-6 py-3">{t('status')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promoCodes.map(promo => (
                                <tr key={promo.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">{promo.code}</td>
                                    <td className="px-6 py-4 capitalize">{t(promo.type)}</td>
                                    <td className="px-6 py-4">{promo.type === 'percentage' ? `${promo.value}%` : `${promo.value} Fcfa`}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <ToggleSwitch checked={promo.isActive} onChange={() => handleToggleStatus(promo)} />
                                            <span className={`text-xs font-semibold ${promo.isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                                                {promo.isActive ? t('active') : t('inactive')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(promo.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">{t('delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {/* Mobile Card List */}
                     <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                        {promoCodes.map(promo => (
                            <div key={promo.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-mono font-bold text-slate-900 dark:text-white">{promo.code}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t(promo.type)} - {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value} Fcfa`}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDelete(promo.id)} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0 ml-4">{t('delete')}</button>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <ToggleSwitch checked={promo.isActive} onChange={() => handleToggleStatus(promo)} />
                                    <span className={`text-xs font-semibold ${promo.isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                                        {promo.isActive ? t('active') : t('inactive')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isFormOpen && <PromoCodeFormModal onClose={() => setIsFormOpen(false)} />}
        </>
    );
};

export default PromoCodeManagement;
