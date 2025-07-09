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
  pageToken?: string;
}

export interface SearchResponse {
  dealerships: Dealership[];
  nextPageToken?: string;
}

export interface NearbyDealership {
  id: string;
  name: string;
  distance: number;
  rating: number;
  reviewCount: number;
}

export interface DealershipReview {
  id: string;
  dealershipId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
}
