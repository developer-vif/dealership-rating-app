# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a dealership rating application that allows users to rate and review car dealerships. The application follows SOLID principles and is built with a microservices architecture for scalability and maintainability.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI v5** for design system
- **Google Maps JavaScript API** for interactive maps
- **Google OAuth2** for authentication

### Backend
- **Node.js 18** with Express.js and TypeScript
- **PostgreSQL 15** with Prisma ORM
- **JWT** for stateless authentication
- **Redis** for caching (optional)

### Infrastructure
- **Podman** for local development
- **AWS ECS Fargate** for production deployment
- **AWS RDS PostgreSQL** for managed database
- **CloudFormation** for infrastructure as code

## Development Setup

### Prerequisites
- Node.js 18+
- Podman and Podman Compose
- Google OAuth2 credentials
- Google Maps API key

### Quick Start
```bash
# Clone and setup
git clone https://github.com/developer-vif/dealership-rating-app.git
cd dealership-rating-app

# Copy environment variables
cp .env.example .env
# Edit .env with your Google credentials

# Start all services
podman-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## Common Commands

### Local Development
```bash
# Start all services
podman-compose up -d

# View logs
podman-compose logs -f

# Stop services
podman-compose down

# Database migrations
podman exec -it dealership_api npm run migrate:up

# Run tests
podman exec -it dealership_api npm test
```

### Production Deployment
```bash
# Deploy infrastructure
aws cloudformation deploy --template-file deployment/aws/cloudformation.yml --stack-name dealership-app

# Build and push images
./scripts/deploy.sh

# Update ECS service
aws ecs update-service --cluster dealership-app-cluster --service dealership-app-service
```

## Architecture Notes

- **Microservices**: Separate services for authentication, dealership data, and reviews
- **API-First**: RESTful APIs with OpenAPI documentation
- **Database**: PostgreSQL with proper indexing and relationships
- **Caching**: Redis for session management and API response caching
- **Security**: JWT tokens, input validation, and CORS configuration
- **Monitoring**: Health checks, structured logging, and CloudWatch integration

See `docs/architecture.md` for detailed system design.

## Database Schema

### Core Tables
- `users` - Google OAuth user profiles
- `dealerships` - Cached Google Places data
- `reviews` - User reviews and ratings
- `review_votes` - Helpful/unhelpful votes

### Key Relationships
- Users can have multiple reviews (one per dealership)
- Reviews belong to both users and dealerships
- Review votes track user engagement

See `backend/database/schema.sql` for complete schema definition.

## API Endpoints

### Authentication
- `POST /auth/google` - Initiate Google OAuth
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/me` - Get current user

### Dealerships
- `GET /api/dealerships/search` - Search by location
- `GET /api/dealerships/:placeId` - Get dealership details
- `GET /api/dealerships/nearby` - Get nearby dealerships

### Reviews
- `GET /api/reviews/:placeId` - Get dealership reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## Testing Strategy

### Unit Tests
- Backend: Jest with Supertest
- Frontend: React Testing Library
- Minimum 80% code coverage

### Integration Tests
- API endpoints with test database
- Google Maps API integration
- Authentication flows

### E2E Tests
- Critical user journeys with Playwright
- Cross-browser compatibility testing

## Code Quality Standards

### Backend
- TypeScript strict mode
- ESLint + Prettier configuration
- Joi validation for all inputs
- Winston structured logging
- Error handling middleware

### Frontend
- TypeScript strict mode
- React best practices
- Accessibility compliance (WCAG 2.1)
- Responsive design patterns
- Performance optimization

## Security Considerations

- **Authentication**: Google OAuth2 with JWT tokens
- **Authorization**: Role-based access control
- **Input Validation**: Joi schemas for all API inputs
- **SQL Injection**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CORS**: Properly configured for frontend domain
- **Secrets**: AWS Secrets Manager for production
- **HTTPS**: SSL termination at load balancer level

## Performance Optimization

- **Database**: Proper indexing and query optimization
- **Caching**: Redis for frequently accessed data
- **CDN**: CloudFront for static assets
- **Lazy Loading**: React components and API calls
- **Compression**: Gzip compression for API responses
- **Connection Pooling**: Database connection optimization

## Monitoring and Logging

- **Health Checks**: `/health` endpoint for all services
- **Structured Logging**: Winston with JSON format
- **Metrics**: CloudWatch for AWS services
- **Error Tracking**: Centralized error handling
- **Performance**: Response time and throughput monitoring

## Deployment Guidelines

### Local Development
- Use Podman Compose for consistent environment
- Mock external APIs when possible
- Use test database for development

### Staging/Production
- Deploy via CloudFormation templates
- Use AWS Secrets Manager for sensitive data
- Implement blue-green deployments
- Monitor deployment health and rollback if needed

## Cost Optimization

### AWS Services
- Fargate Spot instances for development
- Single AZ RDS for cost savings
- CloudFront for reduced data transfer costs
- Right-sizing based on actual usage metrics

### Estimated Monthly Costs
- Development: ~$20/month
- Production: ~$44/month (with moderate traffic)

See `deployment/README.md` for detailed deployment instructions and cost breakdown.