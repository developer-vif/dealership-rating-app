# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a dealership rating application that allows users to rate and review car dealerships. The application follows SOLID principles and is built as a monolithic full-stack application with clear separation of concerns.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI v5** (@mui/material) for design system
- **React Router v6** for navigation
- **@react-google-maps/api** for Google Maps integration
- **@tanstack/react-query** for data fetching and caching
- **Google OAuth2** for authentication
- **react-google-recaptcha** for spam protection

### Backend
- **Node.js 18** with Express.js and TypeScript
- **PostgreSQL 15** with raw SQL queries (no ORM)
- **@googlemaps/google-maps-services-js** for Google Places API
- **google-auth-library** for Google OAuth verification
- **JWT** for stateless authentication
- **Redis v4** for caching and session management
- **Joi** for request validation
- **Winston** for structured logging
- **Jest** and **Supertest** for testing

### Infrastructure
- **Docker/Docker Compose** for local development
- **PostgreSQL 15 Alpine** container
- **Redis 7 Alpine** container
- **Node 18 Alpine** containers for services

## Development Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (or Colima on macOS)
- Google OAuth2 credentials
- Google Maps API key
- reCAPTCHA keys

### Quick Start
```bash
# Clone and setup
git clone https://github.com/developer-vif/dealership-rating-app.git
cd dealership-rating-app

# Environment variables are already configured in .env
# No need to copy from .env.example

# Start Colima (macOS) or ensure Docker is running
colima start

# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost:3003
# Backend API: http://localhost:3002
# Database: localhost:5433
# Redis: localhost:6380
```

## Common Commands

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Check service status
docker-compose ps

# Database access
docker exec -it dealership_db psql -U postgres -d dealership_ratings

# Backend shell access
docker exec -it dealership_api sh

# Frontend shell access
docker exec -it dealership_web sh

# Run backend tests
docker exec -it dealership_api npm test

# Run frontend tests
docker exec -it dealership_web npm test

