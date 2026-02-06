
import React, { useState } from 'react';
import Spinner from './Spinner';
import { useLanguage } from '../hooks/useLanguage';

interface OrderContactModalProps {
  onClose: () => void;
  method: 'whatsapp' | 'email';
  selectedPlan?: string;
}

const OrderContactModal: React.FC<OrderContactModalProps> = ({ onClose, method, selectedPlan }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business: '',
    plan: selectedPlan || 'BUSINESS_PRO',
    message: ''
  });

  const SALES_PHONE = "2250584753743"; 
  const SALES_EMAIL = "iastudio225@gmail.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulation petit délai de traitement
    await new Promise(r => setTimeout(r, 800));

    // Construction du message avec des sauts de ligne explicites
    const fullMessage = `Bonjour l'équipe commerciale,\n\n` +
                        `Je souhaite passer une commande pour :\n` +
                        `- Plan : ${formData.plan}\n` +
                        `- Client : ${formData.name}\n` +
                        `- Email : ${formData.email}\n` +
                        `- Enseigne : ${formData.business}\n\n` +
                        `Message : ${formData.message || 'Je souhaite activer ma licence.'}`;

    if (method === 'whatsapp') {
      // Utilisation de api.whatsapp.com/send qui est souvent plus robuste pour l'encodage UTF-8 complet
      // par rapport au redirecteur wa.me sur certains navigateurs mobiles.
      const encodedMsg = encodeURIComponent(fullMessage);
      const url = `https://api.whatsapp.com/send?phone=${SALES_PHONE}&text=${encodedMsg}`;
      window.open(url, '_blank');
    } else {
      const subject = `Commande Licence Gemini POS - ${formData.plan}`;
      const mailtoUrl = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;
      window.location.href = mailtoUrl;
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-8 text-white ${method === 'whatsapp' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Formulaire de Commande</h2>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">
                Finalisez votre demande par {method === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-5 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Votre Nom complet</label>
              <input 
                type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Adresse Email</label>
              <input 
                type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="nom@exemple.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Nom de l'enseigne</label>
              <input 
                type="text" required value={formData.business} onChange={e => setFormData({...formData, business: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: Ma Boutique"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Formule souhaitée</label>
              <select 
                value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}
                className="w-full px-5 py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-none rounded-2xl font-black uppercase text-xs outline-none"
              >
                <option value="STARTER">Starter (Mensuel)</option>
                <option value="BUSINESS_PRO">Business Pro (Annuel)</option>
                <option value="ENTERPRISE">Enterprise (A vie)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Notes complémentaires (Optionnel)</label>
              <textarea 
                value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                placeholder="Précisez vos besoins..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-5 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${method === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
          >
            {isSubmitting ? <Spinner size="sm" /> : (
              method === 'whatsapp' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03a11.908 11.908 0 001.587 5.961L0 24l6.117-1.605a11.845 11.845 0 005.926 1.586h.005c6.632 0 12.028-5.396 12.03-12.03a11.85 11.85 0 00-3.483-8.487z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              )
            )}
            Envoyer ma demande
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderContactModal;
