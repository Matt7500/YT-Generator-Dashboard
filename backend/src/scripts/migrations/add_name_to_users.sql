-- Add name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update existing users to have a default name based on their email
UPDATE users SET name = SPLIT_PART(email, '@', 1) WHERE name IS NULL; 