-- Migration: Add image_url column to rewards table
-- This migration adds support for storing reward images from Supabase Storage

-- Add image_url column to rewards table if it doesn't exist
ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN rewards.image_url IS 'URL of the reward image stored in Supabase Storage (cor-uploads bucket)';

-- Display confirmation
SELECT 'Successfully added image_url column to rewards table' as status;
