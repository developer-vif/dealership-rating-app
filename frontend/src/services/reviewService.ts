import axios from 'axios';
import { Dealership, DealershipReview, ReviewsPaginatedResponse } from '../types/dealership';
import { anonymizeReviewerData } from '../utils/anonymization';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// This is the shape of the top-level API response object
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

class ReviewService {
  private baseURL = `${API_BASE_URL}/api/reviews`;
  private timeout = 30000; // 30 second timeout

  // Get reviews for a dealership
  async getReviews(
    placeId: string,
    page: number = 1,
    limit: number = 3,
    sort: string = 'newest'
  ): Promise<ReviewsPaginatedResponse> {
    try {
      const response = await axios.get<ApiResponse<DealershipReview[]>>(`${this.baseURL}/${placeId}`, {
        params: { page, limit, sort },
        timeout: this.timeout,
      });

      if (!response.data.success) {
        throw new Error('Failed to fetch reviews');
      }

      // Anonymize all reviewer data before returning
      const anonymizedReviews = response.data.data.map(review => anonymizeReviewerData(review));

      return {
        reviews: anonymizedReviews,
        pagination: response.data.pagination || {
          page,
          limit,
          total: 0,
          hasNext: false,
        },
      };
    } catch (error) {
      console.error('❌ getReviews API error:', error);
      throw new Error('Failed to fetch reviews. Please try again.');
    }
  }

  // Create a new review
  async createReview(reviewData: {
    dealershipId: string;
    rating: number;
    title: string;
    content: string;
    receiptProcessingTime: string;
    platesProcessingTime: string;
    visitDate?: string;
    dealershipName?: string;
  }): Promise<DealershipReview> {
    try {
      const response = await axios.post<ApiResponse<DealershipReview>>(`${this.baseURL}/`, reviewData, {
        timeout: this.timeout,
      });

      if (!response.data.success) {
        throw new Error('Failed to create review');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ createReview API error:', error);
      
      // Handle axios error response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.error) {
          const errorCode = axiosError.response.data.error.code;
          const errorMessage = axiosError.response.data.error.message;
          
          if (errorCode === 'DUPLICATE_REVIEW') {
            throw new Error(`DUPLICATE_REVIEW: ${errorMessage}`);
          }
          
          throw new Error(errorMessage);
        }
      }
      
      throw new Error('Failed to create review. Please try again.');
    }
  }

  // Update a review
  async getDealershipByReview(reviewId: string): Promise<Dealership> {
    const response = await axios.get(`${API_BASE_URL}/api/reviews/dealership/${reviewId}`);
    return response.data.data;
  }

  async updateReview(reviewId: string, data: any): Promise<any> {
    const response = await axios.put(`${this.baseURL}/${reviewId}`, data);
    return response.data.data;
  }

  // Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    try {
      console.log('🗑️ Attempting to delete review:', reviewId);
      
      const response = await axios.delete(`${this.baseURL}/${reviewId}`, {
        timeout: this.timeout,
      });

      console.log('🗑️ Delete response status:', response.status);
      console.log('🗑️ Delete response data:', response.data);

      // DELETE requests typically return 204 (No Content) on success
      // or 404 if the resource doesn't exist
      if (response.status === 204) {
        // Success - review deleted
        console.log('✅ Review deleted successfully');
        return;
      }

      // If we get here, something unexpected happened
      console.log('❌ Unexpected response status:', response.status);
      throw new Error('Failed to delete review');
    } catch (error) {
      console.error('❌ deleteReview API error:', error);
      
      // Handle specific error responses
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.log('❌ Axios error response:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.response?.data?.error?.message
        });
        
        if (axiosError.response?.status === 404) {
          throw new Error('Review not found. It may have already been deleted.');
        } else if (axiosError.response?.data?.error?.message) {
          throw new Error(axiosError.response.data.error.message);
        }
      }
      
      throw new Error('Failed to delete review. Please try again.');
    }
  }

  // Vote on a review
  async voteOnReview(reviewId: string, voteType: 'helpful' | 'unhelpful'): Promise<{
    voteSummary: { helpfulVotes: number; unhelpfulVotes: number };
    userVote: 'helpful' | 'unhelpful' | null;
  }> {
    try {
      const response = await axios.post(
        `${this.baseURL}/${reviewId}/vote`,
        { voteType },
        {
          timeout: this.timeout,
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to submit vote');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ voteOnReview API error:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.error?.message) {
          throw new Error(axiosError.response.data.error.message);
        }
      }
      
      throw new Error('Failed to submit vote. Please try again.');
    }
  }

  // Remove vote from a review
  async removeVote(reviewId: string): Promise<{
    voteSummary: { helpfulVotes: number; unhelpfulVotes: number };
    userVote: null;
  }> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/${reviewId}/vote`,
        {
          timeout: this.timeout,
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to remove vote');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ removeVote API error:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.error?.message) {
          throw new Error(axiosError.response.data.error.message);
        }
      }
      
      throw new Error('Failed to remove vote. Please try again.');
    }
  }

  // Get user's current vote on a review
  async getUserVote(reviewId: string): Promise<{
    voteSummary: { helpfulVotes: number; unhelpfulVotes: number };
    userVote: 'helpful' | 'unhelpful' | null;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${reviewId}/vote`,
        {
          timeout: this.timeout,
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to get vote status');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ getUserVote API error:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.error?.message) {
          throw new Error(axiosError.response.data.error.message);
        }
      }
      
      throw new Error('Failed to get vote status. Please try again.');
    }
  }

  // Get vote status for multiple reviews (batch)
  async getBatchVoteStatus(reviewIds: string[]): Promise<{
    [reviewId: string]: {
      voteSummary: { helpfulVotes: number; unhelpfulVotes: number };
      userVote: 'helpful' | 'unhelpful' | null;
    };
  }> {
    try {

      // Make parallel requests for all review vote statuses
      const promises = reviewIds.map(reviewId => 
        this.getUserVote(reviewId).catch(error => {
          console.warn(`Failed to get vote status for review ${reviewId}:`, error);
          return null; // Return null for failed requests
        })
      );

      const results = await Promise.all(promises);
      
      // Build result object
      const voteStatusMap: { [reviewId: string]: any } = {};
      reviewIds.forEach((reviewId, index) => {
        if (results[index]) {
          voteStatusMap[reviewId] = results[index];
        }
      });

      return voteStatusMap;
    } catch (error) {
      console.error('❌ getBatchVoteStatus error:', error);
      return {}; // Return empty object on error
    }
  }
}

const reviewService = new ReviewService();
export default reviewService;