import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import googlePlacesService from '../services/googlePlacesService';

// Helper function to calculate distance remains the same
const calculateDistance = (
  pos1: { latitude: number; longitude: number },
  pos2: { latitude: number; longitude: number }
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(pos2.latitude - pos1.latitude);
  const dLon = toRadians(pos2.longitude - pos1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pos1.latitude)) *
      Math.cos(toRadians(pos2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

const router = Router();

// GET /api/dealerships/search - Refactored for "load more" functionality
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { location, lat, lng, radius, brand, pageToken } = req.query;
    
    logger.info('Dealership search request', { location, lat, lng, radius, brand, pageToken });
    
    const searchParams = {
      location: location as string,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : 10,
      brand: brand as string,
      pageToken: pageToken as string,
    };

    // Call the refactored service method
    const googleResults = await googlePlacesService.searchDealerships(searchParams);
    
    // Transform Google Places results to our app format
    // Note: We now map over `googleResults.results` instead of `googleResults`
    const dealerships = googleResults.results.map(place => {
      const dealership = googlePlacesService.transformToAppFormat(place);
      
      // Add distance calculation if coordinates were provided for the initial search
      if (searchParams.latitude && searchParams.longitude) {
        dealership.distance = calculateDistance(
          { latitude: searchParams.latitude, longitude: searchParams.longitude },
          { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
        );
      }
      
      return dealership;
    });

    // Server-side sorting and pagination are removed. The frontend will handle sorting
    // on the currently loaded set, and pagination is replaced by the "load more" button.

    res.status(200).json({
      success: true,
      data: {
        dealerships,
        nextPageToken: googleResults.nextPageToken,
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        source: 'google_places_api'
      }
    });
  } catch (error) {
    logger.error('Dealership search error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while searching dealerships'
      }
    });
  }
});

// GET /api/dealerships/:placeId - Get dealership details (remains the same)
router.get('/:placeId', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;
    
    logger.info('Get dealership details request', { placeId });
    
    const googleResult = await googlePlacesService.getDealershipDetails(placeId);
    const dealership = googlePlacesService.transformToAppFormat(googleResult);
    
    res.status(200).json({
      success: true,
      data: dealership,
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        source: 'google_places_api'
      }
    });
  } catch (error) {
    logger.error('Get dealership details error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching dealership details'
      }
    });
  }
});

// GET /api/dealerships/nearby - Get nearby dealerships (remains the same)
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COORDINATES',
          message: 'Latitude and longitude are required'
        }
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const searchRadius = parseInt(radius as string);
    
    logger.info('Get nearby dealerships request', { latitude, longitude, searchRadius });
    
    const googleResults = await googlePlacesService.searchNearbyDealerships(
      latitude, 
      longitude, 
      searchRadius
    );
    
    const nearbyDealerships = googleResults.map(place => {
      const distance = calculateDistance(
        { latitude, longitude },
        { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
      );
      
      return {
        id: place.place_id,
        name: place.name,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0
      };
    });
    
    res.status(200).json({
      success: true,
      data: nearbyDealerships,
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        source: 'google_places_api'
      }
    });
  } catch (error) {
    logger.error('Get nearby dealerships error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching nearby dealerships'
      }
    });
  }
});

export default router;
