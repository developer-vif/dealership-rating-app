# 🚗 Dealership Rating Application

A comprehensive full-stack web application that allows users to rate and review car dealerships based on their document processing efficiency. Built with modern technologies and following SOLID principles for scalable, maintainable code.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Development Setup](#-development-setup)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔍 **Dealership Search & Discovery**
- **Google Places Integration**: Search dealerships using Google's comprehensive database
- **Interactive Map View**: Visual exploration with custom markers and info windows
- **Location-Based Search**: Find nearby dealerships with distance calculations
- **Advanced Filtering**: Sort by rating, distance, and processing efficiency

### ⭐ **Enhanced Rating System**
- **Dual Time-Based Sliders**: Rate receipt and plates processing times separately
- **Automatic Rating Calculation**: Smart conversion from processing times to 1-5 star ratings
- **Visual Feedback**: Color-coded gradient sliders with real-time updates
- **Multiple Rating Interfaces**: Three alternative rating systems for testing and comparison

### 🔐 **Secure Authentication**
- **Google OAuth2**: Seamless sign-in with Google accounts
- **JWT Tokens**: Stateless authentication with refresh token support
- **reCAPTCHA Protection**: Spam prevention on review submissions
- **Anonymous Reviews**: Privacy-focused review system with generated usernames

### 📱 **Modern User Experience**
- **Responsive Design**: Mobile-first approach with Material-UI components
- **Real-Time Updates**: Instant feedback and live data synchronization
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Progressive Web App**: Fast loading with efficient caching strategies

### 🛡️ **Security & Performance**
- **Input Validation**: Comprehensive Joi schema validation
- **Rate Limiting**: Protection against abuse and spam
- **Structured Logging**: Winston-based logging for monitoring and debugging
- **Database Security**: Parameterized queries and connection pooling

## 🛠 Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Framework |
| TypeScript | 4.9+ | Type Safety |
| Material-UI | 5.14+ | Design System |
| React Router | 6.18+ | Navigation |
| React Query | 5.8+ | Data Fetching |
| Google Maps API | Latest | Maps Integration |

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime Environment |
| Express.js | 4.18+ | Web Framework |
| TypeScript | 4.9+ | Type Safety |
| PostgreSQL | 15 | Primary Database |
| Redis | 7 | Caching & Sessions |
| JWT | Latest | Authentication |

### **Infrastructure**
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local Development |
| Nginx | Reverse Proxy |
| Winston | Logging |
| Jest | Testing Framework |

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Docker & Docker Compose** (or Colima on macOS)
- **Google Cloud Account** (for OAuth2 and Maps API)
- **reCAPTCHA Keys** (for spam protection)

### 1. Clone Repository
```bash
git clone https://github.com/developer-vif/dealership-rating-app.git
cd dealership-rating-app
```

### 2. Environment Setup
The application comes with pre-configured environment variables. No need to copy from `.env.example`.

### 3. Start Services
```bash
# Start Colima (macOS only)
colima start

# Launch all services
docker-compose up -d
```

### 4. Access Application
- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3002
- **Database**: localhost:5433
- **Redis**: localhost:6380

### 5. Test Alternative Rating Systems
- **Rating Test Hub**: http://localhost:3003/test/ratings
- **Star Rating**: http://localhost:3003/test/rating-stars
- **Dual Sliders**: http://localhost:3003/test/rating-slider
- **Button Rating**: http://localhost:3003/test/rating-buttons

## 🏗 Development Setup

### **Local Development Commands**

```bash
# View all service logs
docker-compose logs -f

# Check service status
docker-compose ps

# Access database
docker exec -it dealership_db psql -U postgres -d dealership_ratings

# Backend shell access
docker exec -it dealership_api sh

# Frontend shell access
docker exec -it dealership_web sh

# Run tests
docker exec -it dealership_api npm test
docker exec -it dealership_web npm test

# Linting and type checking
docker exec -it dealership_api npm run lint
docker exec -it dealership_web npm run lint
docker exec -it dealership_web npm run type-check
```

### **Hot Reloading**
Both frontend and backend support hot reloading for rapid development:
- **Frontend**: Automatic reload on file changes
- **Backend**: Nodemon restarts on TypeScript changes
- **Database**: Persistent data with volume mounting

## 🏛 Architecture

### **System Overview**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   React + TS    │◄──►│   Express + TS  │◄──►│   PostgreSQL    │
│   Port: 3003    │    │   Port: 3002    │    │   Port: 5433    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│     Redis       │◄─────────────┘
                        │   Cache/Session │
                        │   Port: 6380    │
                        └─────────────────┘
```

### **Database Schema**
```sql
-- Core Tables
users               # Google OAuth user profiles (UUID primary keys)
dealerships         # Simplified schema with google_place_id
reviews            # User reviews with processing time ratings
review_votes       # Helpful/unhelpful votes on reviews

-- Key Relationships
users 1:N reviews
dealerships 1:N reviews
reviews 1:N review_votes
```

### **API Structure**
```
/api/
├── auth/           # Authentication endpoints
├── dealerships/    # Dealership search and details
├── reviews/        # Review CRUD operations
└── health/         # System health checks
```

## 📡 API Documentation

### **Authentication Endpoints**
```http
GET  /auth/google              # Get OAuth authorization URL
POST /auth/google              # Verify Google token
POST /auth/refresh             # Refresh JWT access token
GET  /auth/me                  # Get user profile
```

### **Dealership Endpoints**
```http
GET  /api/dealerships/search                    # Search with Google Places
GET  /api/dealerships/:placeId                  # Get dealership details
GET  /api/dealerships/nearby                    # Find nearby dealerships
GET  /api/dealerships/top-rated-dealerships     # Get curated top dealers
```

### **Review Endpoints**
```http
GET    /api/reviews/:placeId    # Get paginated reviews
POST   /api/reviews             # Create review (auth required)
PUT    /api/reviews/:id         # Update review (auth required)
DELETE /api/reviews/:id         # Delete review (auth required)
```

### **Response Format**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "requestId": "req-uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing

### **Running Tests**
```bash
# Backend unit tests
docker exec -it dealership_api npm test

# Frontend component tests
docker exec -it dealership_web npm test

# Coverage reports
docker exec -it dealership_api npm run test:coverage
docker exec -it dealership_web npm test -- --coverage

# Watch mode for development
docker exec -it dealership_api npm run test:watch
```

### **Test Structure**
```
backend/src/
├── __tests__/              # Unit tests
├── utils/test.test.ts       # Test utilities
└── services/__tests__/      # Service tests

frontend/src/
├── components/__tests__/    # Component tests
├── utils/__tests__/         # Utility tests
└── services/__tests__/      # Service tests
```

### **Testing Strategy**
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **Component Tests**: React component behavior
- **E2E Tests**: Critical user flows (planned)

## 🚀 Deployment

### **Production Build**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### **Environment Variables**
```bash
# Required for production
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-secret
GOOGLE_MAPS_API_KEY=your-maps-api-key
JWT_SECRET=your-jwt-secret
RECAPTCHA_SECRET_KEY=your-recaptcha-secret

# Database configuration
DATABASE_URL=postgresql://user:pass@host:port/dbname
REDIS_URL=redis://host:port

# Application settings
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### **Deployment Options**
- **AWS ECS**: Container orchestration with CloudFormation
- **Docker Swarm**: Multi-node container deployment
- **Kubernetes**: Scalable microservice architecture
- **Traditional VPS**: Docker Compose on virtual machines

## 🎨 Rating System Alternatives

The application includes three rating input alternatives for user testing:

### **1. Direct Star Rating** (`/test/rating-stars`)
- Traditional 5-star selection interface
- Universal understanding and high accessibility
- Quick selection with immediate visual feedback

### **2. Dual Time-Based Sliders** (`/test/rating-slider`)
- Separate sliders for receipt and plates processing times
- Real-world time labels ("> 2 months", "< 1 week", etc.)
- Automatic rating calculation based on efficiency

### **3. Button Group Rating** (`/test/rating-buttons`)
- Large touch-friendly buttons with emoji feedback
- Descriptive labels (Poor, Fair, Good, Very Good, Excellent)
- Mobile-optimized with multiple display variants

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow coding standards and add tests
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### **Coding Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and Node.js
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages
- **SOLID Principles**: Object-oriented design patterns

### **Pull Request Requirements**
- ✅ All tests passing
- ✅ Code coverage maintained
- ✅ ESLint warnings resolved
- ✅ TypeScript compilation successful
- ✅ Documentation updated

## 📚 Additional Resources

### **Documentation**
- [Architecture Guide](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Guide](deployment/README.md)
- [Contributing Guidelines](CONTRIBUTING.md)

### **Project Structure**
```
dealership-rating-app/
├── frontend/               # React TypeScript frontend
├── backend/               # Express TypeScript API
├── database/              # PostgreSQL schemas and migrations
├── docs/                  # Documentation and guides
├── deployment/            # Docker and deployment configurations
├── wireframes/           # UI mockups and prototypes
└── docker-compose.yml    # Development environment setup
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Maps Platform** for location services and mapping
- **Material-UI** for the comprehensive design system
- **PostgreSQL** for robust data persistence
- **Docker** for containerized development
- **TypeScript** for enhanced developer experience

---

**Made with ❤️ for the automotive community**

For questions, issues, or feature requests, please [open an issue](https://github.com/developer-vif/dealership-rating-app/issues) or [start a discussion](https://github.com/developer-vif/dealership-rating-app/discussions).