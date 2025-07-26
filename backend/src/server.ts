import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { testConnection } from './utils/database';
import authRoutes from './routes/auth';
import dealershipRoutes from './routes/dealerships';
import reviewRoutes from './routes/reviews';
import healthRoutes from './routes/health';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;


// Security middleware - configure for OAuth
app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env['FRONTEND_URL'] || 'http://localhost',
      'https://accounts.google.com',
      'https://orcr-agad.com',
      'https://www.orcr-agad.com',
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:3003'
    ];
    
    if (allowedOrigins.includes(origin)) {
      logger.info(`CORS: Allowing origin ${origin}`);
      return callback(null, true);
    } else {
      logger.warn(`CORS: Blocking origin ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept', 'Origin'],
  exposedHeaders: ['X-Request-ID'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false // Pass control to the next handler
}));

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication requests per window
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Explicit preflight handler for CORS
app.options('*', (req, res) => {
  logger.info(`OPTIONS request from ${req.headers.origin} to ${req.url}`);
  res.status(200).end();
});


// Routes
app.use('/health', healthRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/dealerships', dealershipRoutes);
app.use('/reviews', reviewRoutes);
app.use('/admin', limiter, adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (process.env['NODE_ENV'] !== 'test') {
  app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }
  });
}

export default app;