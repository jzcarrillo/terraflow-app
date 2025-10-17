-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'ADMIN';

-- Update existing users to have ADMIN role
UPDATE users SET role = 'ADMIN' WHERE role IS NULL;