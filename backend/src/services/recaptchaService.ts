import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '';

if (!recaptchaSecret) {
  logger.warn('RECAPTCHA_SECRET_KEY not configured. reCAPTCHA verification will be disabled.');
}

/**
 * Middleware to verify reCAPTCHA token
 */
export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
  // Skip verification if secret key is not configured (for development)
  if (!recaptchaSecret) {
    logger.warn('reCAPTCHA verification skipped - no secret key configured');
    return next();
  }

  // Check if recaptcha token is provided
  if (!req.body.recaptchaToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'RECAPTCHA_MISSING',
        message: 'reCAPTCHA token is required'
      }
    });
  }

  try {
    // Verify the reCAPTCHA token with Google's API
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: recaptchaSecret,
        response: req.body.recaptchaToken,
        remoteip: req.ip
      }
    });

    if (!response.data.success) {
      logger.error('reCAPTCHA verification failed', { errors: response.data['error-codes'] });
      return res.status(400).json({
        success: false,
        error: {
          code: 'RECAPTCHA_VERIFICATION_FAILED',
          message: 'reCAPTCHA verification failed. Please try again.'
        }
      });
    }

    // For reCAPTCHA v3, check the score (optional)
    if (response.data.score !== undefined) {
      const score = response.data.score;
      logger.info('reCAPTCHA v3 score', { score });
      
      // You can set a threshold (e.g., 0.5) to reject likely bots
      if (score < 0.3) {
        logger.warn('reCAPTCHA score too low', { score });
        return res.status(400).json({
          success: false,
          error: {
            code: 'RECAPTCHA_LOW_SCORE',
            message: 'Security verification failed. Please try again.'
          }
        });
      }
    }

    logger.info('reCAPTCHA verification successful');
    next();
  } catch (error) {
    logger.error('reCAPTCHA verification error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({
      success: false,
      error: {
        code: 'RECAPTCHA_VERIFICATION_ERROR',
        message: 'Unable to verify reCAPTCHA. Please try again.'
      }
    });
  }
};

export default {
  verifyRecaptcha
};