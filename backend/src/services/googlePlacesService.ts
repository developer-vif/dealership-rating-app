import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';
import { logger } from '../utils/logger';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!googleMapsApiKey) {
  logger.error('Google Maps API key not configured');
  throw new Error('Google Maps API key is required');
}

const client = new Client({});

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
  limit?: number;
}

class GooglePlacesService {
  async searchDealerships(params: SearchDealershipsParams): Promise<GooglePlaceResult[]> {
    try {
      let query = 'car dealership OR motorcycle dealership';
      
      if (params.brand) {
        query = `${params.brand} dealership`;
      }

      const searchParams: any = {
        key: googleMapsApiKey!,
        query,
        // Remove pageSize parameter as it's not officially supported in Text Search
        // Google Places API typically returns up to 20 results per request by default
      };

      // Prioritize coordinates over location string for more accurate radius-based search
      if (params.latitude && params.longitude) {
        searchParams.location = `${params.latitude},${params.longitude}`;
        searchParams.radius = (params.radius || 10) * 1000; // Convert km to meters
        logger.info('Using coordinates for search', { 
          latitude: params.latitude, 
          longitude: params.longitude, 
          radius: params.radius 
        });
      } else if (params.location) {
        // Geocode the location string first
        const geocodeResponse = await client.geocode({
          params: {
            address: params.location,
            key: googleMapsApiKey!,
          },
        });

        if (geocodeResponse.data.results.length > 0) {
          const location = geocodeResponse.data.results[0].geometry.location;
          searchParams.location = `${location.lat},${location.lng}`;
          searchParams.radius = (params.radius || 10) * 1000;
          logger.info('Using geocoded location for search', { 
            originalLocation: params.location,
            latitude: location.lat, 
            longitude: location.lng, 
            radius: params.radius 
          });
        }
      } else {
        logger.warn('No location or coordinates provided for search');
        throw new Error('Either location string or coordinates must be provided');
      }

      // Determine how many results we need (up to 100 max for our app)
      const desiredLimit = Math.min(params.limit || 100, 100);
      let allResults: GooglePlaceResult[] = [];
      let nextPageToken: string | undefined;
      let pageCount = 0;
      const maxPages = 5; // Fetch up to 5 pages to get 100 results (20 per page)

      logger.info('Starting recursive dealership search with Google Places API', { 
        query,
        desiredLimit, 
        maxPages,
        hasCoordinates: !!(params.latitude && params.longitude)
      });

      do {
        pageCount++;
        
        // Add page token for subsequent requests
        if (nextPageToken) {
          searchParams.pageToken = nextPageToken;
          // Remove location params for subsequent requests to avoid conflicts
          delete searchParams.location;
          delete searchParams.radius;
        }

        logger.info(`Making Google Places API request`, {
          pageCount,
          hasPageToken: !!nextPageToken,
          searchParams: { ...searchParams, key: '[REDACTED]' }
        });

        const response = await client.textSearch({
          params: searchParams,
        });

        logger.info(`Google Places API response`, {
          status: response.data.status,
          resultCount: response.data.results?.length || 0,
          hasNextPageToken: !!response.data.next_page_token,
          pageCount
        });

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          logger.error('Google Places API error', { 
            status: response.data.status, 
            pageCount,
            error_message: response.data.error_message 
          });
          
          // Don't throw error on first request failure, but break the loop
          if (pageCount === 1) {
            throw new Error(`Google Places API error: ${response.data.status}`);
          }
          break;
        }

        // Handle zero results
        if (response.data.status === 'ZERO_RESULTS') {
          logger.info('No more results available from Google Places API');
          break;
        }

        // Add results from this page
        const pageResults = response.data.results as GooglePlaceResult[];
        allResults = [...allResults, ...pageResults];
        
        // Get next page token if available
        nextPageToken = response.data.next_page_token;
        
        logger.info(`Page ${pageCount} completed`, {
          resultsThisPage: pageResults.length,
          totalResultsSoFar: allResults.length,
          hasNextPage: !!nextPageToken,
          nextPageToken: nextPageToken ? 'present' : 'none'
        });

        // Check if we have enough results or no more pages
        if (allResults.length >= desiredLimit || !nextPageToken || pageCount >= maxPages) {
          break;
        }

        // Google requires a short delay between paginated requests (increased to 3 seconds)
        logger.info('Waiting 3 seconds before next page request...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } while (nextPageToken && pageCount < maxPages);

      // Remove duplicates based on place_id
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.place_id === result.place_id)
      );
      
      // Return up to the desired limit
      const finalResults = uniqueResults.slice(0, desiredLimit);
      
      logger.info('Search completed', {
        totalPagesRequested: pageCount,
        totalResultsFound: allResults.length,
        uniqueResultsFound: uniqueResults.length,
        resultsReturned: finalResults.length,
        desiredLimit,
        duplicatesRemoved: allResults.length - uniqueResults.length
      });

      return finalResults;
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
          key: googleMapsApiKey!,
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

  async searchNearbyDealerships(latitude: number, longitude: number, radius: number = 10): Promise<GooglePlaceResult[]> {
    try {
      logger.info('Searching nearby dealerships with Google Places API', { latitude, longitude, radius });

      const response = await client.placesNearby({
        params: {
          key: googleMapsApiKey!,
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

  transformToAppFormat(googlePlace: GooglePlaceResult): any {
    // Extract car brands from place name or types
    const carBrands = this.extractCarBrands(googlePlace.name, googlePlace.types);

    // Transform opening hours
    const hours = googlePlace.opening_hours?.weekday_text ? {
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
    const commonBrands = [
      'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia',
      'Subaru', 'Mazda', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi',
      'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick',
      'GMC', 'Ram', 'Jeep', 'Dodge', 'Chrysler', 'Mitsubishi', 'Volvo',
      'Tesla', 'Porsche', 'Jaguar', 'Land Rover', 'Mini', 'Fiat',
    ];

    const foundBrands: string[] = [];
    const nameUpper = name.toUpperCase();

    for (const brand of commonBrands) {
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