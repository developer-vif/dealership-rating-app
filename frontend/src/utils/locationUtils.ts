export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const calculateDistance = (
  pos1: Coordinates,
  pos2: Coordinates
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

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
};

export const getCurrentLocationName = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    console.log('Attempting to geocode coordinates:', { latitude, longitude });
    
    // Ensure Google Maps API is loaded
    const { loadGoogleMapsAPI } = await import('./googleMapsLoader');
    await loadGoogleMapsAPI();
    
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({
      location: { lat: latitude, lng: longitude },
    });

    if (result.results && result.results.length > 0) {
      console.log('Geocoding successful:', result.results[0].formatted_address);
      const addressComponents = result.results[0].address_components;
      
      // Try to get city, state format
      const city = addressComponents.find(component => 
        component.types.includes('locality') || 
        component.types.includes('sublocality')
      )?.long_name;
      
      const state = addressComponents.find(component => 
        component.types.includes('administrative_area_level_1')
      )?.short_name;
      
      if (city && state) {
        return `${city}, ${state}`;
      }
      
      // Fallback to formatted address
      return result.results[0].formatted_address;
    } else {
      console.warn('Geocoding returned no results.');
    }
  } catch (error) {
    console.error('Error in getCurrentLocationName:', error);
  }
  
  console.log('Geocoding failed, returning coordinates.');
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

export const isLocationPermissionGranted = async (): Promise<boolean> => {
  if (!navigator.permissions) {
    return false;
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'granted';
  } catch {
    return false;
  }
};

export const requestLocationPermission = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: 5000 }
    );
  });
};