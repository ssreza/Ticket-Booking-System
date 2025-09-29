-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the Tickets (Inventory) Table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    tier VARCHAR(50) UNIQUE NOT NULL, -- VIP, FRONT_ROW, GA
    price_usd NUMERIC(10, 2) NOT NULL,
    quantity_available INTEGER NOT NULL, -- Critical field for locking
    total_quantity INTEGER NOT NULL
);

-- 2. Create the Orders (Successful Bookings) Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Mock user ID
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- PAID, FAILED, PENDING
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the Order Items (Details) Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    ticket_tier VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL
);