import { Client, TextSearchRequest } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { logger } from '../utils/logger';
import { query } from '../utils/database';
import { addDistanceToLocation, Coordinates } from '../utils/distanceUtils';

// --- Configuration and Constants ---

const googleMapsApiKey = process.env['GOOGLE_MAPS_API_KEY'];

if (!googleMapsApiKey) {
  logger.error('Google Maps API key not configured');
  throw new Error('Google Maps API key is required');
}

const DEFAULT_SEARCH_RADIUS_KM = 10;

const COMMON_CAR_BRANDS = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia',
  'Subaru', 'Mazda', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi',
  'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick',
  'GMC', 'Ram', 'Jeep', 'Dodge', 'Chrysler', 'Mitsubishi', 'Volvo',
  'Tesla', 'Porsche', 'Jaguar', 'Land Rover', 'Mini', 'Fiat',
];

// --- Client Initialization ---

// Configure a client instance to automatically include the API key
const client = new Client({
  axiosInstance: axios.create({
    params: {
      key: googleMapsApiKey,
    },
  }),
});

// --- Type Definitions ---

// Replicating frontend types to avoid cross-package imports
export interface DealershipHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Dealership {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  latitude: number;
  longitude: number;
  googleRating: number;
  googleReviewCount: number;
  // Our database ratings
  averageRating: number;
  reviewCount: number;
  brands: string[];
  hours: DealershipHours;
  photos?: string[];
  // Distance from search center (calculated dynamically)
  distance?: number;
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
}

export interface SearchDealershipsParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  brand?: string;
  dealershipName?: string;
  pageToken?: string;
}

export interface DealershipSearchResult {
  results: GooglePlaceResult[];
  nextPageToken?: string;
  searchCenter?: { latitude: number; longitude: number };
}

