import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';
import reviewService from '../services/reviewService';
import userService from '../services/userService';
import { authenticateToken } from '../middleware/auth';
import { verifyRecaptcha } from '../services/recaptchaService';

const router = Router();

// Validation schemas
const createReviewSchema = Joi.object({
  dealershipId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().min(3).max(255).required(),
  content: Joi.string().min(10).max(2000).required(),
  receiptProcessingTime: Joi.string().valid('same-day', '1-week', '2-weeks', '1-month', '2-months', 'longer').required(),
  platesProcessingTime: Joi.string().valid('same-day', '1-week', '2-weeks', '1-month', '2-months', 'longer').required(),
  visitDate: Joi.string().isoDate().optional(),
  // Optional dealership information for auto-creation
  dealershipName: Joi.string().optional(),
  // reCAPTCHA token
  recaptchaToken: Joi.string().optional(),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  title: Joi.string().min(3).max(255).optional(),
  content: Joi.string().min(10).max(2000).optional(),
  receiptProcessingTime: Joi.string().valid('same-day', '1-week', '2-weeks', '1-month', '2-months', 'longer').optional(),
  platesProcessingTime: Joi.string().valid('same-day', '1-week', '2-weeks', '1-month', '2-months', 'longer').optional(),
});


// GET /api/reviews/:placeId - Get reviews for dealership
router.get('/:placeId', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;
    const { page = 1, limit = 3, sort = 'newest' } = req.query;
    
    logger.info('Get reviews request', { placeId, page, limit, sort });
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const sortStr = sort as string;

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Invalid pagination parameters'
        }
      });
    }

    const result = await reviewService.getReviewsByDealership(placeId, pageNum, limitNum, sortStr);
    
    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get reviews error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching reviews'
      }
    });
  }
});

// POST /api/reviews - Create new review (requires authentication and reCAPTCHA verification)
router.post('/', authenticateToken, verifyRecaptcha, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    // Get user from JWT token (authentication middleware ensures req.user exists)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    // Get user from database (should exist since JWT contains database UUID)
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      logger.error('User not found in database despite valid JWT', { userId: req.user.userId });
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found. Please log in again.'
        }
      });
    }
    
    logger.info('Create review request', { 
      dealershipId: value.dealershipId,
      rating: value.rating,
      userId: user.id
    });

    // Generate a title if not provided or improve the existing one
    const title = value.title || `${value.rating} star${value.rating !== 1 ? 's' : ''} experience`;

    const reviewData = {
      userId: user.id,
      dealershipId: value.dealershipId,
      rating: value.rating,
      title,
      content: value.content,
      receiptProcessingTime: value.receiptProcessingTime,
      platesProcessingTime: value.platesProcessingTime,
      visitDate: value.visitDate,
      // Optional dealership information for auto-creation
      dealershipName: value.dealershipName,
    };

    const review = await reviewService.createReview(reviewData);
    
    res.status(201).json({
      success: true,
      data: review,
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Create review error', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('already reviewed')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_REVIEW',
            message: 'You have already reviewed this dealership'
          }
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DEALERSHIP_NOT_FOUND',
            message: 'Dealership not found'
          }
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating the review'
      }
    });
  }
});

// PUT /api/reviews/:id - Update review (requires authentication)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = updateReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    // Get user from JWT token
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }
    
    logger.info('Update review request', { reviewId: id, userId: req.user.userId });

    const review = await reviewService.updateReview(id, req.user.userId, value);
    
    res.status(200).json({
      success: true,
      data: review,
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Update review error', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: 'Review not found or you are not authorized to update it'
          }
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating the review'
      }
    });
  }
});

// DELETE /api/reviews/:id - Delete review (requires authentication)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user from JWT token
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }
    
    logger.info('Delete review request', { reviewId: id, userId: req.user.userId });

    await reviewService.deleteReview(id, req.user.userId);
    
    res.status(204).json({
      success: true,
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Delete review error', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REVIEW_NOT_FOUND',
            message: 'Review not found or you are not authorized to delete it'
          }
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while deleting the review'
      }
    });
  }
});

// GET /api/reviews/user/:userId - Get user's reviews
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    logger.info('Get user reviews request', { userId });
    
    // TODO: Implement user reviews retrieval with authorization
    res.status(501).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'User reviews retrieval not yet implemented'
      }
    });
  } catch (error) {
    logger.error('Get user reviews error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching user reviews'
      }
    });
  }
});

export default router;