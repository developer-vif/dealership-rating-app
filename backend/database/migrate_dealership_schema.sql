-- Migration script to simplify dealership table schema
-- This will remove unnecessary columns and keep only google_place_id and name

-- Create a backup table first (optional, for safety)
CREATE TABLE IF NOT EXISTS dealerships_backup AS SELECT * FROM dealerships;

-- Drop the columns we don't need
ALTER TABLE dealerships DROP COLUMN IF EXISTS address;
ALTER TABLE dealerships DROP COLUMN IF EXISTS phone;
ALTER TABLE dealerships DROP COLUMN IF EXISTS website;
ALTER TABLE dealerships DROP COLUMN IF EXISTS latitude;
ALTER TABLE dealerships DROP COLUMN IF EXISTS longitude;
ALTER TABLE dealerships DROP COLUMN IF EXISTS google_rating;
ALTER TABLE dealerships DROP COLUMN IF EXISTS google_review_count;
ALTER TABLE dealerships DROP COLUMN IF EXISTS last_synced;

-- The final schema should only have:
-- - id (UUID, primary key)
-- - google_place_id (VARCHAR, unique)
-- - name (VARCHAR)
-- - created_at (TIMESTAMP)

-- Verify the current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'dealerships'
ORDER BY ordinal_position;