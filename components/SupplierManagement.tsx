
import React, { useState } from 'react';
import { useSuppliers } from '../contexts/SupplierContext';
import { useLanguage } from '../hooks/useLanguage';
import { Supplier } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const SupplierManagement: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  // Update formData to Omit tenantId
  const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'tenantId'>>({ name: '', contactPerson: '', email: '', phone: '', address: '' });

  const handleEdit = (s: Supplier) => {
    setIsEditing(s.id);
    setIsAdding(false);
    setFormData({ name: s.name, contactPerson: s.contactPerson || '', email: s.email || '', phone: s.phone || '', address: s.address || '' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdding) {
      // Context addSupplier correctly handles tenantId injection
      addSupplier(formData);
      addToast("Fournisseur ajouté", "success");
    } else if (isEditing !== null && user) {
      // Re-inject tenantId when updating full Supplier object
      updateSupplier({ id: isEditing, tenantId: user.tenantId, ...formData });
      addToast("Fournisseur mis à jour", "success");
    }
    setIsAdding(false);
    setIsEditing(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('suppliers')}</h2>
        <button 
          onClick={() => { setIsAdding(true); setIsEditing(null); setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' }); }}
          className="px-5 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20"
        >
          Ajouter Fournisseur
        </button>
      </div>

      {(isAdding || isEditing !== null) && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nom de l'entreprise</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border-none rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Personne de contact</label>
              <input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border-none rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border-none rounded-xl font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Téléphone</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border-none rounded-xl font-bold" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 font-black rounded-xl uppercase text-[10px]">Annuler</button>
            <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-black rounded-xl uppercase text-[10px] shadow-lg shadow-indigo-500/20">Enregistrer</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Fournisseur</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Coordonnées</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4 font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-bold">{s.contactPerson || '-'}</td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-slate-500">{s.email}</p>
                  <p className="text-xs font-bold text-indigo-600">{s.phone}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(s)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => deleteSupplier(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierManagement;
