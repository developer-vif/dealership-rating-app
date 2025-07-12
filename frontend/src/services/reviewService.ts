import axios from 'axios';
import { DealershipReview, ReviewsPaginatedResponse } from '../types/dealership';
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
  async updateReview(
    reviewId: string,
    reviewData: Partial<{
      rating: number;
      title: string;
      content: string;
      receiptProcessingTime: string;
      platesProcessingTime: string;
    }>
  ): Promise<DealershipReview> {
    try {
      const response = await axios.put<ApiResponse<DealershipReview>>(`${this.baseURL}/${reviewId}`, reviewData, {
        timeout: this.timeout,
      });

      if (!response.data.success) {
        throw new Error('Failed to update review');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ updateReview API error:', error);
      throw new Error('Failed to update review. Please try again.');
    }
  }

  // Delete a review
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const response = await axios.delete<ApiResponse<null>>(`${this.baseURL}/${reviewId}`, {
        timeout: this.timeout,
      });

      if (!response.data.success) {
        throw new Error('Failed to delete review');
      }
    } catch (error) {
      console.error('❌ deleteReview API error:', error);
      throw new Error('Failed to delete review. Please try again.');
    }
  }
}

export default new ReviewService();