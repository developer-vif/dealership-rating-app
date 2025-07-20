import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { verifyGoogleToken, getGoogleAuthUrl } from '../utils/googleAuth';
import { generateToken, refreshToken as refreshJwtToken, verifyToken, blacklistToken } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';
import userService from '../services/userService';

const router = Router();

// GET /auth/google - Get Google OAuth URL
router.get('/google', async (_req: Request, res: Response) => {
  try {
    const authUrl = getGoogleAuthUrl();
    
    res.status(200).json({
      success: true,
      data: {
        authUrl,
        message: 'Redirect user to this URL for Google OAuth'
      },
      meta: {
        requestId: _req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Google OAuth URL generation error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while generating OAuth URL'
      }
    });
  }
});

// POST /auth/google - Verify Google token and authenticate user
router.post('/google', async (req: Request, res: Response) => {
  try {
    logger.info('Google OAuth request received', { 
      hasToken: !!req.body.token,
      bodyKeys: Object.keys(req.body),
      origin: req.headers.origin,
      referer: req.headers.referer 
    });

    const { token } = req.body;
    
    if (!token) {
      logger.warn('Missing Google token in OAuth request', { body: req.body });
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Google ID token is required'
        }
      });
    }

    // Verify Google token
    logger.info('Attempting to verify Google token', { tokenLength: token.length });
    const googleUser = await verifyGoogleToken(token);
    logger.info('Google token verified successfully', { googleId: googleUser.id, email: googleUser.email });
    
    // Get or create user in database
    const dbUser = await userService.getOrCreateUser({
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    });
    
    // Generate JWT token with database user ID
    const jwtToken = generateToken({
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.avatarUrl || undefined,
      isAdmin: dbUser.isAdmin,
    });

    logger.info('User authenticated via Google OAuth', { 
      userId: dbUser.id, 
      googleId: dbUser.googleId,
      email: dbUser.email 
    });
    
    res.status(200).json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          picture: dbUser.avatarUrl,
          isAdmin: dbUser.isAdmin,
          verified: googleUser.verified_email
        }
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Google OAuth error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tokenReceived: !!req.body.token
    });
    res.status(400).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Google authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    const newToken = await refreshJwtToken(token);
    const decoded = await verifyToken(newToken);
    
    logger.info('JWT token refreshed', { userId: decoded.userId });
    
    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          isAdmin: decoded.isAdmin
        }
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('JWT refresh error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(400).json({
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: 'Token refresh failed'
      }
    });
  }
});

router.delete('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Blacklist the current token to prevent further use
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await blacklistToken(token);
    }
    
    logger.info('User logged out successfully', { 
      userId: req.user?.userId || 'unknown',
      ip: req.ip 
    });
    
    res.status(200).json({
      success: true,
      data: { 
        message: 'Logged out successfully',
        note: 'Token has been invalidated'
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Logout error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during logout'
      }
    });
  }
});

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    logger.info('Get current user request', { userId: req.user.userId });
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.userId,
          email: req.user.email,
          name: req.user.name,
          picture: req.user.picture,
          isAdmin: req.user.isAdmin
        }
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get current user error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching user information'
      }
    });
  }
});

export default router;