-- One-time migration for databases created before `users.email` existed.
-- After running, refill or verify data; then optionally enforce uniqueness in your tooling.

ALTER TABLE users ADD COLUMN email TEXT;

UPDATE users SET email = 'alice.admin@example.com' WHERE id = 'USR-001';
UPDATE users SET email = 'bob.worker@example.com' WHERE id = 'USR-002';
UPDATE users SET email = 'charlie.driver@example.com' WHERE id = 'USR-003';
UPDATE users SET email = 'david.client@example.com' WHERE id = 'USR-004';
UPDATE users SET email = 'eve.client@example.com' WHERE id = 'USR-005';
UPDATE users SET email = 'frank.driver@example.com' WHERE id = 'USR-006';
UPDATE users SET email = 'grace.worker@example.com' WHERE id = 'USR-007';
UPDATE users SET email = 'henry.client@example.com' WHERE id = 'USR-008';
UPDATE users SET email = 'ivy.client@example.com' WHERE id = 'USR-009';
UPDATE users SET email = 'jack.worker@example.com' WHERE id = 'USR-010';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
