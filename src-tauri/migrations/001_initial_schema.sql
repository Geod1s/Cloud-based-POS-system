-- Sync metadata table
CREATE TABLE IF NOT EXISTS sync_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_synced_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z'
);

INSERT OR IGNORE INTO sync_meta (id, last_synced_at) VALUES (1, '1970-01-01T00:00:00Z');

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    local_updated_at TEXT NOT NULL,
    remote_updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    is_deleted INTEGER NOT NULL DEFAULT 0
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category_id TEXT,
    barcode TEXT,
    sku TEXT,
    production_date TEXT,
    expiration_date TEXT,
    created_at TEXT NOT NULL,
    local_updated_at TEXT NOT NULL,
    remote_updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    total_debt REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    local_updated_at TEXT NOT NULL,
    remote_updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    is_deleted INTEGER NOT NULL DEFAULT 0
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    local_updated_at TEXT NOT NULL,
    remote_updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    created_at TEXT NOT NULL,
    local_updated_at TEXT NOT NULL,
    remote_updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Debts table
CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    sale_id TEXT NOT NULL,
    amount REAL NOT NULL,
    amount_paid REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    local_updated_at TEXT NOT NULL,
    remote_updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Debt payments table
CREATE TABLE IF NOT EXISTS debt_payments (
    id TEXT PRIMARY KEY,
    debt_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL,
    local_updated_at TEXT NOT NULL,
    remote_updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z',
    is_deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (debt_id) REFERENCES debts(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sync ON products(local_updated_at, remote_updated_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sync ON sales(local_updated_at, remote_updated_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_debts_customer ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_sync ON debts(local_updated_at, remote_updated_at);
