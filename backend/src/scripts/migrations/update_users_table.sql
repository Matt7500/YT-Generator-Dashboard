-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
        -- Update existing users to have a default name based on their email
        UPDATE users SET name = SPLIT_PART(email, '@', 1) WHERE name IS NULL;
    END IF;
END $$; 