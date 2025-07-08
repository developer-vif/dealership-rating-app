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
}

const useGeolocation = (enableHighAccuracy: boolean = true): UseGeolocationResult => {
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

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        let message = 'Failed to get your location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out';
            break;
          default:
            message = 'An unknown error occurred while getting location';
            break;
        }

        setError({
          code: err.code,
          message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [supported, enableHighAccuracy]);

  // Auto-fetch location on mount if supported
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    position,
    error,
    loading,
    supported,
    getCurrentPosition,
    clearError,
  };
};

export default useGeolocation;