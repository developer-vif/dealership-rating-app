import { useState, useEffect, useCallback } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationResult {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  supported: boolean;
  getCurrentPosition: () => void;
  clearError: () => void;
  retry: () => void;
}

const useGeolocation = (): UseGeolocationResult => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const supported = 'geolocation' in navigator;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!supported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    setLoading(true);
    setError(null);

    // Add a timeout wrapper to handle CoreLocation issues
    const timeoutId = setTimeout(() => {
      setError({
        code: 3, // TIMEOUT
        message: 'Location request timed out. Please check your location services.',
      });
      setLoading(false);
    }, 15000); // 15 second timeout

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        let message = 'Failed to get your location';
        
        // Suppress CoreLocation console errors to avoid user confusion
        if (err.message && err.message.includes('kCLErrorLocationUnknown')) {
          console.warn('Location service temporarily unavailable. This is normal and the app will continue to work.');
        }
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services in your browser settings.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Please check your internet connection and try again.';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
          default:
            // Handle CoreLocation specific errors
            if (err.message && err.message.includes('kCLErrorLocationUnknown')) {
              message = 'Location service temporarily unavailable. You can still search by entering a location manually.';
            } else {
              message = 'An unknown error occurred while getting location. Please try again.';
            }
            break;
        }

        setError({
          code: err.code,
          message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: false, // Try with lower accuracy first to avoid CoreLocation issues
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [supported]);

  // Auto-fetch location on mount if supported
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const retry = useCallback(() => {
    clearError();
    getCurrentPosition();
  }, [clearError, getCurrentPosition]);

  return {
    position,
    error,
    loading,
    supported,
    getCurrentPosition,
    clearError,
    retry,
  };
};

export default useGeolocation;