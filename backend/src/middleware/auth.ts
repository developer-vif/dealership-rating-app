import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        },
        meta: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const decoded = await verifyToken(token);
    req.user = decoded;
    
    logger.info('User authenticated', { 
      userId: decoded.userId, 
      email: decoded.email 
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await verifyToken(token);
      req.user = decoded;
      logger.info('Optional auth: User authenticated', { 
        userId: decoded.userId, 
        email: decoded.email 
      });
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail the request if token is invalid
    logger.debug('Optional auth: Invalid token ignored', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    next();
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        },
        meta: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      logger.warn('Admin access denied', { 
        userId: req.user.userId,
        email: req.user.email,
        ip: req.ip
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'ADMIN_REQUIRED',
          message: 'Administrator privileges required'
        },
        meta: {
          requestId: req.headers['x-request-id'] || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    logger.info('Admin access granted', { 
      userId: req.user.userId, 
      email: req.user.email 
    });
    
    next();
  } catch (error) {
    logger.error('Admin authorization failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Authorization check failed'
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
};