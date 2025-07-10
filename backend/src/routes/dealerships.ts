import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import googlePlacesService from '../services/googlePlacesService';
import { query } from '../utils/database';
import { 
  addDistanceToLocations, 
  filterByDistance, 
  sortByDistance,
  Coordinates 
} from '../utils/distanceUtils';

const router = Router();

// GET /api/dealerships/top-rated-dealerships - Get top rated dealerships (moved to top to avoid TypeScript issues)
router.get('/top-rated-dealerships', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'ChIJ1234567890',
        googlePlaceId: 'ChIJ1234567890',
        name: 'Sunset Toyota',
        address: 'Sunset Toyota Location',
        phone: '',
        website: '',
        latitude: 14.5995,
        longitude: 120.9842,
        googleRating: 0,
        googleReviewCount: 0,
        brands: ['Toyota'],
        averageRating: 4.7,
        reviewCount: 3,
        photos: [],
        distance: 0,
        hours: {
          monday: 'Hours not available',
          tuesday: 'Hours not available',
          wednesday: 'Hours not available',
          thursday: 'Hours not available',
          friday: 'Hours not available',
          saturday: 'Hours not available',
          sunday: 'Hours not available',
        },
      },
      {
        id: 'ChIJV3uyERbJlzMRFaoqRHdQSzo',
        googlePlaceId: 'ChIJV3uyERbJlzMRFaoqRHdQSzo',
        name: 'Makati Ford – Aeon Auto Group Philippines',
        address: 'Makati Ford Location',
        phone: '',
        website: '',
        latitude: 14.5995,
        longitude: 120.9842,
        googleRating: 0,
        googleReviewCount: 0,
        brands: ['Ford'],
        averageRating: 4.0,
        reviewCount: 2,
        photos: [],
        distance: 0,
        hours: {
          monday: 'Hours not available',
          tuesday: 'Hours not available',
          wednesday: 'Hours not available',
          thursday: 'Hours not available',
          friday: 'Hours not available',
          saturday: 'Hours not available',
          sunday: 'Hours not available',
        },
      },
      {
        id: 'ChIJhctoBEvNlzMROq5Xo54t9Nc',
        googlePlaceId: 'ChIJhctoBEvNlzMROq5Xo54t9Nc',
        name: 'Car Empire Flagship',
        address: 'Car Empire Flagship Location',
        phone: '',
        website: '',
        latitude: 14.5995,
        longitude: 120.9842,
        googleRating: 0,
        googleReviewCount: 0,
        brands: ['Various'],
        averageRating: 3.0,
        reviewCount: 4,
        photos: [],
        distance: 0,
        hours: {
          monday: 'Hours not available',
          tuesday: 'Hours not available',
          wednesday: 'Hours not available',
          thursday: 'Hours not available',
          friday: 'Hours not available',
          saturday: 'Hours not available',
          sunday: 'Hours not available',
        },
      }
    ],
    meta: {
      requestId: 'test',
      timestamp: new Date().toISOString(),
      source: 'hardcoded_test_data'
    }
  });
});

// GET /api/dealerships/search - Enhanced with buffer strategy for radius filtering
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

    // Determine if we need radius filtering
    const needsRadiusFiltering = searchParams.radius && 
      (searchParams.latitude && searchParams.longitude || searchParams.location);

    let allFilteredDealerships: any[] = [];
    let currentPageToken = searchParams.pageToken;
    let searchCenter: { latitude: number; longitude: number } | undefined;
    let attempts = 0;
    const maxAttempts = 3; // Prevent infinite loops
    const minResultsForPageToken = 10; // Minimum results to provide nextPageToken when radius filtering

    // Buffer strategy: keep fetching pages until we have enough results or run out of pages
    do {
      attempts++;
      
      // Call the refactored service method
      const googleResults = await googlePlacesService.searchDealerships({
        ...searchParams,
        pageToken: currentPageToken
      });
      
      // Extract center coordinates for distance calculation from the search results
      if (!searchCenter) {
        searchCenter = googleResults.searchCenter;
      }
      const centerLatitude = searchCenter?.latitude;
      const centerLongitude = searchCenter?.longitude;
      
      // Transform Google Places results to our app format
      let dealerships = await Promise.all(googleResults.results.map(async place => {
        return await googlePlacesService.transformToAppFormat(place);
      }));

      // Add distance calculation if we have center coordinates
      if (centerLatitude && centerLongitude) {
        const searchCenterCoords: Coordinates = { latitude: centerLatitude, longitude: centerLongitude };
        dealerships = addDistanceToLocations(dealerships, searchCenterCoords);
      }

      // Filter by radius if needed
      let filteredDealerships = dealerships;
      if (needsRadiusFiltering && centerLatitude && centerLongitude) {
        filteredDealerships = filterByDistance(dealerships, searchParams.radius!);
        
        logger.info('Radius filtering applied', { 
          attempt: attempts,
          originalCount: dealerships.length,
          filteredCount: filteredDealerships.length,
          radiusKm: searchParams.radius,
          totalAccumulated: allFilteredDealerships.length + filteredDealerships.length
        });
      }

      // Accumulate filtered results
      allFilteredDealerships = [...allFilteredDealerships, ...filteredDealerships];
      
      // Update pageToken for next iteration
      currentPageToken = googleResults.nextPageToken || undefined;
      
      // Continue if we're doing radius filtering, have a pageToken, and don't have enough results yet
      if (needsRadiusFiltering && 
          currentPageToken && 
          allFilteredDealerships.length < minResultsForPageToken && 
          attempts < maxAttempts) {
        logger.info('Fetching additional page due to radius filtering', {
          currentResults: allFilteredDealerships.length,
          minRequired: minResultsForPageToken,
          hasNextPage: !!currentPageToken,
          attempt: attempts
        });
        continue;
      }
      
      break;
    } while (true);

    // Sort by distance if we have search center coordinates
    if (searchCenter) {
      allFilteredDealerships = sortByDistance(allFilteredDealerships);
    }

    // Determine if we should provide nextPageToken
    // Only provide it if we have enough results OR if radius filtering isn't being used
    const shouldProvideNextPageToken = currentPageToken && 
      (!needsRadiusFiltering || allFilteredDealerships.length >= minResultsForPageToken);

    res.status(200).json({
      success: true,
      data: {
        dealerships: allFilteredDealerships,
        nextPageToken: shouldProvideNextPageToken ? currentPageToken : undefined,
      },
      meta: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        source: 'google_places_api',
        radiusFiltering: needsRadiusFiltering,
        pagesProcessed: attempts,
        totalResults: allFilteredDealerships.length
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
    
    // Transform to our format and add distance calculation
    const searchCenter: Coordinates = { latitude, longitude };
    const nearbyDealerships = addDistanceToLocations(
      googleResults.map(place => ({
        id: place.place_id,
        name: place.name,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0
      })),
      searchCenter
    );
    
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

// GET /api/dealerships/:placeId - Get dealership details by Google Place ID
router.get('/:placeId', async (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PLACE_ID',
          message: 'Place ID is required'
        }
      });
    }

    logger.info('Get dealership details request', { placeId });
    
    // Get detailed info from Google Places
    const googleResult = await googlePlacesService.getDealershipDetails(placeId);
    const dealership = await googlePlacesService.transformToAppFormat(googleResult);
    
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

export default router;
