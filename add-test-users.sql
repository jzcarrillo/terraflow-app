-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'ADMIN';

-- Insert test users with different roles
-- Passwords: password, cashier123, processor123
INSERT INTO users (username, email_address, password_hash, first_name, last_name, role, status) 
VALUES 
  ('admin', 'admin@example.com', '$2a$10$DmuIyRovRhlQDwNQl5fcQeGk9ysnLtPM0Kx6Y9vAVcm7aKLmERDyi', 'Admin', 'User', 'ADMIN', 'ACTIVE'),
  ('cashier1', 'cashier1@example.com', '$2a$10$Eh1F8Jhan3J5WhGfnDShwO1N7xzggFOb8pRvswa5nr4wQ4/SFQmsm', 'John', 'Cashier', 'CASHIER', 'ACTIVE'),
  ('processor1', 'processor1@example.com', '$2a$10$ZPFlssi6GEQZK8VkEaHKMu9uSo2HtOaiNMVOaQqYGj0j8j3yk574i', 'Jane', 'Processor', 'LAND_TITLE_PROCESSOR', 'ACTIVE')
ON CONFLICT (username) DO UPDATE SET 
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;