class GooglePlacesService {
  async searchDealerships(params: SearchDealershipsParams): Promise<DealershipSearchResult> {
    try {
      const searchParams: any = {};
      let searchCenter: { latitude: number; longitude: number } | undefined;

      // If a pageToken is provided, use it to fetch the next page.
      // For pageToken requests, we still need the original search center for radius filtering
      if (params.pageToken) {
        searchParams.pagetoken = params.pageToken;
        
        // For pageToken requests, we still need search center coordinates for filtering
        if (params.latitude && params.longitude) {
          searchCenter = { latitude: params.latitude, longitude: params.longitude };
        } else if (params.location) {
          // Re-geocode the location for pageToken requests to get coordinates
          const geocodeResponse = await client.geocode({
            params: { 
              address: params.location,
              key: googleMapsApiKey
            },
          });
          if (geocodeResponse.data.results.length > 0) {
            const location = geocodeResponse.data.results[0].geometry.location;
            searchCenter = { latitude: location.lat, longitude: location.lng };
          }
        }
        
        logger.info('Fetching next page of results', { pageToken: params.pageToken, searchCenter });
      } else {
        let query = 'car dealership OR motorcycle dealership';
        if (params.dealershipName) {
          // If dealership name is provided, use it as the primary query
          if (params.brand) {
            query = `${params.dealershipName} ${params.brand} dealership`;
          } else {
            query = params.dealershipName;
          }
        } else if (params.brand) {
          query = `${params.brand} dealership`;
        }
        searchParams.query = query;
        
        logger.info('Query construction for Google Places search', {
          dealershipName: params.dealershipName,
          brand: params.brand,
          constructedQuery: query,
          dealershipNameExists: !!params.dealershipName,
          brandExists: !!params.brand
        });

        // Prioritize coordinates over location string for more accurate radius-based search
        if (params.latitude && params.longitude) {
          searchParams.location = `${params.latitude},${params.longitude}`;
          searchParams.radius = (params.radius || DEFAULT_SEARCH_RADIUS_KM) * 1000; // Convert km to meters
          searchCenter = { latitude: params.latitude, longitude: params.longitude };
          logger.info('Starting new search using coordinates', { 
            query, 
            latitude: params.latitude, 
            longitude: params.longitude, 
            radius: params.radius,
            brand: params.brand,
            dealershipName: params.dealershipName
          });
        } else if (params.location) {
          // Geocode the location string first
          const geocodeResponse = await client.geocode({
            params: { 
              address: params.location,
              key: googleMapsApiKey
            },
          });

          if (geocodeResponse.data.results.length > 0) {
            const location = geocodeResponse.data.results[0].geometry.location;
            searchParams.location = `${location.lat},${location.lng}`;
            searchParams.radius = (params.radius || DEFAULT_SEARCH_RADIUS_KM) * 1000;
            searchCenter = { latitude: location.lat, longitude: location.lng };
            logger.info('Starting new search using geocoded location', { 
              query, 
              originalLocation: params.location, 
              radius: params.radius,
              brand: params.brand,
              dealershipName: params.dealershipName
            });
          } else {
            logger.warn('Could not geocode location', { location: params.location });
            throw new Error('Could not find coordinates for the provided location.');
          }
        } else {
          // No location provided - use default Philippines location as fallback
          logger.info('No location provided, using default Philippines location for search', {
            dealershipName: params.dealershipName,
            brand: params.brand
          });
          
          // Default to Manila, Philippines coordinates
          const defaultLatitude = 14.5995;
          const defaultLongitude = 120.9842;
          
          searchParams.location = `${defaultLatitude},${defaultLongitude}`;
          searchParams.radius = (params.radius || DEFAULT_SEARCH_RADIUS_KM) * 1000;
          searchCenter = { latitude: defaultLatitude, longitude: defaultLongitude };
          
          logger.info('Using default Philippines location for search', { 
            query, 
            latitude: defaultLatitude, 
            longitude: defaultLongitude, 
            radius: params.radius,
            brand: params.brand,
            dealershipName: params.dealershipName
          });
        }
      }

      logger.info(`Making Google Places API request`, { searchParams });

      const response = await client.textSearch({
        params: searchParams,
      });

      logger.info(`Google Places API response`, {
        status: response.data.status,
        resultCount: response.data.results?.length || 0,
        hasNextPageToken: !!response.data.next_page_token,
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        // Handle invalid pageToken gracefully - return empty results instead of throwing error
        if (response.data.status === 'INVALID_REQUEST' && params.pageToken) {
          logger.warn('PageToken has become invalid, returning empty results to continue gracefully', { 
            status: response.data.status, 
            pageToken: params.pageToken,
            error_message: response.data.error_message 
          });
          return {
            results: [],
            nextPageToken: undefined,
            searchCenter,
          };
        }
        
        logger.error('Google Places API error', { 
          status: response.data.status, 
          error_message: response.data.error_message 
        });
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return {
        results: (response.data.results as GooglePlaceResult[]) || [],
        nextPageToken: response.data.next_page_token,
        searchCenter,
      };

    } catch (error) {
      logger.error('Error searching dealerships', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to search dealerships with Google Places API');
    }
  }

  async getDealershipDetails(placeId: string): Promise<GooglePlaceResult> {
    try {
      logger.info('Getting dealership details from Google Places API', { placeId });

      const response = await client.placeDetails({
        params: {
          place_id: placeId,
          key: googleMapsApiKey,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'user_ratings_total',
            'formatted_phone_number',
            'website',
            'opening_hours',
            'photos',
            'types',
          ],
        },
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Places API error for place details', { status: response.data.status, placeId });
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.result as GooglePlaceResult;
    } catch (error) {
      logger.error('Error getting dealership details', { error: error instanceof Error ? error.message : 'Unknown error', placeId });
      throw new Error('Failed to get dealership details from Google Places API');
    }
  }

  async searchNearbyDealerships(latitude: number, longitude: number, radius: number = DEFAULT_SEARCH_RADIUS_KM): Promise<GooglePlaceResult[]> {
    try {
      logger.info('Searching nearby dealerships with Google Places API', { latitude, longitude, radius });

      const response = await client.placesNearby({
        params: {
          location: `${latitude},${longitude}`,
          radius: radius * 1000, // Convert km to meters
          key: googleMapsApiKey,
          type: 'car_dealer',
        },
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Places API error for nearby search', { status: response.data.status });
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.results as GooglePlaceResult[];
    } catch (error) {
      logger.error('Error searching nearby dealerships', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to search nearby dealerships with Google Places API');
    }
  }

  async getDealershipRating(placeId: string): Promise<{ averageRating: number; reviewCount: number }> {
    try {
      const ratingQuery = `
        SELECT 
          COALESCE(AVG(rating), 0) as average_rating,
          COUNT(*) as review_count
        FROM reviews r
        JOIN dealerships d ON r.dealership_id = d.id
        WHERE d.google_place_id = $1
      `;
      
      const result = await query(ratingQuery, [placeId]);
      
      if (result.rows.length === 0) {
        return { averageRating: 0, reviewCount: 0 };
      }
      
      const row = result.rows[0];
      return {
        averageRating: parseFloat(row.average_rating) || 0,
        reviewCount: parseInt(row.review_count) || 0
      };
    } catch (error) {
      logger.error('Error fetching dealership rating from database:', error);
      return { averageRating: 0, reviewCount: 0 };
    }
  }

  async transformToAppFormat(googlePlace: GooglePlaceResult): Promise<Dealership> {
    // Extract car brands from place name or types
    const carBrands = this.extractCarBrands(googlePlace.name, googlePlace.types);

    // Get database rating for this dealership
    const dbRating = await this.getDealershipRating(googlePlace.place_id);

    // Transform opening hours
    const hours: DealershipHours = googlePlace.opening_hours?.weekday_text ? {
      monday: this.parseHours(googlePlace.opening_hours.weekday_text[1]) || 'Closed',
      tuesday: this.parseHours(googlePlace.opening_hours.weekday_text[2]) || 'Closed',
      wednesday: this.parseHours(googlePlace.opening_hours.weekday_text[3]) || 'Closed',
      thursday: this.parseHours(googlePlace.opening_hours.weekday_text[4]) || 'Closed',
      friday: this.parseHours(googlePlace.opening_hours.weekday_text[5]) || 'Closed',
      saturday: this.parseHours(googlePlace.opening_hours.weekday_text[6]) || 'Closed',
      sunday: this.parseHours(googlePlace.opening_hours.weekday_text[0]) || 'Closed',
    } : {
      monday: 'Hours not available',
      tuesday: 'Hours not available',
      wednesday: 'Hours not available',
      thursday: 'Hours not available',
      friday: 'Hours not available',
      saturday: 'Hours not available',
      sunday: 'Hours not available',
    };

    return {
      id: googlePlace.place_id,
      googlePlaceId: googlePlace.place_id,
      name: googlePlace.name,
      address: googlePlace.formatted_address,
      phone: googlePlace.formatted_phone_number || '',
      website: googlePlace.website || '',
      latitude: googlePlace.geometry.location.lat,
      longitude: googlePlace.geometry.location.lng,
      googleRating: googlePlace.rating || 0,
      googleReviewCount: googlePlace.user_ratings_total || 0,
      // Include our database ratings
      averageRating: dbRating.averageRating,
      reviewCount: dbRating.reviewCount,
      brands: carBrands,
      hours,
      photos: googlePlace.photos?.map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${googleMapsApiKey}`
      ) || [],
    };
  }

  /**
   * Transform Google Place to Dealership format with distance calculation
   * @param googlePlace Google Place result
   * @param searchCenter Center point for distance calculation
   * @returns Dealership with distance calculated
   */
  async transformToAppFormatWithDistance(
    googlePlace: GooglePlaceResult, 
    searchCenter: Coordinates
  ): Promise<Dealership> {
    const dealership = await this.transformToAppFormat(googlePlace);
    return addDistanceToLocation(dealership, searchCenter);
  }

  private extractCarBrands(name: string, types: string[]): string[] {
    const foundBrands: string[] = [];
    const nameUpper = name.toUpperCase();

    for (const brand of COMMON_CAR_BRANDS) {
      if (nameUpper.includes(brand.toUpperCase())) {
        foundBrands.push(brand);
      }
    }

    // If no brands found, try to infer from name patterns
    if (foundBrands.length === 0) {
      if (nameUpper.includes('AUTO') || nameUpper.includes('MOTOR')) {
        foundBrands.push('Multi-Brand');
      } else {
        foundBrands.push('Unknown');
      }
    }

    return foundBrands;
  }

  private parseHours(dayText: string): string | null {
    if (!dayText) return null;
    
    // Extract time from "Monday: 9:00 AM – 8:00 PM" format
    const match = dayText.match(/:\s*(.+)/);
    return match ? match[1] : null;
  }
}

export default new GooglePlacesService();

