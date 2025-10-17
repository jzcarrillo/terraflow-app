-- Change default value of existing role column to ADMIN
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'ADMIN';