import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface AddCategoryModalProps {
  onClose: () => void;
  onSave: (categoryName: string) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onSave }) => {
  const { t } = useLanguage();
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      onSave(categoryName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          {t('newCategory')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('categoryName')}</label>
            <input 
              type="text" 
              name="categoryName" 
              id="categoryName" 
              value={categoryName} 
              onChange={(e) => setCategoryName(e.target.value)} 
              required 
              autoFocus
              placeholder={t('categoryNamePlaceholder')}
              className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            />
          </div>
          <div className="pt-2 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-500" disabled={!categoryName.trim()}>
                {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
