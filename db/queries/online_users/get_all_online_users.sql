SELECT users.id, users.name, users.role, users.address FROM users JOIN online_users ON users.id = online_users.user_id ORDER BY users.name ASC;
