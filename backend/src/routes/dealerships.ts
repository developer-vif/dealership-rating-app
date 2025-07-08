import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import googlePlacesService from '../services/googlePlacesService';

const router = Router();

// GET /api/dealerships/search - Search dealerships by location
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { location, lat, lng, radius, brand, page = 1, limit = 20 } = req.query;
    
    logger.info('Dealership search request', { location, lat, lng, radius, brand, page, limit });
    
    // Search dealerships using Google Places API
    const searchParams = {
      location: location as string,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : 10,
      brand: brand as string,
    };

    const googleResults = await googlePlacesService.searchDealerships(searchParams);
    
    // Transform Google Places results to our app format
    const dealerships = googleResults.map(place => 
      googlePlacesService.transformToAppFormat(place)
    );

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedDealerships = dealerships.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedDealerships,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: dealerships.length,
        hasNext: endIndex < dealerships.length
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

// GET /api/dealerships/:placeId - Get dealership details
router.get('/:placeId', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;
    
    logger.info('Get dealership details request', { placeId });
    
    // Get dealership details from Google Places API
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

// GET /api/dealerships/nearby - Get nearby dealerships
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
    
    // Search nearby dealerships using Google Places API
    const googleResults = await googlePlacesService.searchNearbyDealerships(
      latitude, 
      longitude, 
      searchRadius
    );
    
    // Transform to simplified format for nearby results
    const nearbyDealerships = googleResults.map(place => {
      const fullDealership = googlePlacesService.transformToAppFormat(place);
      
      // Calculate distance (simplified - in a real app you'd use proper distance calculation)
      const distance = Math.sqrt(
        Math.pow(latitude - place.geometry.location.lat, 2) + 
        Math.pow(longitude - place.geometry.location.lng, 2)
      ) * 111; // Rough conversion to km
      
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