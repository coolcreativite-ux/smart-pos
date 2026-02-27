import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoice } from '../../contexts/InvoiceContext';

export function InvoiceDebug() {
  const { user } = useAuth();
  const { invoices, loading, error, fetchInvoices } = useInvoice();

  useEffect(() => {
    console.log('🔍 [InvoiceDebug] State changed:', {
      invoicesCount: invoices?.length || 0,
      loading,
      error,
      invoices: invoices
    });
  }, [invoices, loading, error]);

  const handleTestFetch = async () => {
    const tenantId = user?.tenantId || (user as any)?.tenant_id;
    const userId = user?.id;
    
    console.log('🔍 [InvoiceDebug] Test fetch with:', { tenantId, userId });
    
    if (tenantId && userId) {
      await fetchInvoices(tenantId, userId, 1);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold text-yellow-800 mb-2">Invoice Debug</h3>
      <div className="text-sm space-y-1">
        <div>User: {user ? 'Connected' : 'Not connected'}</div>
        <div>TenantId: {user?.tenantId || (user as any)?.tenant_id || 'N/A'}</div>
        <div>UserId: {user?.id || 'N/A'}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Invoices count: {invoices?.length || 0}</div>
        <div>Invoices array: {JSON.stringify(invoices)}</div>
      </div>
      <button
        onClick={handleTestFetch}
        className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm"
      >
        Test Fetch
      </button>
    </div>
  );
}