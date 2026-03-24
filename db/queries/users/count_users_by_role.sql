SELECT role, COUNT(*) AS total
FROM users
GROUP BY role;
