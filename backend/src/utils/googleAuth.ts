import { OAuth2Client } from 'google-auth-library';
import { logger } from './logger';

const googleClientId = process.env['GOOGLE_CLIENT_ID'];
const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET'];

if (!googleClientId || !googleClientSecret) {
  logger.warn('Google OAuth credentials not configured - OAuth features will be disabled');
}

export const googleClient = googleClientId && googleClientSecret 
  ? new OAuth2Client(
      googleClientId,
      googleClientSecret,
      `${process.env['FRONTEND_URL']}/auth/callback`
    )
  : null;

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export const verifyGoogleToken = async (token: string): Promise<GoogleUserInfo> => {
  try {
    if (!googleClient) {
      throw new Error('Google OAuth not configured');
    }
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture,
      verified_email: payload.email_verified || false,
    };
  } catch (error) {
    logger.error('Google token verification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Invalid Google token');
  }
};

export const getGoogleAuthUrl = (): string => {
  if (!googleClient) {
    throw new Error('Google OAuth not configured');
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: 'dealership-rating-app',
  });
};