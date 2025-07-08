-- Initial database setup for dealership rating app
-- This script creates the basic database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Google OAuth integration)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dealerships table (cached from Google Places)
CREATE TABLE IF NOT EXISTS dealerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_place_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(512),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_rating DECIMAL(2, 1),
    google_review_count INTEGER,
    last_synced TIMESTAMP DEFAULT NOW(),
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
    is_verified BOOLEAN DEFAULT FALSE,
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
CREATE INDEX IF NOT EXISTS idx_dealerships_location ON dealerships(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reviews_dealership ON reviews(dealership_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- Insert sample data for testing
INSERT INTO dealerships (google_place_id, name, address, phone, website, latitude, longitude, google_rating, google_review_count) 
VALUES 
    ('ChIJ1234567890', 'Sunset Toyota', '1234 Sunset Blvd, Los Angeles, CA 90028', '(555) 123-4567', 'www.sunsettoyota.com', 34.0928, -118.3287, 4.8, 324),
    ('ChIJ0987654321', 'Metro Honda', '9876 Wilshire Blvd, Beverly Hills, CA 90210', '(555) 987-6543', 'www.metrohonda.com', 34.0696, -118.4006, 4.5, 189),
    ('ChIJ1122334455', 'AutoMax Used Cars', '555 Main St, Santa Monica, CA 90401', '(555) 555-0123', 'www.automax.com', 34.0195, -118.4912, 4.2, 97)
ON CONFLICT (google_place_id) DO NOTHING;