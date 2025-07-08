# System Architecture

## Overview
Dealership Rating App is a modern web application built with microservices architecture, designed for scalability and maintainability following SOLID principles.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React SPA)   │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐              
│   Google OAuth  │    │  Google Maps    │              
│   & SSO         │    │  Places API     │              
└─────────────────┘    └─────────────────┘              
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI v5** for consistent design system
- **React Router v6** for client-side routing
- **React Query** for API state management
- **Google Maps JavaScript API** for interactive maps
- **Google OAuth2** for authentication

### Backend
- **Node.js 18** with Express.js
- **TypeScript** for type safety
- **JWT** for stateless authentication
- **Joi** for request validation
- **Winston** for structured logging
- **Jest** for unit testing

### Database
- **PostgreSQL 15** for relational data
- **Prisma** as ORM for type-safe database access
- **Redis** for session caching (optional)

### DevOps & Infrastructure
- **Podman** for containerization
- **Docker Compose** for local orchestration
- **AWS ECS Fargate** for production deployment
- **AWS RDS PostgreSQL** for managed database
- **CloudFront + S3** for static asset delivery

## Detailed Component Design

### 1. Authentication Service
**Responsibility:** Handle user authentication and authorization

**Key Features:**
- Google OAuth2 integration
- JWT token generation and validation
- User profile management
- Session management

**API Endpoints:**
```
POST /auth/google          # Initiate Google OAuth
POST /auth/google/callback # Handle OAuth callback
POST /auth/refresh         # Refresh JWT token
DELETE /auth/logout        # Logout user
GET /auth/me              # Get current user profile
```

### 2. Dealership Service
**Responsibility:** Proxy Google Places API and manage dealership data

**Key Features:**
- Search dealerships using Google Places API
- Cache frequently accessed dealership data
- Provide unified dealership information
- Handle location-based queries

**API Endpoints:**
```
GET /api/dealerships/search    # Search dealerships by location
GET /api/dealerships/:placeId  # Get dealership details
GET /api/dealerships/nearby    # Get nearby dealerships
```

### 3. Review Service
**Responsibility:** Manage user reviews and ratings

**Key Features:**
- CRUD operations for reviews
- Rating aggregation and analytics
- Review validation and moderation
- User review history

**API Endpoints:**
```
GET /api/reviews/:placeId      # Get reviews for dealership
POST /api/reviews              # Create new review
PUT /api/reviews/:id           # Update review
DELETE /api/reviews/:id        # Delete review
GET /api/reviews/user/:userId  # Get user's reviews
```

## Database Schema

### Core Tables

```sql
-- Users table (Google OAuth integration)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dealerships table (cached from Google Places)
CREATE TABLE dealerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_dealerships_location ON dealerships(latitude, longitude);
CREATE INDEX idx_reviews_dealership ON reviews(dealership_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

## Security & Performance

### Security Measures
- **JWT tokens** with short expiration times
- **CORS configuration** for frontend-backend communication
- **Input validation** using Joi schemas
- **SQL injection protection** via Prisma ORM
- **Rate limiting** on API endpoints
- **Google OAuth2** for secure authentication

### Performance Optimizations
- **Database indexing** on frequently queried columns
- **API response caching** for dealership data
- **CDN delivery** for static assets
- **Lazy loading** for large data sets
- **Database connection pooling**

## Error Handling & Monitoring

### Error Handling Strategy
- **Centralized error middleware** in Express
- **Custom error classes** for different error types
- **Structured error responses** following RFC 7807
- **Graceful degradation** for external API failures

### Monitoring & Logging
- **Winston** for structured logging
- **Health check endpoints** for service monitoring
- **Performance metrics** collection
- **Error tracking** and alerting

## Testing Strategy

### Unit Testing
- **Jest** for backend unit tests
- **React Testing Library** for frontend component tests
- **Minimum 80% code coverage** requirement

### Integration Testing
- **Supertest** for API endpoint testing
- **Test containers** for database integration tests

### End-to-End Testing
- **Playwright** for critical user flows
- **Automated testing** in CI/CD pipeline

## API Design Principles

### RESTful Design
- **Resource-based URLs** (/api/reviews, /api/dealerships)
- **HTTP verbs** for operations (GET, POST, PUT, DELETE)
- **Consistent response formats** with standard HTTP status codes
- **Pagination** for large data sets

### Request/Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "rating",
        "message": "Rating must be between 1 and 5"
      }
    ]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

This architecture ensures maintainability, scalability, and follows the SOLID principles outlined in your development guidelines.