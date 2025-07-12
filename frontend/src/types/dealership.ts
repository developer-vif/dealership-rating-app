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
  // Our database ratings
  averageRating: number;
  reviewCount: number;
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
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  content: string;
  receiptProcessingTime: string;
  platesProcessingTime: string;
  visitDate: string;
  isVerified: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsPaginatedResponse {
  reviews: DealershipReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}
