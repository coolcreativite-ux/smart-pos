-- Migration: Add NCC and Address fields to tenants table
-- Date: 2025-02-12
-- Description: Adds company information fields needed for invoice generation

-- Add NCC (Numéro de Compte Contribuable) column
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS ncc VARCHAR(50);

-- Add address column
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN tenants.ncc IS 'Numéro de Compte Contribuable (NCC) - Ivorian tax ID for company invoicing';
COMMENT ON COLUMN tenants.address IS 'Complete company address for invoicing';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 002_add_tenant_invoice_fields.sql completed successfully';
    RAISE NOTICE 'Added columns: ncc, address to tenants table';
END $$;
