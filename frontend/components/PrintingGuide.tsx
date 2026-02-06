import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

const PrintingGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
        title="Guide d'impression"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white">Guide d'impression</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Format de ticket</h4>
              <p>Les tickets sont optimisés pour les imprimantes thermiques 80mm (format standard des caisses).</p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Fonctionnalités</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>QR Code avec informations du ticket</li>
                <li>Détails client et programme fidélité</li>
                <li>Informations de paiement détaillées</li>
                <li>Gestion des ventes à crédit</li>
                <li>Retours partiels affichés</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Conseils</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Vérifiez que votre imprimante est allumée</li>
                <li>Utilisez du papier thermique de qualité</li>
                <li>L'aperçu vous permet de vérifier avant impression</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              💡 Astuce : Cliquez sur l'œil pour prévisualiser, sur l'imprimante pour imprimer directement
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintingGuide;