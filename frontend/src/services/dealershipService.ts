import axios from 'axios';
import { Dealership, SearchParams, SearchResponse, NearbyDealership } from '../types/dealership';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

// This is the shape of the top-level API response object
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

class DealershipService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/dealerships`,
    timeout: 30000, // 30 second timeout
  });

  // Search by location string
  async searchDealerships(params: SearchParams): Promise<SearchResponse> {
    try {
      // The backend now accepts SearchParams directly
      const response = await this.api.get<ApiResponse<SearchResponse>>('/search', {
        params,
      });

      if (!response.data.success) {
        throw new Error('Search request failed');
      }

      // The actual data (dealerships, nextPageToken) is nested in response.data.data
      return response.data.data;
    } catch (error) {
      console.error('❌ searchDealerships API error:', error);
      throw new Error('Failed to search dealerships. Please try again.');
    }
  }

  // Search by coordinates
  async searchDealershipsByLocation(
    latitude: number,
    longitude: number,
    params: Omit<SearchParams, 'latitude' | 'longitude' | 'location'> = {}
  ): Promise<SearchResponse> {
    try {
      const apiParams: SearchParams = {
        latitude,
        longitude,
        ...params,
      };
      
      const response = await this.api.get<ApiResponse<SearchResponse>>('/search', {
        params: apiParams,
      });

      if (!response.data.success) {
        throw new Error('Location-based search request failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ searchDealershipsByLocation API error:', error);
      throw new Error('Failed to search dealerships by location. Please try again.');
    }
  }

  async getNearbyDealerships(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<NearbyDealership[]> {
    try {
      const response = await this.api.get<ApiResponse<NearbyDealership[]>>('/nearby', {
        params: {
          lat: latitude,
          lng: longitude,
          radius,
        },
      });

      if (!response.data.success) {
        throw new Error('Nearby search request failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching nearby dealerships:', error);
      throw new Error('Failed to fetch nearby dealerships. Please try again.');
    }
  }

  async getDealershipDetails(placeId: string): Promise<Dealership> {
    try {
      const response = await this.api.get<ApiResponse<Dealership>>(`/${placeId}`);

      if (!response.data.success) {
        throw new Error('Failed to fetch dealership details');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching dealership details:', error);
      throw new Error('Failed to fetch dealership details. Please try again.');
    }
  }

  // Get top rated dealerships near a location
  async getTopRatedDealerships(
    location?: string,
    latitude?: number,
    longitude?: number,
    radius: number = 50,
    limit: number = 6
  ): Promise<Dealership[]> {
    try {
      const params: SearchParams = {
        ...(location && { location }),
        ...(latitude && { latitude }),
        ...(longitude && { longitude }),
        radius
      };
      
      const response = await this.searchDealerships(params);
      
      // Sort by average rating (highest first) and return top results
      return response.dealerships
        .filter(d => d.averageRating && d.averageRating > 0)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('❌ getTopRatedDealerships API error:', error);
      throw new Error('Failed to fetch top rated dealerships. Please try again.');
    }
  }
}

export default new DealershipService();
