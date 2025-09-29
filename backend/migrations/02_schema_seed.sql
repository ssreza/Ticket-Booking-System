INSERT INTO tickets (tier, price_usd, quantity_available, total_quantity) VALUES
('VIP', 100.00, 10, 10),
('FRONT_ROW', 50.00, 50, 50),
('GA', 10.00, 200, 200)
ON CONFLICT (tier) DO NOTHING; -- Prevents re-insertion if running migrations multiple times