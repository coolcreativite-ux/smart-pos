import React from 'react';
import { Sale, Store } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { printReceipt } from '../utils/printUtils';

interface ReceiptPreviewModalProps {
  sale: Sale;
  store?: Store | null;
  onClose: () => void;
  onPrint: () => void;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({ 
  sale, 
  store, 
  onClose, 
  onPrint 
}) => {
  const { t } = useLanguage();

  const handlePrint = () => {
    onPrint();
    printReceipt(sale, store);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Aperçu du ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="bg-white border border-slate-200 rounded-lg p-4 font-mono text-xs">
            {/* Simulation du ticket en miniature */}
            <div className="space-y-2 text-center">
              <div className="font-bold text-sm">{store?.name || 'Magasin'}</div>
              <div className="text-xs opacity-70">#{sale.id.substring(sale.id.length - 8).toUpperCase()}</div>
              <div className="border-t border-dashed border-slate-300 pt-2">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs mb-1">
                    <span className="truncate mr-2">{item.productName}</span>
                    <span>{item.quantity} x {(item.variant.price).toLocaleString()} F</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 pt-2 font-bold">
                TOTAL: {sale.total.toLocaleString()} FCFA
              </div>
              <div className="text-xs opacity-70 mt-2">
                {new Date(sale.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-slate-600">
            <p className="mb-2">Ce ticket sera imprimé au format 80mm (ticket thermique standard).</p>
            <p>Vérifiez que votre imprimante est prête avant d'imprimer.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;