SELECT users.role, COUNT(*) AS total_users FROM users JOIN online_users ON users.id = online_users.user_id GROUP BY users.role;
