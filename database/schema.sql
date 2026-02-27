-- Smart Point of Sale Database Schema
-- Multi-tenant POS system with complete inventory management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table (for multi-tenancy)
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    tenant_id INTEGER REFERENCES tenants(id),
    assigned_to VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    plan VARCHAR(50) CHECK (plan IN ('STARTER', 'BUSINESS_PRO', 'ENTERPRISE')) NOT NULL
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('superadmin', 'owner', 'admin', 'manager', 'cashier')) NOT NULL,
    assigned_store_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Stores table
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    image_url TEXT,
    attributes JSONB DEFAULT '[]',
    low_stock_threshold INTEGER DEFAULT 10,
    enable_email_alert BOOLEAN DEFAULT false,
    out_of_stock_since TIMESTAMP,
    low_stock_since TIMESTAMP,
    expected_restock_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product variants table
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    selected_options JSONB DEFAULT '{}',
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table (stock per store per variant)
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(variant_id, store_id)
);

-- Stock history table
CREATE TABLE stock_history (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    store_id INTEGER REFERENCES stores(id),
    change_amount INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason VARCHAR(50) CHECK (reason IN ('sale', 'restock', 'initial', 'correction', 'return', 'transfer_out', 'transfer_in', 'purchase_order', 'damage', 'loss')) NOT NULL,
    notes TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    loyalty_points INTEGER DEFAULT 0,
    store_credit DECIMAL(10,2) DEFAULT 0,
    store_id INTEGER REFERENCES stores(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promo codes table
CREATE TABLE promo_codes (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('percentage', 'fixed')) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Cash sessions table
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    store_id INTEGER NOT NULL REFERENCES stores(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    opening_cash DECIMAL(10,2) NOT NULL,
    closing_cash DECIMAL(10,2),
    status VARCHAR(20) CHECK (status IN ('open', 'closed')) DEFAULT 'open'
);

-- Cash transactions table
CREATE TABLE cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES cash_sessions(id),
    type VARCHAR(20) CHECK (type IN ('in', 'out', 'sale', 'refund')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    store_id INTEGER REFERENCES stores(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    customer_id INTEGER REFERENCES customers(id),
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    loyalty_discount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    promo_code VARCHAR(50),
    loyalty_points_earned INTEGER DEFAULT 0,
    loyalty_points_used INTEGER DEFAULT 0,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'credit')) NOT NULL,
    is_credit BOOLEAN DEFAULT false,
    total_paid DECIMAL(10,2) DEFAULT 0,
    item_status VARCHAR(20) CHECK (item_status IN ('taken', 'reserved')) DEFAULT 'taken',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    returned_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Return transactions table (for tracking returns)
CREATE TABLE return_transactions (
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

-- Installments table (for credit sales)
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'credit')) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suspended orders table
CREATE TABLE suspended_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    label VARCHAR(255) NOT NULL,
    items JSONB NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders table
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    store_id INTEGER NOT NULL REFERENCES stores(id),
    reference VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')) DEFAULT 'draft',
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP
);

-- Purchase order items table
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) UNIQUE,
    store_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    loyalty_program_enabled BOOLEAN DEFAULT false,
    loyalty_points_per_dollar DECIMAL(5,2) DEFAULT 1,
    loyalty_point_value DECIMAL(5,4) DEFAULT 0.01,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Action logs table
CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_inventory_variant_store ON inventory(variant_id, store_id);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_stock_history_variant_id ON stock_history(variant_id);

-- Insert default data
INSERT INTO tenants (name) VALUES ('Demo Tenant');

-- Insert default superadmin user (password: admin123)
INSERT INTO users (tenant_id, username, email, first_name, last_name, password_hash, role) 
VALUES (1, 'admin', 'admin@example.com', 'Super', 'Admin', '$2b$10$rQZ8kHWfQxwjQxwjQxwjQOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'superadmin');

-- Insert default store
INSERT INTO stores (tenant_id, name, location) VALUES (1, 'Magasin Principal', 'Centre-ville');

-- Insert default settings
INSERT INTO settings (tenant_id, store_name, tax_rate, loyalty_program_enabled) 
VALUES (1, 'Smart POS', 0.18, true);