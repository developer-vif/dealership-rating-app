import jwt from 'jsonwebtoken';
import { logger } from './logger';

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
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, jwtSecret, { 
      expiresIn: jwtExpiresIn 
    } as jwt.SignOptions);
  } catch (error) {
    logger.error('JWT token generation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to generate token');
  }
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch (error) {
    logger.error('JWT token verification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Invalid or expired token');
  }
};

export const refreshToken = (oldToken: string): string => {
  try {
    const decoded = verifyToken(oldToken);
    
    // Create new token with fresh expiration
    const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
    
    return generateToken(newPayload);
  } catch (error) {
    logger.error('JWT token refresh failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to refresh token');
  }
};