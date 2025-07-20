import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { redisClient } from './redis';

const jwtSecret = process.env['JWT_SECRET'];
const jwtExpiresIn = process.env['JWT_EXPIRES_IN'] || '24h';

if (!jwtSecret) {
  logger.error('JWT secret not configured');
  throw new Error('JWT secret is required');
}

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  picture?: string;
  isAdmin?: boolean;
  jti: string; // JWT ID for blacklisting
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti'>): string => {
  try {
    const tokenPayload = {
      ...payload,
      jti: uuidv4() // Generate unique JWT ID
    };
    
    return jwt.sign(tokenPayload, jwtSecret, { 
      expiresIn: jwtExpiresIn 
    } as jwt.SignOptions);
  } catch (error) {
    logger.error('JWT token generation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to generate token');
  }
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Check if token is blacklisted
    if (decoded.jti) {
      const isBlacklisted = await redisClient.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }
    }
    
    return decoded;
  } catch (error) {
    logger.error('JWT token verification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Invalid or expired token');
  }
};

export const refreshToken = async (oldToken: string): Promise<string> => {
  try {
    // Verify the old token (this will also check blacklist)
    const decoded = await verifyToken(oldToken);
    
    // Blacklist the old token
    if (decoded.jti && decoded.exp) {
      const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
      if (remainingTime > 0) {
        await redisClient.blacklistToken(decoded.jti, remainingTime);
      }
    }
    
    // Create new token with fresh expiration and new JTI
    const newPayload: Omit<JwtPayload, 'iat' | 'exp' | 'jti'> = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      isAdmin: decoded.isAdmin,
    };
    
    return generateToken(newPayload);
  } catch (error) {
    logger.error('JWT token refresh failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to refresh token');
  }
};

export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    if (decoded.jti && decoded.exp) {
      const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
      if (remainingTime > 0) {
        await redisClient.blacklistToken(decoded.jti, remainingTime);
        logger.info('Token blacklisted', { jti: decoded.jti });
      }
    }
  } catch (error) {
    logger.error('Failed to blacklist token', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    // Don't throw here - blacklisting failure shouldn't break logout
  }
};