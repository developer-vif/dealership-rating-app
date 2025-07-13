import request from 'supertest';
import express from 'express';
import reviewsRouter from './reviews';
import voteService from '../services/voteService';
import { authenticateToken } from '../middleware/auth';

// Mock dependencies
jest.mock('../services/voteService');
jest.mock('../middleware/auth');
jest.mock('../utils/logger');

const mockedVoteService = voteService as jest.Mocked<typeof voteService>;
const mockedAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/reviews', reviewsRouter);

describe('Vote Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication middleware to always pass
    mockedAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = { userId: 'test-user-123' };
      next();
    });
  });

  describe('POST /api/reviews/:reviewId/vote', () => {
    const reviewId = 'review-123';
    const endpoint = `/api/reviews/${reviewId}/vote`;

    it('should submit helpful vote successfully', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.voteOnReview.mockResolvedValue();
      mockedVoteService.getVoteSummary.mockResolvedValue({
        helpfulVotes: 6,
        unhelpfulVotes: 2
      });
      mockedVoteService.getUserVote.mockResolvedValue({
        userVote: 'helpful'
      });

      const response = await request(app)
        .post(endpoint)
        .send({ voteType: 'helpful' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          voteSummary: {
            helpfulVotes: 6,
            unhelpfulVotes: 2
          },
          userVote: 'helpful'
        },
        message: 'Vote submitted successfully',
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });

      expect(mockedVoteService.validateReviewExists).toHaveBeenCalledWith(reviewId);
      expect(mockedVoteService.voteOnReview).toHaveBeenCalledWith(reviewId, 'test-user-123', true);
    });

    it('should submit unhelpful vote successfully', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.voteOnReview.mockResolvedValue();
      mockedVoteService.getVoteSummary.mockResolvedValue({
        helpfulVotes: 5,
        unhelpfulVotes: 3
      });
      mockedVoteService.getUserVote.mockResolvedValue({
        userVote: 'unhelpful'
      });

      const response = await request(app)
        .post(endpoint)
        .send({ voteType: 'unhelpful' })
        .expect(200);

      expect(response.body.data.userVote).toBe('unhelpful');
      expect(mockedVoteService.voteOnReview).toHaveBeenCalledWith(reviewId, 'test-user-123', false);
    });

    it('should return 400 for invalid vote type', async () => {
      const response = await request(app)
        .post(endpoint)
        .send({ voteType: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('must be one of')
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for missing vote type', async () => {
      const response = await request(app)
        .post(endpoint)
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('required')
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 404 when review does not exist', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(false);

      const response = await request(app)
        .post(endpoint)
        .send({ voteType: 'helpful' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 500 when vote service throws error', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.voteOnReview.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post(endpoint)
        .send({ voteType: 'helpful' })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while submitting vote'
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('DELETE /api/reviews/:reviewId/vote', () => {
    const reviewId = 'review-123';
    const endpoint = `/api/reviews/${reviewId}/vote`;

    it('should remove vote successfully', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.removeVote.mockResolvedValue();
      mockedVoteService.getVoteSummary.mockResolvedValue({
        helpfulVotes: 4,
        unhelpfulVotes: 2
      });

      const response = await request(app)
        .delete(endpoint)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          voteSummary: {
            helpfulVotes: 4,
            unhelpfulVotes: 2
          },
          userVote: null
        },
        message: 'Vote removed successfully',
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });

      expect(mockedVoteService.validateReviewExists).toHaveBeenCalledWith(reviewId);
      expect(mockedVoteService.removeVote).toHaveBeenCalledWith(reviewId, 'test-user-123');
    });

    it('should return 404 when review does not exist', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(false);

      const response = await request(app)
        .delete(endpoint)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 500 when vote service throws error', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.removeVote.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(endpoint)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while removing vote'
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('GET /api/reviews/:reviewId/vote', () => {
    const reviewId = 'review-123';
    const endpoint = `/api/reviews/${reviewId}/vote`;

    it('should get user vote successfully', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.getUserVote.mockResolvedValue({
        userVote: 'helpful'
      });
      mockedVoteService.getVoteSummary.mockResolvedValue({
        helpfulVotes: 5,
        unhelpfulVotes: 2
      });

      const response = await request(app)
        .get(endpoint)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          voteSummary: {
            helpfulVotes: 5,
            unhelpfulVotes: 2
          },
          userVote: 'helpful'
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });

      expect(mockedVoteService.validateReviewExists).toHaveBeenCalledWith(reviewId);
      expect(mockedVoteService.getUserVote).toHaveBeenCalledWith(reviewId, 'test-user-123');
    });

    it('should return null when user has no vote', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.getUserVote.mockResolvedValue({
        userVote: null
      });
      mockedVoteService.getVoteSummary.mockResolvedValue({
        helpfulVotes: 5,
        unhelpfulVotes: 2
      });

      const response = await request(app)
        .get(endpoint)
        .expect(200);

      expect(response.body.data.userVote).toBeNull();
    });

    it('should return 404 when review does not exist', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(false);

      const response = await request(app)
        .get(endpoint)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Review not found'
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 500 when vote service throws error', async () => {
      mockedVoteService.validateReviewExists.mockResolvedValue(true);
      mockedVoteService.getUserVote.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(endpoint)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching vote'
        },
        meta: {
          requestId: undefined,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      // Reset authentication mock to test auth failures
      mockedAuthenticateToken.mockReset();
    });

    it('should require authentication for voting', async () => {
      mockedAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      });

      await request(app)
        .post('/api/reviews/review-123/vote')
        .send({ voteType: 'helpful' })
        .expect(401);
    });

    it('should require authentication for removing votes', async () => {
      mockedAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      });

      await request(app)
        .delete('/api/reviews/review-123/vote')
        .expect(401);
    });

    it('should require authentication for getting votes', async () => {
      mockedAuthenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      });

      await request(app)
        .get('/api/reviews/review-123/vote')
        .expect(401);
    });
  });
});