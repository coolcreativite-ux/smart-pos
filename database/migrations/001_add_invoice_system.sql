-- Migration: Add Invoice System Tables
-- Date: 2025-02-11
-- Description: Adds tables for professional invoice and receipt generation system

-- ============================================================================
-- 1. Modify existing customers table to add NCC and address fields
-- ============================================================================

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS ncc VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add index for NCC lookups (only for non-null values)
CREATE INDEX IF NOT EXISTS idx_customers_ncc ON customers(ncc) WHERE ncc IS NOT NULL;

COMMENT ON COLUMN customers.ncc IS 'Numéro de Compte Contribuable (NCC) - Ivorian tax ID for B2B invoicing';
COMMENT ON COLUMN customers.address IS 'Full customer address for invoicing';


-- ============================================================================
-- 2. Create invoices table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    invoice_number VARCHAR(50) NOT NULL,
    document_type VARCHAR(20) CHECK (document_type IN ('invoice', 'receipt')) NOT NULL,
    invoice_type VARCHAR(10) CHECK (invoice_type IN ('B2B', 'B2C', 'B2F', 'B2G')) NOT NULL,
    document_subtype VARCHAR(20) CHECK (document_subtype IN ('standard', 'avoir', 'proforma')) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_method VARCHAR(50) NOT NULL,
    subtotal_ht DECIMAL(12,2) NOT NULL,
    total_discounts DECIMAL(12,2) DEFAULT 0,
    total_tva DECIMAL(12,2) NOT NULL,
    total_additional_taxes DECIMAL(12,2) DEFAULT 0,
    total_ttc DECIMAL(12,2) NOT NULL,
    global_discount_percent DECIMAL(5,2) DEFAULT 0,
    commercial_message TEXT,
    pdf_path VARCHAR(500),
    csv_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- Ensure unique invoice numbers per tenant
    UNIQUE(tenant_id, invoice_number),
    
    -- Ensure valid discount percentage
    CHECK (global_discount_percent >= 0 AND global_discount_percent <= 100),
    
    -- Ensure positive amounts
    CHECK (subtotal_ht >= 0),
    CHECK (total_discounts >= 0),
    CHECK (total_tva >= 0),
    CHECK (total_additional_taxes >= 0),
    CHECK (total_ttc >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Comments for documentation
COMMENT ON TABLE invoices IS 'Professional invoices and receipts with full company branding';
COMMENT ON COLUMN invoices.document_type IS 'Type of document: invoice (facture) or receipt (reçu)';
COMMENT ON COLUMN invoices.invoice_type IS 'Billing type: B2B (business), B2C (consumer), B2F (foreign), B2G (government)';
COMMENT ON COLUMN invoices.document_subtype IS 'Document subtype: standard, avoir (credit note), proforma';
COMMENT ON COLUMN invoices.invoice_number IS 'Sequential invoice number format: YYYY-NNNNN or A-YYYY-NNNNN or P-YYYY-NNNNN';
COMMENT ON COLUMN invoices.subtotal_ht IS 'Subtotal excluding taxes (Hors Taxes)';
COMMENT ON COLUMN invoices.total_tva IS 'Total VAT amount (Taxe sur la Valeur Ajoutée)';
COMMENT ON COLUMN invoices.total_ttc IS 'Total including all taxes (Toutes Taxes Comprises)';


-- ============================================================================
-- 3. Create invoice_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price_ht DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_ht DECIMAL(12,2) NOT NULL,
    tva_rate DECIMAL(5,2) NOT NULL CHECK (tva_rate IN (0, 9, 18)),
    tva_amount DECIMAL(12,2) NOT NULL,
    total_ttc DECIMAL(12,2) NOT NULL,
    
    -- Ensure unique line numbers per invoice
    UNIQUE(invoice_id, line_number),
    
    -- Ensure valid values
    CHECK (quantity > 0),
    CHECK (unit_price_ht >= 0),
    CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CHECK (total_ht >= 0),
    CHECK (tva_amount >= 0),
    CHECK (total_ttc >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_variant_id ON invoice_items(variant_id);

-- Comments for documentation
COMMENT ON TABLE invoice_items IS 'Line items for invoices and receipts';
COMMENT ON COLUMN invoice_items.line_number IS 'Sequential line number within the invoice (1, 2, 3, ...)';
COMMENT ON COLUMN invoice_items.tva_rate IS 'Ivorian VAT rate: 0% (exempt), 9% (reduced), 18% (normal)';
COMMENT ON COLUMN invoice_items.unit_price_ht IS 'Unit price excluding tax (Hors Taxes)';
COMMENT ON COLUMN invoice_items.total_ht IS 'Line total excluding tax after discount';
COMMENT ON COLUMN invoice_items.total_ttc IS 'Line total including tax (Toutes Taxes Comprises)';


-- ============================================================================
-- 4. Create invoice_sequences table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_sequences (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    year INTEGER NOT NULL,
    document_subtype VARCHAR(20) CHECK (document_subtype IN ('standard', 'avoir', 'proforma')) NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique sequence per tenant, year, and subtype
    UNIQUE(tenant_id, year, document_subtype),
    
    -- Ensure valid year and number
    CHECK (year >= 2020 AND year <= 2100),
    CHECK (last_number >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_sequences_tenant_year ON invoice_sequences(tenant_id, year);

-- Comments for documentation
COMMENT ON TABLE invoice_sequences IS 'Sequential numbering for invoices per tenant and year';
COMMENT ON COLUMN invoice_sequences.document_subtype IS 'Sequence type: standard, avoir (credit note), proforma';
COMMENT ON COLUMN invoice_sequences.last_number IS 'Last used sequential number for this tenant/year/subtype';


-- ============================================================================
-- 5. Create invoice_taxes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_taxes (
    id SERIAL PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tax_name VARCHAR(100) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    
    -- Ensure valid tax amount
    CHECK (tax_amount >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_taxes_invoice_id ON invoice_taxes(invoice_id);

-- Comments for documentation
COMMENT ON TABLE invoice_taxes IS 'Additional taxes applied to invoices (e.g., Timbre de quittance)';
COMMENT ON COLUMN invoice_taxes.tax_name IS 'Name of the additional tax (e.g., "Timbre de quittance", "Taxe spéciale")';
COMMENT ON COLUMN invoice_taxes.tax_amount IS 'Amount of the additional tax in FCFA';


-- ============================================================================
-- 6. Create trigger for updating invoice updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_updated_at ON invoices;
CREATE TRIGGER trigger_update_invoice_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();


-- ============================================================================
-- 7. Create trigger for updating invoice_sequences updated_at timestamp
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_invoice_sequences_updated_at ON invoice_sequences;
CREATE TRIGGER trigger_update_invoice_sequences_updated_at
    BEFORE UPDATE ON invoice_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();


-- ============================================================================
-- 8. Grant permissions (if using Row Level Security)
-- ============================================================================

-- Enable Row Level Security on new tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_taxes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;
DROP POLICY IF EXISTS tenant_isolation_invoice_items ON invoice_items;
DROP POLICY IF EXISTS tenant_isolation_invoice_sequences ON invoice_sequences;
DROP POLICY IF EXISTS tenant_isolation_invoice_taxes ON invoice_taxes;

-- Create RLS policies for multi-tenant isolation
-- Note: Adjust these policies based on your authentication setup

-- Policy for invoices: users can only access their tenant's invoices
CREATE POLICY tenant_isolation_invoices ON invoices
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::INTEGER);

-- Policy for invoice_items: users can only access items from their tenant's invoices
CREATE POLICY tenant_isolation_invoice_items ON invoice_items
    USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = current_setting('app.current_tenant_id', TRUE)::INTEGER));

-- Policy for invoice_sequences: users can only access their tenant's sequences
CREATE POLICY tenant_isolation_invoice_sequences ON invoice_sequences
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::INTEGER);

-- Policy for invoice_taxes: users can only access taxes from their tenant's invoices
CREATE POLICY tenant_isolation_invoice_taxes ON invoice_taxes
    USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = current_setting('app.current_tenant_id', TRUE)::INTEGER));


-- ============================================================================
-- Migration complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_add_invoice_system.sql completed successfully';
    RAISE NOTICE 'Added tables: invoices, invoice_items, invoice_sequences, invoice_taxes';
    RAISE NOTICE 'Modified table: customers (added ncc and address columns)';
    RAISE NOTICE 'Created indexes for performance optimization';
    RAISE NOTICE 'Enabled Row Level Security for multi-tenant isolation';
END $$;
