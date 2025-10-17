-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'ADMIN';

-- Update all existing users to have ADMIN role
UPDATE users SET role = 'ADMIN';