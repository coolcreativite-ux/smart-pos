import React, { useState } from 'react';
import { Settings, Sale } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { printReceiptSmart } from '../utils/printUtils';

interface PrintingSettingsProps {
  onClose: () => void;
}

const PrintingSettings: React.FC<PrintingSettingsProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [newMessage, setNewMessage] = useState('');

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const addPromotionalMessage = () => {
    if (newMessage.trim()) {
      const updatedSettings = {
        ...localSettings,
        printing: {
          ...localSettings.printing,
          promotionalMessages: [
            ...localSettings.printing.promotionalMessages,
            newMessage.trim()
          ]
        }
      };
      setLocalSettings(updatedSettings);
      setNewMessage('');
    }
  };

  const removePromotionalMessage = (index: number) => {
    const updatedSettings = {
      ...localSettings,
      printing: {
        ...localSettings.printing,
        promotionalMessages: localSettings.printing.promotionalMessages.filter((_, i) => i !== index)
      }
    };
    setLocalSettings(updatedSettings);
  };

  const resetStatistics = () => {
    if (confirm('Êtes-vous sûr de vouloir remettre à zéro les statistiques d\'impression ?')) {
      const updatedSettings = {
        ...localSettings,
        printing: {
          ...localSettings.printing,
          printStatistics: {
            ...localSettings.printing.printStatistics,
            totalReceipts: 0,
            paperSaved: 0
          }
        }
      };
      setLocalSettings(updatedSettings);
    }
  };

  const testPrint = () => {
    // Créer un ticket de test
    const testSale: Sale = {
      id: 'test-' + Date.now(),
      tenantId: 1,
      items: [
        {
          id: 'test-item-1',
          productId: 1,
          productName: 'Article de Test',
          imageUrl: '',
          variantName: 'Bleu / M',
          quantity: 2,
          variant: {
            id: 1,
            selectedOptions: { 'Couleur': 'Bleu', 'Taille': 'M' },
            price: 1500,
            costPrice: 800,
            stock_quantity: 10,
            sku: 'TEST-001',
            barcode: '1234567890123'
          }
        },
        {
          id: 'test-item-2',
          productId: 2,
          productName: 'Deuxième Article Test',
          imageUrl: '',
          variantName: 'Standard',
          quantity: 1,
          variant: {
            id: 2,
            selectedOptions: {},
            price: 2500,
            costPrice: 1200,
            stock_quantity: 5,
            sku: 'TEST-002',
            barcode: '9876543210987'
          }
        }
      ],
      subtotal: 5500,
      total: 6490,
      tax: 990,
      discount: 0,
      loyaltyDiscount: 0,
      user: {
        id: 1,
        tenantId: 1,
        username: 'testeur',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin' as any,
        permissions: {} as any
      },
      timestamp: new Date(),
      paymentMethod: 'cash',
      loyaltyPointsEarned: 65,
      loyaltyPointsUsed: 0,
      isCredit: false,
      totalPaid: 6490,
      itemStatus: 'taken',
      installments: [],
      customerId: 1
    };

    const testStore = {
      id: 1,
      tenantId: 1,
      name: 'Magasin de Test',
      location: '123 Rue de Test, Dakar',
      phone: '+221 33 123 45 67'
    };

    // Forcer autoPrint à false pour le test afin de voir la fenêtre
    const testSettings = {
      ...localSettings,
      printing: {
        ...localSettings.printing,
        autoPrint: false // Désactivé pour voir la fenêtre de test
      }
    };

    printReceiptSmart(testSale, testStore, testSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Paramètres d'Impression</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Paramètres généraux */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Paramètres Généraux</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoPrint"
                  checked={localSettings.printing.autoPrint}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    printing: {
                      ...localSettings.printing,
                      autoPrint: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                <label htmlFor="autoPrint">Impression automatique après chaque vente</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showBarcodes"
                  checked={localSettings.printing.showBarcodes}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    printing: {
                      ...localSettings.printing,
                      showBarcodes: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                <label htmlFor="showBarcodes">Afficher les codes-barres sur les tickets</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Largeur du papier</label>
                <select
                  value={localSettings.printing.paperWidth}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    printing: {
                      ...localSettings.printing,
                      paperWidth: e.target.value as '58mm' | '80mm'
                    }
                  })}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="58mm">58mm (Petites imprimantes)</option>
                  <option value="80mm">80mm (Standard)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages promotionnels */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Messages Promotionnels</h3>
            
            <div className="space-y-3">
              {localSettings.printing.promotionalMessages.map((message, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span className="flex-1 text-sm">{message}</span>
                  <button
                    onClick={() => removePromotionalMessage(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nouveau message promotionnel..."
                  className="flex-1 border rounded px-3 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && addPromotionalMessage()}
                />
                <button
                  onClick={addPromotionalMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Statistiques d'impression */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Statistiques d'Impression</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {localSettings.printing.printStatistics.totalReceipts}
                </div>
                <div className="text-sm text-gray-600">Tickets imprimés</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {localSettings.printing.printStatistics.paperSaved.toFixed(1)}m
                </div>
                <div className="text-sm text-gray-600">Papier économisé</div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableStats"
                checked={localSettings.printing.printStatistics.enabled}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  printing: {
                    ...localSettings.printing,
                    printStatistics: {
                      ...localSettings.printing.printStatistics,
                      enabled: e.target.checked
                    }
                  }
                })}
                className="mr-2"
              />
              <label htmlFor="enableStats">Activer le suivi des statistiques</label>
            </div>

            <button
              onClick={resetStatistics}
              className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              Remettre à zéro les statistiques
            </button>

            <button
              onClick={testPrint}
              className="mt-3 ml-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
            >
              🖨️ Test d'Impression
            </button>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintingSettings;