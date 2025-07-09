import { Client, TextSearchRequestParams } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
import { logger } from '../utils/logger';

// --- Configuration and Constants ---

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

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
  brands: string[];
  hours: DealershipHours;
  photos?: string[];
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
  pageToken?: string;
}

export interface DealershipSearchResult {
  results: GooglePlaceResult[];
  nextPageToken?: string;
}

class GooglePlacesService {
  async searchDealerships(params: SearchDealershipsParams): Promise<DealershipSearchResult> {
    try {
      const searchParams: Partial<TextSearchRequestParams> = {};

      // If a pageToken is provided, use it to fetch the next page.
      // Otherwise, perform a new search based on location/query.
      if (params.pageToken) {
        searchParams.pagetoken = params.pageToken;
        logger.info('Fetching next page of results', { pageToken: params.pageToken });
      } else {
        let query = 'car dealership OR motorcycle dealership';
        if (params.brand) {
          query = `${params.brand} dealership`;
        }
        searchParams.query = query;

        // Prioritize coordinates over location string for more accurate radius-based search
        if (params.latitude && params.longitude) {
          searchParams.location = `${params.latitude},${params.longitude}`;
          searchParams.radius = (params.radius || DEFAULT_SEARCH_RADIUS_KM) * 1000; // Convert km to meters
          logger.info('Starting new search using coordinates', { query, latitude: params.latitude, longitude: params.longitude, radius: params.radius });
        } else if (params.location) {
          // Geocode the location string first
          const geocodeResponse = await client.geocode({
            params: { address: params.location },
          });

          if (geocodeResponse.data.results.length > 0) {
            const location = geocodeResponse.data.results[0].geometry.location;
            searchParams.location = `${location.lat},${location.lng}`;
            searchParams.radius = (params.radius || DEFAULT_SEARCH_RADIUS_KM) * 1000;
            logger.info('Starting new search using geocoded location', { query, originalLocation: params.location, radius: params.radius });
          } else {
            logger.warn('Could not geocode location', { location: params.location });
            throw new Error('Could not find coordinates for the provided location.');
          }
        } else {
          logger.warn('No location, coordinates, or pageToken provided for search');
          throw new Error('Either location/coordinates for a new search or a pageToken for an existing one must be provided');
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
        logger.error('Google Places API error', { 
          status: response.data.status, 
          error_message: response.data.error_message 
        });
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return {
        results: (response.data.results as GooglePlaceResult[]) || [],
        nextPageToken: response.data.next_page_token,
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

  transformToAppFormat(googlePlace: GooglePlaceResult): Dealership {
    // Extract car brands from place name or types
    const carBrands = this.extractCarBrands(googlePlace.name, googlePlace.types);

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
      brands: carBrands,
      hours,
      photos: googlePlace.photos?.map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${googleMapsApiKey}`
      ) || [],
    };
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

