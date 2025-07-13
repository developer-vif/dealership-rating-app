import { query } from '../utils/database';
import { logger } from '../utils/logger';

export interface Vote {
  id: string;
  reviewId: string;
  userId: string;
  isHelpful: boolean;
  createdAt: Date;
}

export interface VoteSummary {
  helpfulVotes: number;
  unhelpfulVotes: number;
}

export interface UserVoteStatus {
  userVote: 'helpful' | 'unhelpful' | null;
}

class VoteService {
  async voteOnReview(reviewId: string, userId: string, isHelpful: boolean): Promise<void> {
    const client = await query('BEGIN');
    
    try {
      // Check if user already has a vote on this review
      const existingVoteQuery = `
        SELECT id, is_helpful 
        FROM review_votes 
        WHERE review_id = $1 AND user_id = $2
      `;
      const existingVoteResult = await query(existingVoteQuery, [reviewId, userId]);
      
      if (existingVoteResult.rows.length > 0) {
        const existingVote = existingVoteResult.rows[0];
        
        // If the vote is the same, remove it (toggle off)
        if (existingVote.is_helpful === isHelpful) {
          await this.removeVote(reviewId, userId);
          await query('COMMIT');
          return;
        }
        
        // Update existing vote with new value
        const updateVoteQuery = `
          UPDATE review_votes 
          SET is_helpful = $1, created_at = NOW()
          WHERE review_id = $2 AND user_id = $3
        `;
        await query(updateVoteQuery, [isHelpful, reviewId, userId]);
        
        // Update the denormalized helpful_votes counter
        const deltaChange = isHelpful ? 
          (existingVote.is_helpful ? 0 : 1) : // helpful vote: no change if already helpful, +1 if was unhelpful
          (existingVote.is_helpful ? -1 : 0); // unhelpful vote: -1 if was helpful, no change if was unhelpful
        
        if (deltaChange !== 0) {
          const updateCountQuery = `
            UPDATE reviews 
            SET helpful_votes = helpful_votes + $1
            WHERE id = $2
          `;
          await query(updateCountQuery, [deltaChange, reviewId]);
        }
      } else {
        // Create new vote
        const insertVoteQuery = `
          INSERT INTO review_votes (review_id, user_id, is_helpful)
          VALUES ($1, $2, $3)
        `;
        await query(insertVoteQuery, [reviewId, userId, isHelpful]);
        
        // Update the denormalized helpful_votes counter
        if (isHelpful) {
          const updateCountQuery = `
            UPDATE reviews 
            SET helpful_votes = helpful_votes + 1
            WHERE id = $1
          `;
          await query(updateCountQuery, [reviewId]);
        }
      }
      
      await query('COMMIT');
      
      logger.info('Vote updated successfully', {
        reviewId,
        userId,
        isHelpful,
        action: existingVoteResult.rows.length > 0 ? 'update' : 'create'
      });
    } catch (error) {
      await query('ROLLBACK');
      logger.error('Error updating vote', { error, reviewId, userId, isHelpful });
      throw error;
    }
  }

  async removeVote(reviewId: string, userId: string): Promise<void> {
    const client = await query('BEGIN');
    
    try {
      // Get the existing vote to know if it was helpful
      const existingVoteQuery = `
        SELECT is_helpful 
        FROM review_votes 
        WHERE review_id = $1 AND user_id = $2
      `;
      const existingVoteResult = await query(existingVoteQuery, [reviewId, userId]);
      
      if (existingVoteResult.rows.length === 0) {
        await query('COMMIT');
        return; // No vote to remove
      }
      
      const wasHelpful = existingVoteResult.rows[0].is_helpful;
      
      // Remove the vote
      const deleteVoteQuery = `
        DELETE FROM review_votes 
        WHERE review_id = $1 AND user_id = $2
      `;
      await query(deleteVoteQuery, [reviewId, userId]);
      
      // Update the denormalized helpful_votes counter
      if (wasHelpful) {
        const updateCountQuery = `
          UPDATE reviews 
          SET helpful_votes = helpful_votes - 1
          WHERE id = $1
        `;
        await query(updateCountQuery, [reviewId]);
      }
      
      await query('COMMIT');
      
      logger.info('Vote removed successfully', { reviewId, userId, wasHelpful });
    } catch (error) {
      await query('ROLLBACK');
      logger.error('Error removing vote', { error, reviewId, userId });
      throw error;
    }
  }

  async getUserVote(reviewId: string, userId: string): Promise<UserVoteStatus> {
    try {
      const getUserVoteQuery = `
        SELECT is_helpful 
        FROM review_votes 
        WHERE review_id = $1 AND user_id = $2
      `;
      const result = await query(getUserVoteQuery, [reviewId, userId]);
      
      let userVote: 'helpful' | 'unhelpful' | null = null;
      if (result.rows.length > 0) {
        userVote = result.rows[0].is_helpful ? 'helpful' : 'unhelpful';
      }
      
      return {
        userVote
      };
    } catch (error) {
      logger.error('Error getting user vote', { error, reviewId, userId });
      throw error;
    }
  }

  async getVoteSummary(reviewId: string): Promise<VoteSummary> {
    try {
      const voteSummaryQuery = `
        SELECT 
          r.helpful_votes,
          COALESCE((
            SELECT COUNT(*) 
            FROM review_votes rv 
            WHERE rv.review_id = r.id AND rv.is_helpful = false
          ), 0) as unhelpful_votes
        FROM reviews r
        WHERE r.id = $1
      `;
      const result = await query(voteSummaryQuery, [reviewId]);
      
      if (result.rows.length === 0) {
        throw new Error('Review not found');
      }
      
      return {
        helpfulVotes: result.rows[0].helpful_votes,
        unhelpfulVotes: result.rows[0].unhelpful_votes
      };
    } catch (error) {
      logger.error('Error getting vote summary', { error, reviewId });
      throw error;
    }
  }

  async getUserVotes(reviewIds: string[], userId: string): Promise<UserVoteStatus[]> {
    try {
      if (reviewIds.length === 0) {
        return [];
      }
      
      const placeholders = reviewIds.map((_, index) => `$${index + 2}`).join(',');
      const getUserVotesQuery = `
        SELECT review_id, is_helpful 
        FROM review_votes 
        WHERE user_id = $1 AND review_id IN (${placeholders})
      `;
      const result = await query(getUserVotesQuery, [userId, ...reviewIds]);
      
      // Create a map of existing votes
      const voteMap = new Map<string, 'helpful' | 'unhelpful'>();
      result.rows.forEach((row: any) => {
        voteMap.set(row.review_id, row.is_helpful ? 'helpful' : 'unhelpful');
      });
      
      // Return status for all requested reviews
      return reviewIds.map(reviewId => ({
        reviewId,
        userVote: voteMap.get(reviewId) || null
      }));
    } catch (error) {
      logger.error('Error getting user votes', { error, reviewIds, userId });
      throw error;
    }
  }

  async validateReviewExists(reviewId: string): Promise<boolean> {
    try {
      const checkReviewQuery = `
        SELECT id FROM reviews WHERE id = $1
      `;
      const result = await query(checkReviewQuery, [reviewId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error validating review exists', { error, reviewId });
      throw error;
    }
  }
}

export default new VoteService();