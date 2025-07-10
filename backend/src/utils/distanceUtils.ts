/**
 * Distance calculation utilities for dealership locations
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationWithDistance {
  latitude: number;
  longitude: number;
  distance?: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in kilometers (rounded to 1 decimal place)
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert degrees to radians
 * @param degrees Degrees to convert
 * @returns Radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Add distance calculation to a location object
 * @param location Location object with latitude and longitude
 * @param searchCenter Center point for distance calculation
 * @returns Location object with distance property added
 */
export const addDistanceToLocation = <T extends LocationWithDistance>(
  location: T,
  searchCenter: Coordinates
): T => {
  return {
    ...location,
    distance: calculateDistance(searchCenter, {
      latitude: location.latitude,
      longitude: location.longitude,
    }),
  };
};

/**
 * Add distance calculation to multiple location objects
 * @param locations Array of location objects
 * @param searchCenter Center point for distance calculation
 * @returns Array of location objects with distance property added
 */
export const addDistanceToLocations = <T extends LocationWithDistance>(
  locations: T[],
  searchCenter: Coordinates
): T[] => {
  return locations.map(location => addDistanceToLocation(location, searchCenter));
};

/**
 * Filter locations by maximum distance
 * @param locations Array of locations with distance
 * @param maxDistanceKm Maximum distance in kilometers
 * @returns Filtered array of locations within the specified distance
 */
export const filterByDistance = <T extends LocationWithDistance>(
  locations: T[],
  maxDistanceKm: number
): T[] => {
  return locations.filter(location => {
    return location.distance !== null && 
           location.distance !== undefined && 
           location.distance <= maxDistanceKm;
  });
};

/**
 * Sort locations by distance (closest first)
 * @param locations Array of locations with distance
 * @returns Sorted array of locations
 */
export const sortByDistance = <T extends LocationWithDistance>(
  locations: T[]
): T[] => {
  return [...locations].sort((a, b) => {
    const distanceA = a.distance ?? Infinity;
    const distanceB = b.distance ?? Infinity;
    return distanceA - distanceB;
  });
};