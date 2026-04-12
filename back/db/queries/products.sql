-- Get all products
SELECT * FROM products;

-- Get product by ID
SELECT * FROM products WHERE id = $1;

-- Get product by name (case-insensitive search)
SELECT * FROM products WHERE name ILIKE $1;
