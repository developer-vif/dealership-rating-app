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

-- Dealerships table (simplified)
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

-- Indexes for performance (removed location index since we don't have lat/lng)
CREATE INDEX IF NOT EXISTS idx_reviews_dealership ON reviews(dealership_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- Insert sample data for testing (simplified)
INSERT INTO dealerships (google_place_id, name) 
VALUES 
    ('ChIJ1234567890', 'Sunset Toyota'),
    ('ChIJ0987654321', 'Metro Honda'),
    ('ChIJ1122334455', 'AutoMax Used Cars')
ON CONFLICT (google_place_id) DO NOTHING;

-- Insert sample user for testing
INSERT INTO users (id, google_id, email, name, avatar_url) 
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'mock_google_123', 'testuser@example.com', 'Test User', 'https://via.placeholder.com/40x40?text=TU'),
    ('550e8400-e29b-41d4-a716-446655440001', 'mock_google_456', 'sarah.m@example.com', 'Sarah M.', 'https://via.placeholder.com/40x40?text=SM'),
    ('550e8400-e29b-41d4-a716-446655440002', 'mock_google_789', 'john.l@example.com', 'John L.', 'https://via.placeholder.com/40x40?text=JL')
ON CONFLICT (google_id) DO NOTHING;

-- Insert sample reviews for testing
INSERT INTO reviews (user_id, dealership_id, rating, title, content, receipt_processing_time, plates_processing_time, visit_date, helpful_votes) 
VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440001', 
        (SELECT id FROM dealerships WHERE google_place_id = 'ChIJ1234567890'),
        5,
        'Amazing experience buying my first car!',
        'Just bought my first car here and the staff was incredibly helpful. No pressure sales tactics and they explained everything clearly. The financing process was smooth and they got me a great rate.',
        'same-day',
        '1-week',
        '2024-01-15',
        12
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002', 
        (SELECT id FROM dealerships WHERE google_place_id = 'ChIJ1234567890'),
        5,
        'Excellent service department',
        'Been bringing my Camry here for service for 3 years now. They always explain what needs to be done and why. No upselling or pressure for unnecessary work.',
        'same-day',
        'same-day',
        '2024-01-10',
        8
    ),
    (
        '550e8400-e29b-41d4-a716-446655440001', 
        (SELECT id FROM dealerships WHERE google_place_id = 'ChIJ0987654321'),
        4,
        'Good experience overall',
        'Bought a used Prius here last month. The car was in great condition and priced fairly. Sales process took a bit longer than expected.',
        '1-week',
        '2-weeks',
        '2024-01-05',
        5
    )
ON CONFLICT (user_id, dealership_id) DO NOTHING;