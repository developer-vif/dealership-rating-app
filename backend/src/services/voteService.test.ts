import voteService from './voteService';
import { query } from '../utils/database';

// Mock the database module
jest.mock('../utils/database');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}));

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('VoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateReviewExists', () => {
    it('should return true when review exists', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: 'review-123' }]
      });

      const result = await voteService.validateReviewExists('review-123');
      
      expect(result).toBe(true);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM reviews WHERE id = $1'),
        ['review-123']
      );
    });

    it('should return false when review does not exist', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await voteService.validateReviewExists('nonexistent-review');
      
      expect(result).toBe(false);
    });

    it('should throw error when database query fails', async () => {
      mockedQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(voteService.validateReviewExists('review-123'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('voteOnReview', () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      mockClient.query.mockClear();
      mockClient.release.mockClear();
    });

    it('should insert new helpful vote successfully', async () => {
      // Mock transaction setup
      mockedQuery.mockResolvedValueOnce(mockClient);

      // Mock existing vote check (no existing vote)
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock vote insertion
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock helpful votes counter update
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock transaction commit
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await voteService.voteOnReview('review-123', 'user-456', true);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT is_helpful FROM review_votes WHERE review_id = $1 AND user_id = $2',
        ['review-123', 'user-456']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO review_votes (review_id, user_id, is_helpful) VALUES ($1, $2, $3)',
        ['review-123', 'user-456', true]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE reviews SET helpful_votes = helpful_votes + 1 WHERE id = $1',
        ['review-123']
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should update existing vote from unhelpful to helpful', async () => {
      // Mock transaction setup
      mockedQuery.mockResolvedValueOnce(mockClient);

      // Mock existing vote check (unhelpful vote exists)
      mockClient.query.mockResolvedValueOnce({ 
        rows: [{ is_helpful: false }] 
      });
      
      // Mock vote update
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock counter updates (decrease unhelpful, increase helpful)
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock transaction commit
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await voteService.voteOnReview('review-123', 'user-456', true);

      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE review_votes SET is_helpful = $3 WHERE review_id = $1 AND user_id = $2',
        ['review-123', 'user-456', true]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE reviews SET unhelpful_votes = unhelpful_votes - 1 WHERE id = $1',
        ['review-123']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE reviews SET helpful_votes = helpful_votes + 1 WHERE id = $1',
        ['review-123']
      );
    });

    it('should handle database errors and rollback transaction', async () => {
      // Mock transaction setup
      mockedQuery.mockResolvedValueOnce(mockClient);

      // Mock existing vote check
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock vote insertion failure
      mockClient.query.mockRejectedValueOnce(new Error('Constraint violation'));
      
      // Mock transaction rollback
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(voteService.voteOnReview('review-123', 'user-456', true))
        .rejects.toThrow('Constraint violation');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('removeVote', () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      mockClient.query.mockClear();
      mockClient.release.mockClear();
    });

    it('should remove helpful vote successfully', async () => {
      // Mock transaction setup
      mockedQuery.mockResolvedValueOnce(mockClient);

      // Mock existing vote check (helpful vote exists)
      mockClient.query.mockResolvedValueOnce({ 
        rows: [{ is_helpful: true }] 
      });
      
      // Mock vote deletion
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock helpful votes counter update
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock transaction commit
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await voteService.removeVote('review-123', 'user-456');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT is_helpful FROM review_votes WHERE review_id = $1 AND user_id = $2',
        ['review-123', 'user-456']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM review_votes WHERE review_id = $1 AND user_id = $2',
        ['review-123', 'user-456']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE reviews SET helpful_votes = helpful_votes - 1 WHERE id = $1',
        ['review-123']
      );
    });

    it('should handle case when no vote exists', async () => {
      // Mock transaction setup
      mockedQuery.mockResolvedValueOnce(mockClient);

      // Mock existing vote check (no vote exists)
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock transaction commit (no operations needed)
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await voteService.removeVote('review-123', 'user-456');

      expect(mockClient.query).not.toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM review_votes')
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('getUserVote', () => {
    it('should return user vote when vote exists', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ is_helpful: true }]
      });

      const result = await voteService.getUserVote('review-123', 'user-456');
      
      expect(result).toEqual({ userVote: 'helpful' });
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT is_helpful FROM review_votes WHERE review_id = $1 AND user_id = $2',
        ['review-123', 'user-456']
      );
    });

    it('should return null when no vote exists', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await voteService.getUserVote('review-123', 'user-456');
      
      expect(result).toEqual({ userVote: null });
    });

    it('should return unhelpful vote correctly', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ is_helpful: false }]
      });

      const result = await voteService.getUserVote('review-123', 'user-456');
      
      expect(result).toEqual({ userVote: 'unhelpful' });
    });
  });

  describe('getVoteSummary', () => {
    it('should return vote counts for review', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{
          helpful_votes: 5,
          unhelpful_votes: 2
        }]
      });

      const result = await voteService.getVoteSummary('review-123');
      
      expect(result).toEqual({
        helpfulVotes: 5,
        unhelpfulVotes: 2
      });
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT helpful_votes, unhelpful_votes FROM reviews WHERE id = $1',
        ['review-123']
      );
    });

    it('should return zero counts when review not found', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: []
      });

      const result = await voteService.getVoteSummary('nonexistent-review');
      
      expect(result).toEqual({
        helpfulVotes: 0,
        unhelpfulVotes: 0
      });
    });
  });

  describe('getUserVotes', () => {
    it('should return votes for multiple reviews', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [
          { review_id: 'review-1', is_helpful: true },
          { review_id: 'review-3', is_helpful: false }
        ]
      });

      const reviewIds = ['review-1', 'review-2', 'review-3'];
      const result = await voteService.getUserVotes(reviewIds, 'user-456');
      
      expect(result).toEqual({
        'review-1': 'helpful',
        'review-2': null,
        'review-3': 'unhelpful'
      });
      
      expect(mockedQuery).toHaveBeenCalledWith(
        'SELECT review_id, is_helpful FROM review_votes WHERE review_id = ANY($1) AND user_id = $2',
        [reviewIds, 'user-456']
      );
    });

    it('should return empty object for empty review list', async () => {
      const result = await voteService.getUserVotes([], 'user-456');
      
      expect(result).toEqual({});
      expect(mockedQuery).not.toHaveBeenCalled();
    });
  });
});