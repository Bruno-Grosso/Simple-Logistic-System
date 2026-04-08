SELECT id, name, email, password, role FROM users WHERE LOWER(email) = LOWER(?);
