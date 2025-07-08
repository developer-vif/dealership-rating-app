import axios from 'axios';
import { Dealership, SearchParams, SearchResponse, NearbyDealership } from '../types/dealership';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

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

class DealershipService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/dealerships`,
    timeout: 10000,
  });

  async searchDealerships(params: SearchParams): Promise<SearchResponse> {
    try {
      const response = await this.api.get<ApiResponse<Dealership[]>>('/search', {
        params: {
          location: params.location,
          radius: params.radius || 10,
          brand: params.brand,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });

      if (!response.data.success) {
        throw new Error('Search request failed');
      }

      return {
        dealerships: response.data.data,
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: response.data.data.length,
          hasNext: false,
        },
      };
    } catch (error) {
      console.error('Error searching dealerships:', error);
      throw new Error('Failed to search dealerships. Please try again.');
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

  async searchDealershipsByLocation(
    latitude: number,
    longitude: number,
    params: Omit<SearchParams, 'latitude' | 'longitude'> = {}
  ): Promise<SearchResponse> {
    try {
      const response = await this.api.get<ApiResponse<Dealership[]>>('/search', {
        params: {
          lat: latitude,
          lng: longitude,
          radius: params.radius || 10,
          brand: params.brand,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      });

      if (!response.data.success) {
        throw new Error('Location-based search request failed');
      }

      return {
        dealerships: response.data.data,
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: response.data.data.length,
          hasNext: false,
        },
      };
    } catch (error) {
      console.error('Error searching dealerships by location:', error);
      throw new Error('Failed to search dealerships by location. Please try again.');
    }
  }
}

export default new DealershipService();