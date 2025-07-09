import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import googlePlacesService from '../services/googlePlacesService';

// Helper function to calculate distance between two coordinates using Haversine formula
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

// GET /api/dealerships/search - Search dealerships by location
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { location, lat, lng, radius, brand, page = 1, limit = 100, sortBy = 'distance' } = req.query;
    
    logger.info('Dealership search request', { location, lat, lng, radius, brand, page, limit, sortBy });
    
    // Search dealerships using Google Places API
    const searchParams = {
      location: location as string,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : 10,
      brand: brand as string,
      limit: parseInt(limit as string),
    };

    const googleResults = await googlePlacesService.searchDealerships(searchParams);
    
    // Transform Google Places results to our app format
    const dealerships = googleResults.map(place => {
      const dealership = googlePlacesService.transformToAppFormat(place);
      
      // Add distance calculation if coordinates were provided
      if (searchParams.latitude && searchParams.longitude) {
        dealership.distance = calculateDistance(
          { latitude: searchParams.latitude, longitude: searchParams.longitude },
          { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
        );
      }
      
      return dealership;
    });

    // Apply sorting
    const sortOption = sortBy as string;
    switch (sortOption) {
      case 'distance':
        if (searchParams.latitude && searchParams.longitude) {
          dealerships.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
      case 'rating':
        dealerships.sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0));
        break;
      case 'reviews':
        dealerships.sort((a, b) => (b.googleReviewCount || 0) - (a.googleReviewCount || 0));
        break;
      case 'name':
        dealerships.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Default to distance if coordinates available, otherwise name
        if (searchParams.latitude && searchParams.longitude) {
          dealerships.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        } else {
          dealerships.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

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
      
      // Calculate distance using Haversine formula
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