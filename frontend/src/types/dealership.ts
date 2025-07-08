export interface DealershipHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Dealership {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  latitude: number;
  longitude: number;
  googleRating: number;
  googleReviewCount: number;
  brands: string[];
  hours: DealershipHours;
  description?: string;
  photos?: string[];
  distance?: number;
}

export interface SearchParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  brand?: string | undefined;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  dealerships: Dealership[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export interface NearbyDealership {
  id: string;
  name: string;
  distance: number;
  rating: number;
  reviewCount: number;
}