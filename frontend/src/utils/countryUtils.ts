/**
 * Country detection utilities for fallback location functionality
 */

export interface CountryInfo {
  name: string;
  code: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Cache for country detection to avoid repeated API calls
let cachedCountry: CountryInfo | null = null;

/**
 * Get user's current country using various detection methods
 */
export const detectUserCountry = async (): Promise<CountryInfo> => {
  // Return cached result if available
  if (cachedCountry) {
    return cachedCountry;
  }

  try {
    // Method 1: Use browser's geolocation if available
    const countryFromGeo = await getCountryFromGeolocation();
    if (countryFromGeo) {
      cachedCountry = countryFromGeo;
      return countryFromGeo;
    }
  } catch (error) {
    console.warn('Geolocation-based country detection failed:', error);
  }

  try {
    // Method 2: Use IP-based detection as fallback
    const countryFromIP = await getCountryFromIP();
    if (countryFromIP) {
      cachedCountry = countryFromIP;
      return countryFromIP;
    }
  } catch (error) {
    console.warn('IP-based country detection failed:', error);
  }

  // Method 3: Use timezone as additional fallback
  try {
    const countryFromTimezone = getCountryFromTimezone();
    if (countryFromTimezone) {
      cachedCountry = countryFromTimezone;
      return countryFromTimezone;
    }
  } catch (error) {
    console.warn('Timezone-based country detection failed:', error);
  }

  // Final fallback: Philippines (maintaining current app behavior)
  const fallbackCountry: CountryInfo = {
    name: 'Philippines',
    code: 'PH',
    coordinates: {
      latitude: 14.5995,
      longitude: 120.9842,
    },
  };
  
  cachedCountry = fallbackCountry;
  return fallbackCountry;
};

/**
 * Get country from user's geolocation coordinates
 */
const getCountryFromGeolocation = async (): Promise<CountryInfo | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    // Use a shorter timeout for country detection
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const country = await geocodeCoordinatesToCountry(
            position.coords.latitude,
            position.coords.longitude
          );
          resolve(country);
        } catch (error) {
          console.warn('Failed to geocode coordinates to country:', error);
          resolve(null);
        }
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000, // 10 minutes cache
      }
    );
  });
};

/**
 * Convert coordinates to country using Google Geocoding
 */
const geocodeCoordinatesToCountry = async (
  latitude: number,
  longitude: number
): Promise<CountryInfo | null> => {
  if (typeof google === 'undefined' || !google.maps) {
    throw new Error('Google Maps API not loaded');
  }

  const geocoder = new google.maps.Geocoder();
  const result = await geocoder.geocode({
    location: { lat: latitude, lng: longitude },
  });

  if (result.results && result.results.length > 0) {
    const addressComponents = result.results[0].address_components;
    
    const countryComponent = addressComponents.find(component =>
      component.types.includes('country')
    );

    if (countryComponent) {
      return {
        name: countryComponent.long_name,
        code: countryComponent.short_name,
        coordinates: {
          latitude,
          longitude,
        },
      };
    }
  }

  return null;
};

/**
 * Get country from IP address using a free IP geolocation service
 */
const getCountryFromIP = async (): Promise<CountryInfo | null> => {
  try {
    // Using ipapi.co as it's free and doesn't require API key
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000,
    } as RequestInit);
    
    if (!response.ok) {
      throw new Error('IP geolocation service unavailable');
    }
    
    const data = await response.json();
    
    if (data.country_name && data.country_code) {
      const countryInfo: CountryInfo = {
        name: data.country_name,
        code: data.country_code,
      };
      
      if (data.latitude && data.longitude) {
        countryInfo.coordinates = {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        };
      }
      
      return countryInfo;
    }
  } catch (error) {
    console.warn('IP-based country detection failed:', error);
  }
  
  return null;
};

/**
 * Get country from browser timezone (less accurate but works offline)
 */
const getCountryFromTimezone = (): CountryInfo | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common timezones to countries (simplified mapping)
    const timezoneToCountry: Record<string, CountryInfo> = {
      'Asia/Manila': {
        name: 'Philippines',
        code: 'PH',
        coordinates: { latitude: 14.5995, longitude: 120.9842 },
      },
      'America/New_York': {
        name: 'United States',
        code: 'US',
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
      },
      'Europe/London': {
        name: 'United Kingdom',
        code: 'GB',
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
      },
      'Asia/Tokyo': {
        name: 'Japan',
        code: 'JP',
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
      },
      'Australia/Sydney': {
        name: 'Australia',
        code: 'AU',
        coordinates: { latitude: -33.8688, longitude: 151.2093 },
      },
    };

    return timezoneToCountry[timezone] || null;
  } catch (error) {
    console.warn('Timezone-based country detection failed:', error);
    return null;
  }
};

/**
 * Get a default search location for a country
 */
export const getDefaultLocationForCountry = (country: CountryInfo): string => {
  // Country-specific defaults
  const countryDefaults: Record<string, string> = {
    'PH': 'Manila, Philippines',
    'US': 'New York, NY, USA',
    'GB': 'London, UK',
    'JP': 'Tokyo, Japan',
    'AU': 'Sydney, Australia',
  };

  return countryDefaults[country.code] || country.name;
};

/**
 * Clear the cached country (useful for testing or when user changes location)
 */
export const clearCountryCache = (): void => {
  cachedCountry = null;
};