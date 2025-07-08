import { Loader } from '@googlemaps/js-api-loader';

let isLoaded = false;
let isLoading = false;
let loader: Loader | null = null;

export const loadGoogleMapsAPI = async (): Promise<void> => {
  if (isLoaded) {
    return;
  }

  if (isLoading) {
    // Wait for the current loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  isLoading = true;

  try {
    loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    await loader.load();
    isLoaded = true;
  } catch (error) {
    console.error('Failed to load Google Maps API:', error);
    throw error;
  } finally {
    isLoading = false;
  }
};

export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && typeof google !== 'undefined' && google.maps;
};