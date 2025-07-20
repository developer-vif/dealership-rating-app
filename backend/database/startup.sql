-- Database startup script for dealership rating app
-- This script handles both fresh initialization and schema migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dedicated application user with limited privileges
DO $$
BEGIN
    -- Create user if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dealership_app') THEN
        CREATE USER dealership_app WITH PASSWORD 'dealership_app_secure_2024!';
        RAISE NOTICE 'Created dealership_app user';
    ELSE
        RAISE NOTICE 'dealership_app user already exists';
    END IF;
    
    -- Grant necessary permissions
    GRANT CONNECT ON DATABASE dealership_ratings TO dealership_app;
    GRANT USAGE ON SCHEMA public TO dealership_app;
    
    -- Grant table permissions (these will apply to existing and future tables)
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dealership_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dealership_app;
    
    -- Grant default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dealership_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dealership_app;
    
    RAISE NOTICE 'Granted permissions to dealership_app user';
END $$;

-- Check if we need to migrate existing schema
DO $$
BEGIN
    -- Check if dealerships table exists with old schema (has address column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dealerships' AND column_name = 'address'
    ) THEN
        -- Migration needed: backup existing data and migrate schema
        RAISE NOTICE 'Existing dealerships table found with old schema. Performing migration...';
        
        -- Create backup table
        CREATE TABLE IF NOT EXISTS dealerships_backup AS SELECT * FROM dealerships;
        
        -- Drop the columns we don't need (keeping data integrity)
        ALTER TABLE dealerships DROP COLUMN IF EXISTS address;
        ALTER TABLE dealerships DROP COLUMN IF EXISTS phone;
        ALTER TABLE dealerships DROP COLUMN IF EXISTS website;
        ALTER TABLE dealerships DROP COLUMN IF EXISTS latitude;
        ALTER TABLE dealerships DROP COLUMN IF EXISTS longitude;
        ALTER TABLE dealerships DROP COLUMN IF EXISTS google_rating;
        ALTER TABLE dealerships DROP COLUMN IF EXISTS google_review_count;
        ALTER TABLE dealerships DROP COLUMN IF EXISTS last_synced;
        
        RAISE NOTICE 'Schema migration completed successfully.';
    ELSE
        RAISE NOTICE 'Creating fresh database schema...';
    END IF;
    
    -- Note: is_admin column is included in the users table creation below
END $$;

-- Users table (Google OAuth integration)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dealerships table (simplified schema)
CREATE TABLE IF NOT EXISTS dealerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_place_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    receipt_processing_time VARCHAR(50),
    plates_processing_time VARCHAR(50),
    visit_date DATE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, dealership_id) -- One review per user per dealership
);

-- Review votes table
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_dealership ON reviews(dealership_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- No sample data inserted - database starts clean for production use

-- Display final schema for verification
\echo 'Database initialization completed successfully!'
\echo 'Final dealerships table schema:'
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'dealerships'
ORDER BY ordinal_position;