-- Check if role column exists in users table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show all users with their columns
SELECT * FROM users LIMIT 5;