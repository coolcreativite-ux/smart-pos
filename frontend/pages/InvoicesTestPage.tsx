import React, { useState } from 'react';
import { InvoiceGenerator } from '../components/invoices/InvoiceGenerator';
import { DocumentType } from '../types/invoice.types';

/**
 * Page de test pour le système de facturation
 * À intégrer dans le DashboardPage plus tard
 */
export function InvoicesTestPage() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Test du Système de Facturation FNE
          </h1>

          <div className="space-y-6">
            {/* Informations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">
                ℹ️ Informations
              </h2>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Backend doit être démarré sur http://localhost:5000</li>
                <li>• Migration SQL doit être exécutée</li>
                <li>• Vous devez être connecté avec un compte valide</li>
              </ul>
            </div>

            {/* Statut */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">Backend</div>
                <div className="text-2xl font-bold text-green-700">✓ Prêt</div>
                <div className="text-xs text-green-600 mt-1">
                  5 services + API REST
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">Frontend</div>
                <div className="text-2xl font-bold text-green-700">✓ Prêt</div>
                <div className="text-xs text-green-600 mt-1">
                  Formulaire complet
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-600 font-medium mb-1">Base de données</div>
                <div className="text-2xl font-bold text-yellow-700">⚠ À vérifier</div>
                <div className="text-xs text-yellow-600 mt-1">
                  Migration requise
                </div>
              </div>
            </div>

            {/* Actions de test */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Actions de test
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setDocumentType('invoice');
                    setShowGenerator(true);
                  }}
                  className="px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div className="font-semibold">Tester Facture</div>
                      <div className="text-sm text-indigo-200">
                        Générer une facture de test
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDocumentType('receipt');
                    setShowGenerator(true);
                  }}
                  className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div>
                      <div className="font-semibold">Tester Reçu</div>
                      <div className="text-sm text-green-200">
                        Générer un reçu de test
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Fonctionnalités implémentées */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                ✅ Fonctionnalités implémentées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div>• 4 types de facturation (B2B, B2C, B2F, B2G)</div>
                <div>• Calculs TVA ivoiriens (0%, 9%, 18%)</div>
                <div>• Remises par article et globales</div>
                <div>• Timbre de quittance automatique</div>
                <div>• Validation complète des données</div>
                <div>• Génération PDF professionnelle</div>
                <div>• Export CSV pour comptabilité</div>
                <div>• Numérotation séquentielle</div>
                <div>• Isolation multi-tenant</div>
                <div>• Calculs en temps réel</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                📋 Instructions de test
              </h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Cliquez sur "Tester Facture" ou "Tester Reçu"</li>
                <li>Sélectionnez le type de facturation (B2B, B2C, B2F, B2G)</li>
                <li>Renseignez les informations client</li>
                <li>Ajoutez des articles depuis le catalogue</li>
                <li>Vérifiez les calculs en temps réel</li>
                <li>Cliquez sur "Générer" pour créer le document</li>
                <li>Le PDF et CSV seront générés automatiquement</li>
              </ol>
            </div>

            {/* Commandes utiles */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                💻 Commandes utiles
              </h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-800 text-green-400 p-3 rounded font-mono">
                  # Démarrer le backend<br/>
                  cd backend && npm run dev
                </div>
                <div className="bg-gray-800 text-green-400 p-3 rounded font-mono">
                  # Exécuter la migration SQL<br/>
                  psql -U postgres -d votre_base -f database/migrations/001_add_invoice_system.sql
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal du générateur */}
      {showGenerator && (
        <InvoiceGenerator
          documentType={documentType}
          onClose={() => setShowGenerator(false)}
          onSuccess={(invoiceId) => {
            console.log('Facture créée avec succès:', invoiceId);
            alert(`✅ ${documentType === 'invoice' ? 'Facture' : 'Reçu'} créé avec succès!\nID: ${invoiceId}`);
          }}
        />
      )}
    </div>
  );
}
