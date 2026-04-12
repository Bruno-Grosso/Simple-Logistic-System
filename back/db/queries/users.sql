-- Get all users
SELECT * FROM users;

-- Get user by ID
SELECT * FROM users WHERE id = $1;

-- Get users by role
SELECT * FROM users WHERE role = $1;

-- Get all online users
SELECT * FROM online_users;

-- Get online sessions for a specific user
SELECT * FROM online_users WHERE user_id = $1;
