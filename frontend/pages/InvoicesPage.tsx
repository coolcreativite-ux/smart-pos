import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { InvoiceGenerator } from '../components/invoices/InvoiceGenerator';
import { InvoiceHistory } from '../components/invoices/InvoiceHistory';
import { InvoiceDetailsModal } from '../components/invoices/InvoiceDetailsModal';
import { InvoiceDebug } from '../components/invoices/InvoiceDebug';
import { useInvoice } from '../contexts/InvoiceContext';
import { DocumentType } from '../types/invoice.types';
import { UserRole } from '../types';

export default function InvoicesPage() {
  const { user } = useAuth();
  const { refreshInvoices } = useInvoice();
  const [showGenerator, setShowGenerator] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Vérifier les permissions - Seuls Owner, Admin et SuperAdmin peuvent accéder aux factures
  const canAccessInvoices = user && (
    user.role === UserRole.SuperAdmin || 
    user.role === UserRole.Owner || 
    user.role === UserRole.Admin
  );

  // Afficher un message d'accès refusé pour les cashiers
  if (!canAccessInvoices) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Accès Restreint
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Seuls les propriétaires et administrateurs peuvent accéder à la gestion des factures.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Contactez votre administrateur si vous pensez que c'est une erreur.
          </p>
        </div>
      </div>
    );
  }

  // Gestion de la vue des détails
  const handleViewDetails = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
  };

  const handleCloseDetails = () => {
    setSelectedInvoiceId(null);
  };

  // Si le générateur est ouvert
  if (showGenerator) {
    return (
      <InvoiceGenerator
        documentType={documentType}
        onClose={() => setShowGenerator(false)}
        onSuccess={() => {
          setShowGenerator(false);
          // Forcer le rechargement de l'historique après création
          const tenantId = user?.tenantId || (user as any)?.tenant_id;
          const userId = user?.id;
          if (tenantId && userId) {
            // Attendre un peu pour que la base de données soit mise à jour
            setTimeout(() => {
              refreshInvoices();
            }, 500);
          }
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase">
            Factures & Reçus
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestion des documents de facturation
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setDocumentType('invoice');
              setShowGenerator(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 transition-colors"
          >
            + Nouvelle Facture
          </button>
          <button
            onClick={() => {
              setDocumentType('receipt');
              setShowGenerator(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 transition-colors"
          >
            + Nouveau Reçu
          </button>
        </div>
      </div>

      {/* Debug component - temporary */}
      <InvoiceDebug />

      {/* Historique avec filtres et pagination */}
      <InvoiceHistory onViewDetails={handleViewDetails} />

      {/* Modal de détails */}
      {selectedInvoiceId && (
        <InvoiceDetailsModal
          invoiceId={selectedInvoiceId}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
