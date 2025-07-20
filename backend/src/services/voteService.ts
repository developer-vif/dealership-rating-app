import { query, transaction } from '../utils/database';
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
    try {
      await transaction(async (client) => {
        // Check if user already has a vote on this review
        const existingVoteQuery = `
          SELECT id, is_helpful 
          FROM review_votes 
          WHERE review_id = $1 AND user_id = $2
        `;
        const existingVoteResult = await client.query(existingVoteQuery, [reviewId, userId]);
        
        if (existingVoteResult.rows.length > 0) {
          const existingVote = existingVoteResult.rows[0];
          
          // If the vote is the same, remove it (toggle off)
          if (existingVote.is_helpful === isHelpful) {
            // Remove the vote
            const deleteVoteQuery = `
              DELETE FROM review_votes 
              WHERE review_id = $1 AND user_id = $2
            `;
            await client.query(deleteVoteQuery, [reviewId, userId]);
            
            // Update the denormalized helpful_votes counter
            if (isHelpful) {
              const updateCountQuery = `
                UPDATE reviews 
                SET helpful_votes = helpful_votes - 1
                WHERE id = $1
              `;
              await client.query(updateCountQuery, [reviewId]);
            }
            
            logger.info('Vote removed (toggled off)', { reviewId, userId, isHelpful });
            return;
          }
          
          // Update existing vote with new value
          const updateVoteQuery = `
            UPDATE review_votes 
            SET is_helpful = $1, created_at = NOW()
            WHERE review_id = $2 AND user_id = $3
          `;
          await client.query(updateVoteQuery, [isHelpful, reviewId, userId]);
          
          // Update the denormalized helpful_votes counter
          if (existingVote.is_helpful && !isHelpful) {
            // Changed from helpful to unhelpful: decrease helpful count
            const updateCountQuery = `
              UPDATE reviews 
              SET helpful_votes = helpful_votes - 1
              WHERE id = $1
            `;
            await client.query(updateCountQuery, [reviewId]);
          } else if (!existingVote.is_helpful && isHelpful) {
            // Changed from unhelpful to helpful: increase helpful count
            const updateCountQuery = `
              UPDATE reviews 
              SET helpful_votes = helpful_votes + 1
              WHERE id = $1
            `;
            await client.query(updateCountQuery, [reviewId]);
          }
          
          logger.info('Vote updated', { reviewId, userId, isHelpful, previousVote: existingVote.is_helpful });
        } else {
          // Create new vote
          const insertVoteQuery = `
            INSERT INTO review_votes (review_id, user_id, is_helpful)
            VALUES ($1, $2, $3)
          `;
          await client.query(insertVoteQuery, [reviewId, userId, isHelpful]);
          
          // Update the denormalized helpful_votes counter
          if (isHelpful) {
            const updateCountQuery = `
              UPDATE reviews 
              SET helpful_votes = helpful_votes + 1
              WHERE id = $1
            `;
            await client.query(updateCountQuery, [reviewId]);
          }
          
          logger.info('New vote created', { reviewId, userId, isHelpful });
        }
      });
    } catch (error) {
      logger.error('Error updating vote', { error, reviewId, userId, isHelpful });
      throw error;
    }
  }

  async removeVote(reviewId: string, userId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // Get the existing vote to know if it was helpful
        const existingVoteQuery = `
          SELECT is_helpful 
          FROM review_votes 
          WHERE review_id = $1 AND user_id = $2
        `;
        const existingVoteResult = await client.query(existingVoteQuery, [reviewId, userId]);
        
        if (existingVoteResult.rows.length === 0) {
          logger.debug('No vote to remove', { reviewId, userId });
          return; // No vote to remove
        }
        
        const wasHelpful = existingVoteResult.rows[0].is_helpful;
        
        // Remove the vote
        const deleteVoteQuery = `
          DELETE FROM review_votes 
          WHERE review_id = $1 AND user_id = $2
        `;
        await client.query(deleteVoteQuery, [reviewId, userId]);
        
        // Update the denormalized helpful_votes counter
        if (wasHelpful) {
          const updateCountQuery = `
            UPDATE reviews 
            SET helpful_votes = helpful_votes - 1
            WHERE id = $1
          `;
          await client.query(updateCountQuery, [reviewId]);
        }
        
        logger.info('Vote removed successfully', { reviewId, userId, wasHelpful });
      });
    } catch (error) {
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

  async getUserVotes(reviewIds: string[], userId: string): Promise<Record<string, 'helpful' | 'unhelpful' | null>> {
    try {
      if (reviewIds.length === 0) {
        return {};
      }
      
      const getUserVotesQuery = `
        SELECT review_id, is_helpful 
        FROM review_votes 
        WHERE review_id = ANY($1) AND user_id = $2
      `;
      const result = await query(getUserVotesQuery, [reviewIds, userId]);
      
      // Create a map of existing votes
      const voteMap: Record<string, 'helpful' | 'unhelpful' | null> = {};
      
      // Initialize all reviews with null
      reviewIds.forEach(reviewId => {
        voteMap[reviewId] = null;
      });
      
      // Set actual votes
      result.rows.forEach((row: any) => {
        voteMap[row.review_id] = row.is_helpful ? 'helpful' : 'unhelpful';
      });
      
      return voteMap;
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