# Lint and type checking
docker exec -it dealership_api npm run lint
docker exec -it dealership_web npm run lint
docker exec -it dealership_web npm run type-check
```

## Architecture Notes

- **Monolithic Architecture**: Single codebase with frontend and backend in same repository
- **API-First**: RESTful APIs with consistent response format
- **Database**: PostgreSQL with raw SQL for direct control and performance
- **Authentication**: Google OAuth2 flow with JWT token management
- **Caching**: Redis for session management and API response caching
- **Security**: Input validation, CORS, rate limiting, reCAPTCHA
- **Logging**: Structured logging with Winston for debugging and monitoring

## Database Schema

### Core Tables
- `users` - Google OAuth user profiles with UUID primary keys
- `dealerships` - Simplified schema with google_place_id and name only
- `reviews` - User reviews with ratings, processing times, and verification status
- `review_votes` - Helpful/unhelpful votes on reviews

### Key Relationships
- Users can have multiple reviews (one per dealership via UNIQUE constraint)
- Reviews belong to both users and dealerships with foreign keys
- Review votes track user engagement on review helpfulness
- UUID primary keys used throughout for security

### Database Files
- `backend/database/startup.sql` - Main initialization with migration support
- `backend/database/init.sql` - Basic schema with sample data for testing

## API Endpoints

### Authentication (`/auth`)
- `GET /auth/google` - Get Google OAuth authorization URL
- `POST /auth/google` - Verify Google token and create/login user
- `POST /auth/refresh` - Refresh JWT access token
- `GET /auth/me` - Get current authenticated user profile

### Dealerships (`/api/dealerships`)
- `GET /api/dealerships/search` - Search dealerships using Google Places API
- `GET /api/dealerships/:placeId` - Get specific dealership details
- `GET /api/dealerships/nearby` - Get nearby dealerships with distance calculation
- `GET /api/dealerships/top-rated-dealerships` - Get curated top-rated dealerships

### Reviews (`/api/reviews`)
- `GET /api/reviews/:placeId` - Get paginated reviews for a dealership
- `POST /api/reviews` - Create new review (authenticated, with reCAPTCHA)
- `PUT /api/reviews/:id` - Update existing review (authenticated, own reviews only)
- `DELETE /api/reviews/:id` - Delete review (authenticated, own reviews only)

### Health Check
- `GET /health` - Service health status with database connectivity check

## Frontend Structure

### Pages
- `HomePage.tsx` - Landing page with search and top dealerships
- `DealershipsPage.tsx` - Search results with map and list views
- `DealershipDetailPage.tsx` - Individual dealership details with reviews
- `ReviewFormPage.tsx` - Create/edit review form

### Components
- **Layout**: `Navbar.tsx`, `Footer.tsx`
- **Search**: `SearchForm.tsx`, `SearchResults.tsx`, `SortControls.tsx`
- **Maps**: `DealershipMap.tsx` with Google Maps integration
- **Dealership**: `DealershipCard.tsx`, `DealerDetailsDialog.tsx`
- **Reviews**: `ReviewForm.tsx`, `ReviewCard.tsx`, `ReviewsList.tsx`
- **Auth**: `GoogleSignInButton.tsx`
- **Sections**: `MapViewSection.tsx`, `SearchResultsSection.tsx`

### Key Features
- Google Maps integration with markers and info windows
- Responsive Material-UI design
- Google OAuth authentication flow
- Real-time review submission with reCAPTCHA
- Pagination for reviews and search results
- Distance calculations and sorting
- Processing time tracking for receipts and plates

## Testing Strategy

### Backend Testing
- **Jest** with **Supertest** for API endpoint testing
- Unit tests for services and utilities
- Integration tests for database operations
- Validation testing for Joi schemas

### Frontend Testing
- **React Testing Library** for component testing
- **@testing-library/user-event** for user interaction simulation
- Unit tests for utility functions
- Integration tests for page components

### Test Commands
```bash
# Backend tests
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Frontend tests
npm test              # Interactive test runner
```

## Code Quality Standards

### Backend
- **TypeScript** with strict mode enabled
- **ESLint** with TypeScript parser and rules
- **Joi** validation for all API inputs
- **Winston** structured logging with service metadata
- Comprehensive error handling middleware
- Rate limiting with express-rate-limit
- Security headers with helmet

### Frontend
- **TypeScript** with strict type checking
- **ESLint** with React hooks and TypeScript rules
- **Material-UI** theming and responsive design
- Accessibility best practices
- Performance optimization with React.memo and useMemo
- Error boundaries for graceful error handling

## Security Implementation

### Authentication & Authorization
- **Google OAuth2** flow with server-side token verification
- **JWT tokens** with configurable expiration
- **Refresh token** mechanism for seamless user experience
- Protected routes with authentication middleware

### Input Protection
- **Joi validation** schemas for all API endpoints
- **reCAPTCHA v2** integration for review submissions
- **express-validator** for additional input sanitization
- **Rate limiting** per IP address to prevent abuse

### Data Security
- **Raw SQL queries** with parameterized statements (no ORM vulnerabilities)
- **CORS** properly configured for frontend domain
- **Helmet** security headers
- **UUID** primary keys to prevent enumeration attacks
- Environment variable management for secrets

## Performance Optimizations

### Database
- **Indexed columns** on frequently queried fields (dealership_id, user_id, rating)
- **Pagination** for large result sets
- **Connection pooling** with pg library
- **Efficient queries** with minimal data transfer

### Caching Strategy
- **Redis** for session management and API response caching
- **Google Places API** response caching to reduce API calls
- **Frontend caching** with React Query for seamless UX

### Frontend Performance
- **Code splitting** with React Router lazy loading
- **Memoization** of expensive calculations
- **Optimized bundle** with Create React App configuration
- **Image optimization** for dealership photos

## Development Guidelines

### Code Style
- Use **functional components** with hooks
- Implement **error boundaries** for component error handling
- Follow **SOLID principles** in service design
- Use **TypeScript interfaces** for type safety
- Implement **proper error handling** with try-catch blocks

### Database Operations
- Use **raw SQL** with pg library for full control
- Implement **transactions** for multi-table operations
- Use **UUID** for all primary keys
- Create **proper indexes** for query optimization

### API Design
- Follow **RESTful conventions** for endpoint naming
- Use **consistent response format** with success/error structure
- Implement **proper HTTP status codes**
- Include **request metadata** (requestId, timestamp)

## Environment Configuration

### Required Environment Variables
```bash
# Google OAuth & Maps
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/dealership_ratings

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
REACT_APP_RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3003

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Notes

### Local Development
- **Docker Compose** manages all services consistently
- **Hot reloading** enabled for both frontend and backend
- **Volume mounts** for live code changes
- **Health checks** ensure services are ready before starting dependents

### Service Ports
- **Frontend**: 3003 (mapped to container port 3000)
- **Backend**: 3002 (mapped to container port 3001)
- **Database**: 5433 (mapped to container port 5432)
- **Redis**: 6380 (mapped to container port 6379)

### Container Health
- **PostgreSQL**: Health check with pg_isready
- **Redis**: Health check with redis-cli ping
- **Service Dependencies**: Backend waits for healthy database and Redis

## Troubleshooting

### Common Issues
1. **Docker not running**: Ensure Docker daemon is active (use `colima start` on macOS)
2. **Port conflicts**: Check if ports 3002, 3003, 5433, 6380 are available
3. **Environment variables**: Verify .env file has all required variables
4. **Google API quotas**: Check Google Cloud Console for API usage limits
5. **Database connection**: Verify PostgreSQL container is healthy

### Debugging Commands
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Database debugging
docker exec -it dealership_db psql -U postgres -d dealership_ratings -c "SELECT * FROM users LIMIT 5;"

# Redis debugging
docker exec -it dealership_cache redis-cli ping
```