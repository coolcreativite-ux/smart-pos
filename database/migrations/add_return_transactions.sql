-- Migration: Add return_transactions table
-- Date: 2026-02-12
-- Description: Add table to track return transactions with full details

-- Create return_transactions table
CREATE TABLE IF NOT EXISTS return_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    processed_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    return_reason VARCHAR(50) CHECK (return_reason IN ('defective', 'wrong_size', 'wrong_color', 'unsatisfied', 'order_error', 'other')) NOT NULL,
    notes TEXT,
    refund_method VARCHAR(20) CHECK (refund_method IN ('store_credit', 'cash', 'exchange')) NOT NULL,
    total_refund_amount DECIMAL(10,2) NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_return_transactions_sale_id ON return_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_return_transactions_tenant_id ON return_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_return_transactions_created_at ON return_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_return_transactions_refund_method ON return_transactions(refund_method);

-- Add comment
COMMENT ON TABLE return_transactions IS 'Tracks all return transactions with full audit trail';
COMMENT ON COLUMN return_transactions.return_reason IS 'Reason for return: defective, wrong_size, wrong_color, unsatisfied, order_error, other';
COMMENT ON COLUMN return_transactions.refund_method IS 'Method of refund: store_credit, cash, exchange';
COMMENT ON COLUMN return_transactions.items IS 'JSON array of returned items with details';
COMMENT ON COLUMN return_transactions.approved_by IS 'User ID of supervisor who approved (if required)';
