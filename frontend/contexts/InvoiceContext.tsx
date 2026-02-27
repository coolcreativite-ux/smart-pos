import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Invoice,
  InvoiceDetails,
  InvoiceFormData,
  InvoiceFilters,
  InvoiceContextState,
  CreateInvoiceResponse,
  ListInvoicesResponse
} from '../types/invoice.types';

interface InvoiceContextValue extends InvoiceContextState {
  createInvoice: (data: InvoiceFormData, tenantId: number, userId: number) => Promise<CreateInvoiceResponse>;
  fetchInvoices: (tenantId: number, userId: number, page?: number, filters?: InvoiceFilters) => Promise<void>;
  fetchInvoiceDetails: (id: string, tenantId: number, userId: number) => Promise<void>;
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  clearFilters: () => void;
  downloadPDF: (id: string, tenantId: number, userId: number) => Promise<void>;
  downloadCSV: (id: string, tenantId: number, userId: number) => Promise<void>;
  getNextNumber: (documentSubtype: string, tenantId: number, userId: number) => Promise<string>;
  refreshInvoices: () => void;
}

const InvoiceContext = createContext<InvoiceContextValue | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InvoiceContextState>({
    invoices: [],
    currentInvoice: null,
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    loading: false,
    error: null
  });

  /**
   * Crée une nouvelle facture ou reçu
   */
  const createInvoice = useCallback(async (
    data: InvoiceFormData,
    tenantId: number,
    userId: number
  ): Promise<CreateInvoiceResponse> => {
    console.log('🔍 [InvoiceContext] Création facture avec:', { tenantId, userId });
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const payload = {
        ...data,
        dueDate: data.dueDate?.toISOString()
      };

      console.log('🔍 [InvoiceContext] Payload envoyé:', payload);
      console.log('🔍 [InvoiceContext] Headers:', {
        'x-tenant-id': tenantId.toString(),
        'x-user-id': userId.toString()
      });

      const response = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId.toString(),
          'x-user-id': userId.toString()
        },
        body: JSON.stringify(payload)
      });

      console.log('🔍 [InvoiceContext] Response status:', response.status);

      if (!response.ok) {
        const errorResponse = await response.text();
        console.log('❌ [InvoiceContext] Erreur response:', errorResponse);
        
        let errorMessage = 'Erreur lors de la création de la facture';
        try {
          const errorJson = JSON.parse(errorResponse);
          if (errorJson.details && errorJson.details.length > 0) {
            const firstError = errorJson.details[0];
            errorMessage = firstError.message || errorJson.error || errorMessage;
          } else {
            errorMessage = errorJson.error || errorMessage;
          }
        } catch {
          errorMessage = errorResponse || errorMessage;
        }
        
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        throw new Error(errorMessage);
      }

      const result: CreateInvoiceResponse = await response.json();
      console.log('✅ [InvoiceContext] Facture créée:', result);
      
      setState(prev => ({ ...prev, loading: false }));
      
      return result;
    } catch (error: any) {
      console.log('❌ [InvoiceContext] Erreur création:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
      throw error;
    }
  }, []);

  /**
   * Récupère la liste des factures avec filtres
   */
  const fetchInvoices = useCallback(async (
    tenantId: number,
    userId: number,
    page: number = 1,
    filters?: InvoiceFilters
  ): Promise<void> => {
    console.log('🔍 [InvoiceContext] fetchInvoices appelé avec:', { tenantId, userId, page });
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      // Utiliser les filtres passés en paramètre (pas ceux du state pour éviter les closures)
      const currentFilters = filters || {};
      
      // Ajouter les filtres
      if (currentFilters.startDate) {
        params.append('startDate', currentFilters.startDate.toISOString().split('T')[0]);
      }
      if (currentFilters.endDate) {
        params.append('endDate', currentFilters.endDate.toISOString().split('T')[0]);
      }
      if (currentFilters.customerName) {
        params.append('customerName', currentFilters.customerName);
      }
      if (currentFilters.invoiceNumber) {
        params.append('invoiceNumber', currentFilters.invoiceNumber);
      }
      if (currentFilters.documentType) {
        params.append('documentType', currentFilters.documentType);
      }
      if (currentFilters.invoiceType) {
        params.append('invoiceType', currentFilters.invoiceType);
      }
      if (currentFilters.minAmount !== undefined) {
        params.append('minAmount', currentFilters.minAmount.toString());
      }
      if (currentFilters.maxAmount !== undefined) {
        params.append('maxAmount', currentFilters.maxAmount.toString());
      }

      const url = `${API_BASE_URL}/api/invoices?${params}`;
      console.log('🔍 [InvoiceContext] Requête vers:', url);
      console.log('🔍 [InvoiceContext] Headers:', {
        'x-tenant-id': tenantId.toString(),
        'x-user-id': userId.toString()
      });
      
      const response = await fetch(url, {
        headers: {
          'x-tenant-id': tenantId.toString(),
          'x-user-id': userId.toString()
        }
      });
      
      console.log('🔍 [InvoiceContext] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des factures');
      }

      const result: ListInvoicesResponse = await response.json();
      console.log('🔍 [InvoiceContext] Résultat reçu:', result.invoices);

      setState(prev => {
        const newState = {
          ...prev,
          invoices: result.invoices || [],
          pagination: result.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          },
          loading: false
        };
        console.log('🔍 [InvoiceContext] Nouveau state:', newState);
        return newState;
      });
      
      console.log('✅ [InvoiceContext] State mis à jour avec', result.invoices?.length || 0, 'factures');
    } catch (error: any) {
      console.error('❌ [InvoiceContext] Erreur:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message,
        invoices: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      }));
    }
  }, []);

  /**
   * Récupère les détails d'une facture
   */
  const fetchInvoiceDetails = useCallback(async (
    id: string,
    tenantId: number,
    userId: number
  ): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        headers: {
          'x-tenant-id': tenantId.toString(),
          'x-user-id': userId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails');
      }

      const result = await response.json();

      setState(prev => ({
        ...prev,
        currentInvoice: result.invoice,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  }, []);

  /**
   * Télécharge le PDF d'une facture
   */
  const downloadPDF = useCallback(async (
    id: string,
    tenantId: number,
    userId: number
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}/pdf`, {
        headers: {
          'x-tenant-id': tenantId.toString(),
          'x-user-id': userId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  /**
   * Télécharge le CSV d'une facture
   */
  const downloadCSV = useCallback(async (
    id: string,
    tenantId: number,
    userId: number
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}/csv`, {
        headers: {
          'x-tenant-id': tenantId.toString(),
          'x-user-id': userId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  /**
   * Obtient le prochain numéro de facture disponible
   */
  const getNextNumber = useCallback(async (
    documentSubtype: string,
    tenantId: number,
    userId: number
  ): Promise<string> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/invoices/next-number?documentSubtype=${documentSubtype}`,
        {
          headers: {
            'x-tenant-id': tenantId.toString(),
            'x-user-id': userId.toString()
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du numéro');
      }

      const result = await response.json();
      return result.nextNumber;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  /**
   * Met à jour les filtres
   */
  const setFilters = useCallback((filters: Partial<InvoiceFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters }
    }));
  }, []);

  /**
   * Réinitialise les filtres
   */
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {}
    }));
  }, []);

  /**
   * Force le rechargement des factures
   */
  const refreshInvoices = useCallback(() => {
    console.log('🔄 [InvoiceContext] refreshInvoices appelé');
    setState(prev => ({ 
      ...prev, 
      invoices: [],
      loading: false,
      error: null
    }));
  }, []);

  const value: InvoiceContextValue = {
    ...state,
    createInvoice,
    fetchInvoices,
    fetchInvoiceDetails,
    setFilters,
    clearFilters,
    downloadPDF,
    downloadCSV,
    getNextNumber,
    refreshInvoices
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
}