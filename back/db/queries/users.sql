-- Get all users
SELECT * FROM users;

-- Get user by ID
SELECT * FROM users WHERE id = $1;

-- Get users by role
SELECT * FROM users WHERE role = $1;

-- Get all truck drivers with wages
SELECT id, name, role, wage, address FROM users WHERE role = 'truck_driver';

-- Get average driver wage
SELECT AVG(wage) as avg_driver_wage FROM users WHERE role = 'truck_driver';

-- Update user wage
UPDATE users SET wage = $2 WHERE id = $1 RETURNING *;

-- Get all online users
SELECT * FROM online_users;

-- Get online sessions for a specific user
SELECT * FROM online_users WHERE user_id = $1;
