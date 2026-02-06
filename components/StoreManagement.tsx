
import React, { useState } from 'react';
import { useStores } from '../contexts/StoreContext';
import { useLanguage } from '../hooks/useLanguage';
import { Store } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';

const StoreManagement: React.FC = () => {
  const { stores, addStore, updateStore, deleteStore, currentStore } = useStores();
  const { initializeStoreStock } = useProducts();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState<number | null>(null);
  // Change state type to Omit tenantId
  const [formData, setFormData] = useState<Omit<Store, 'id' | 'tenantId'>>({ name: '', location: '', phone: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleEditClick = (store: Store) => {
    setIsEditing(store.id);
    setFormData({ name: store.name, location: store.location, phone: store.phone });
    setIsAdding(false);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({ name: '', location: '', phone: '' });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ name: '', location: '', phone: '' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) {
        const newStoreId = Math.max(0, ...stores.map(s => s.id)) + 1;
        // addStore context correctly handles tenantId injection
        addStore(formData);
        initializeStoreStock(newStoreId); 
        addToast(t('storeAddedSuccess'), 'success');
    } else if (isEditing !== null && user) {
        // Re-inject tenantId when updating full Store object
        updateStore({ id: isEditing, tenantId: user.tenantId, ...formData });
        addToast(t('storeUpdatedSuccess'), 'success');
    }
    handleCancel();
  };

  const handleDelete = (id: number) => {
      if (window.confirm(t('confirmDeleteStore'))) {
          deleteStore(id);
          addToast(t('storeDeletedSuccess'), 'success');
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('storeManagement')}</h2>
        <button
            onClick={handleAddClick}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg transition-colors hover:bg-indigo-700"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>{t('addStore')}</span>
        </button>
      </div>

      {(isAdding || isEditing !== null) && (
          <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg border border-slate-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  {isAdding ? t('addStore') : t('editStore')}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('storeName')}</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('location')}</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.location} 
                            onChange={e => setFormData({...formData, location: e.target.value})}
                            className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('storePhone')}</label>
                          <input 
                            type="text" 
                            value={formData.phone || ''} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="mt-1 w-full px-3 py-2 text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md"
                          />
                      </div>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">{t('cancel')}</button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">{t('save')}</button>
                  </div>
              </form>
          </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                    <th className="px-6 py-3">{t('storeName')}</th>
                    <th className="px-6 py-3">{t('location')}</th>
                    <th className="px-6 py-3">{t('storePhone')}</th>
                    <th className="px-6 py-3 text-right">{t('actions')}</th>
                </tr>
            </thead>
            <tbody>
                {stores.length > 0 ? stores.map(store => (
                    <tr key={store.id} className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${currentStore?.id === store.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-800'}`}>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            {store.name}
                            {currentStore?.id === store.id && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">{t('currentStore')}</span>}
                        </td>
                        <td className="px-6 py-4">{store.location}</td>
                        <td className="px-6 py-4">{store.phone || '-'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleEditClick(store)} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{t('edit')}</button>
                            {stores.length > 1 && (
                                <button onClick={() => handleDelete(store.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">{t('delete')}</button>
                            )}
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-slate-500">{t('noStoresFound')}</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreManagement;
