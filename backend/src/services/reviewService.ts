import { query, transaction } from '../utils/database';
import { logger } from '../utils/logger';
import dealershipService from './dealershipService';

export interface ReviewData {
  userId: string;
  dealershipId: string;
  rating: number;
  title: string;
  content: string;
  receiptProcessingTime: string;
  platesProcessingTime: string;
  visitDate?: string;
  // Optional dealership information for auto-creation
  dealershipName?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  content: string;
  receiptProcessingTime: string;
  platesProcessingTime: string;
  visitDate: string;
  isVerified: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReviews {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

class ReviewService {
  // Get reviews for a dealership with pagination
  async getReviewsByDealership(
    dealershipId: string,
    page: number = 1,
    limit: number = 3,
    sort: string = 'newest'
  ): Promise<PaginatedReviews> {
    try {
      const offset = (page - 1) * limit;
      
      // Determine sort order
      let orderBy = 'r.created_at DESC';
      switch (sort) {
        case 'oldest':
          orderBy = 'r.created_at ASC';
          break;
        case 'rating_high':
          orderBy = 'r.rating DESC, r.created_at DESC';
          break;
        case 'rating_low':
          orderBy = 'r.rating ASC, r.created_at DESC';
          break;
        case 'helpful':
          orderBy = 'r.helpful_votes DESC, r.created_at DESC';
          break;
        default:
          orderBy = 'r.created_at DESC';
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews r
        INNER JOIN dealerships d ON r.dealership_id = d.id
        WHERE d.google_place_id = $1
      `;
      const countResult = await query(countQuery, [dealershipId]);
      const total = parseInt(countResult.rows[0].total);

      // Get reviews with user information
      const reviewsQuery = `
        SELECT 
          r.id,
          r.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          r.rating,
          r.title,
          r.content,
          r.receipt_processing_time,
          r.plates_processing_time,
          r.visit_date,
          r.is_verified,
          r.helpful_votes,
          r.created_at,
          r.updated_at,
          -- Calculate unhelpful votes (total votes - helpful votes)
          COALESCE((
            SELECT COUNT(*) 
            FROM review_votes rv 
            WHERE rv.review_id = r.id AND rv.is_helpful = false
          ), 0) as unhelpful_votes
        FROM reviews r
        INNER JOIN users u ON r.user_id = u.id
        INNER JOIN dealerships d ON r.dealership_id = d.id
        WHERE d.google_place_id = $1
        ORDER BY ${orderBy}
        LIMIT $2 OFFSET $3
      `;

      const reviewsResult = await query(reviewsQuery, [dealershipId, limit, offset]);

      // Transform data to match frontend expectations
      const reviews: Review[] = reviewsResult.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userAvatar: row.user_avatar || `https://via.placeholder.com/40x40?text=${row.user_name.charAt(0)}`,
        rating: row.rating,
        title: row.title,
        content: row.content,
        receiptProcessingTime: row.receipt_processing_time,
        platesProcessingTime: row.plates_processing_time,
        visitDate: row.visit_date,
        isVerified: row.is_verified,
        helpfulVotes: row.helpful_votes,
        unhelpfulVotes: row.unhelpful_votes,
        tags: this.generateTags(row), // Generate tags based on processing times and rating
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const hasNext = offset + limit < total;

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          hasNext,
        },
      };
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      throw new Error('Failed to fetch reviews');
    }
  }

  // Create a new review
  async createReview(reviewData: ReviewData): Promise<Review> {
    try {
      return await transaction(async (client) => {
        // First, ensure the dealership exists in our database
        const dealershipQuery = `
          SELECT id FROM dealerships WHERE google_place_id = $1
        `;
        const dealershipResult = await client.query(dealershipQuery, [reviewData.dealershipId]);
        
        let dealershipUuid: string;
        
        if (dealershipResult.rows.length === 0) {
          // Dealership doesn't exist, create it
          logger.info(`Creating new dealership for place ID: ${reviewData.dealershipId}`);
          
          try {
            // Try to get dealership info from Google Places API with fallback data
            const fallbackData = {
              name: reviewData.dealershipName,
            };
            
            const dealershipData = await dealershipService.fetchFromGooglePlaces(reviewData.dealershipId, fallbackData);
            const newDealership = await dealershipService.createDealership(dealershipData);
            dealershipUuid = newDealership.id;
          } catch (error) {
            // If Google Places API fails, create a minimal dealership record
            logger.warn(`Failed to fetch from Google Places, creating minimal dealership: ${error}`);
            const minimalDealership = await dealershipService.createDealership({
              googlePlaceId: reviewData.dealershipId,
              name: reviewData.dealershipName || 'Dealership',
            });
            dealershipUuid = minimalDealership.id;
          }
        } else {
          dealershipUuid = dealershipResult.rows[0].id;
        }

        // Check if user already has a review for this dealership
        const existingReviewQuery = `
          SELECT id FROM reviews 
          WHERE user_id = $1 AND dealership_id = $2
        `;
        const existingResult = await client.query(existingReviewQuery, [reviewData.userId, dealershipUuid]);
        
        if (existingResult.rows.length > 0) {
          throw new Error('User has already reviewed this dealership');
        }

        // Insert the review
        const insertQuery = `
          INSERT INTO reviews (
            user_id, dealership_id, rating, title, content, 
            receipt_processing_time, plates_processing_time, visit_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, created_at, updated_at
        `;
        
        const values = [
          reviewData.userId,
          dealershipUuid,
          reviewData.rating,
          reviewData.title,
          reviewData.content,
          reviewData.receiptProcessingTime,
          reviewData.platesProcessingTime,
          reviewData.visitDate || new Date().toISOString().split('T')[0]
        ];

        const insertResult = await client.query(insertQuery, values);
        const reviewId = insertResult.rows[0].id;

        // Get the created review with user information
        const selectQuery = `
          SELECT 
            r.id,
            r.user_id,
            u.name as user_name,
            u.avatar_url as user_avatar,
            r.rating,
            r.title,
            r.content,
            r.receipt_processing_time,
            r.plates_processing_time,
            r.visit_date,
            r.is_verified,
            r.helpful_votes,
            r.created_at,
            r.updated_at
          FROM reviews r
          INNER JOIN users u ON r.user_id = u.id
          WHERE r.id = $1
        `;

        const selectResult = await client.query(selectQuery, [reviewId]);
        const row = selectResult.rows[0];

        return {
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          userAvatar: row.user_avatar || `https://via.placeholder.com/40x40?text=${row.user_name.charAt(0)}`,
          rating: row.rating,
          title: row.title,
          content: row.content,
          receiptProcessingTime: row.receipt_processing_time,
          platesProcessingTime: row.plates_processing_time,
          visitDate: row.visit_date,
          isVerified: row.is_verified,
          helpfulVotes: row.helpful_votes,
          unhelpfulVotes: 0,
          tags: this.generateTags(row),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    } catch (error) {
      logger.error('Error creating review:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create review');
    }
  }

  // Update a review
  async updateReview(reviewId: string, userId: string, updateData: Partial<ReviewData>): Promise<Review> {
    try {
      return await transaction(async (client) => {
        // Verify the review belongs to the user
        const verifyQuery = `
          SELECT id FROM reviews WHERE id = $1 AND user_id = $2
        `;
        const verifyResult = await client.query(verifyQuery, [reviewId, userId]);
        
        if (verifyResult.rows.length === 0) {
          throw new Error('Review not found or not authorized');
        }

        // Build update query dynamically
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (updateData.rating !== undefined) {
          updateFields.push(`rating = $${paramCount++}`);
          values.push(updateData.rating);
        }
        if (updateData.title !== undefined) {
          updateFields.push(`title = $${paramCount++}`);
          values.push(updateData.title);
        }
        if (updateData.content !== undefined) {
          updateFields.push(`content = $${paramCount++}`);
          values.push(updateData.content);
        }
        if (updateData.receiptProcessingTime !== undefined) {
          updateFields.push(`receipt_processing_time = $${paramCount++}`);
          values.push(updateData.receiptProcessingTime);
        }
        if (updateData.platesProcessingTime !== undefined) {
          updateFields.push(`plates_processing_time = $${paramCount++}`);
          values.push(updateData.platesProcessingTime);
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(reviewId);

        const updateQuery = `
          UPDATE reviews 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, updated_at
        `;

        await client.query(updateQuery, values);

        // Return updated review
        const selectQuery = `
          SELECT 
            r.id,
            r.user_id,
            u.name as user_name,
            u.avatar_url as user_avatar,
            r.rating,
            r.title,
            r.content,
            r.receipt_processing_time,
            r.plates_processing_time,
            r.visit_date,
            r.is_verified,
            r.helpful_votes,
            r.created_at,
            r.updated_at
          FROM reviews r
          INNER JOIN users u ON r.user_id = u.id
          WHERE r.id = $1
        `;

        const selectResult = await client.query(selectQuery, [reviewId]);
        const row = selectResult.rows[0];

        return {
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          userAvatar: row.user_avatar || `https://via.placeholder.com/40x40?text=${row.user_name.charAt(0)}`,
          rating: row.rating,
          title: row.title,
          content: row.content,
          receiptProcessingTime: row.receipt_processing_time,
          platesProcessingTime: row.plates_processing_time,
          visitDate: row.visit_date,
          isVerified: row.is_verified,
          helpfulVotes: row.helpful_votes,
          unhelpfulVotes: 0,
          tags: this.generateTags(row),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    } catch (error) {
      logger.error('Error updating review:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update review');
    }
  }

  // Delete a review
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const deleteQuery = `
        DELETE FROM reviews 
        WHERE id = $1 AND user_id = $2
      `;
      const result = await query(deleteQuery, [reviewId, userId]);
      
      if (result.rowCount === 0) {
        throw new Error('Review not found or not authorized');
      }
    } catch (error) {
      logger.error('Error deleting review:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete review');
    }
  }

  // Generate tags based on review data
  private generateTags(reviewData: any): string[] {
    const tags: string[] = [];

    // Add rating-based tags
    if (reviewData.rating >= 5) {
      tags.push('Excellent Service');
    } else if (reviewData.rating >= 4) {
      tags.push('Good Service');
    } else if (reviewData.rating <= 2) {
      tags.push('Needs Improvement');
    }

    // Add processing time tags
    if (reviewData.receipt_processing_time === 'same-day' && reviewData.plates_processing_time === 'same-day') {
      tags.push('Fast Processing');
    } else if (reviewData.receipt_processing_time === 'same-day' || reviewData.plates_processing_time === 'same-day') {
      tags.push('Quick Service');
    } else if (reviewData.receipt_processing_time === 'longer' || reviewData.plates_processing_time === 'longer') {
      tags.push('Slow Process');
    }

    // Add verification tag
    if (reviewData.is_verified) {
      tags.push('Verified Purchase');
    }

    // Add helpful tag if review has good votes
    if (reviewData.helpful_votes > 5) {
      tags.push('Helpful Review');
    }

    return tags;
  }
}

export default new ReviewService();