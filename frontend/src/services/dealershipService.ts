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
      const apiParams = {
        location: params.location,
        radius: params.radius || 10,
        brand: params.brand,
        page: params.page || 1,
        limit: params.limit || 50,
      };
      
      
      const response = await this.api.get<ApiResponse<Dealership[]>>('/search', {
        params: apiParams,
      });

      if (!response.data.success) {
        throw new Error('Search request failed');
      }

      const searchResponse = {
        dealerships: response.data.data,
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: response.data.data.length,
          hasNext: false,
        },
      };
      
      console.log('✅ searchDealerships API response:', {
        dealershipsCount: searchResponse.dealerships.length,
        pagination: searchResponse.pagination,
        firstDealership: searchResponse.dealerships[0]?.name || 'N/A'
      });
      
      return searchResponse;
    } catch (error) {
      console.error('❌ searchDealerships API error:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
      }
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
      const apiParams = {
        lat: latitude,
        lng: longitude,
        radius: params.radius || 10,
        brand: params.brand,
        page: params.page || 1,
        limit: params.limit || 50,
      };
      
      console.log('🚀 DealershipService.searchDealershipsByLocation called with:', { latitude, longitude, params });
      console.log('📮 API request parameters:', apiParams);
      
      const response = await this.api.get<ApiResponse<Dealership[]>>('/search', {
        params: apiParams,
      });

      if (!response.data.success) {
        throw new Error('Location-based search request failed');
      }

      const locationSearchResponse = {
        dealerships: response.data.data,
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: response.data.data.length,
          hasNext: false,
        },
      };
      
      console.log('✅ searchDealershipsByLocation API response:', {
        dealershipsCount: locationSearchResponse.dealerships.length,
        pagination: locationSearchResponse.pagination,
        firstDealership: locationSearchResponse.dealerships[0]?.name || 'N/A'
      });
      
      return locationSearchResponse;
    } catch (error) {
      console.error('❌ searchDealershipsByLocation API error:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
      }
      throw new Error('Failed to search dealerships by location. Please try again.');
    }
  }
}

export default new DealershipService();