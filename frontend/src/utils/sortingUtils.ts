import { Dealership } from '../types/dealership';

export type SortOption = 'distance' | 'rating';

export const sortDealerships = (dealerships: Dealership[], sortBy: SortOption): Dealership[] => {
  const sorted = [...dealerships];

  switch (sortBy) {
    case 'distance':
      return sorted.sort((a, b) => {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        return distanceA - distanceB;
      });

    case 'rating':
      return sorted.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        const reviewCountA = a.reviewCount || 0;
        const reviewCountB = b.reviewCount || 0;

        // First sort by rating (highest first)
        if (ratingA !== ratingB) {
          return ratingB - ratingA;
        }

        // If ratings are equal, sort by review count (highest first)
        if (reviewCountA !== reviewCountB) {
          return reviewCountB - reviewCountA;
        }

        // If both rating and review count are equal, sort by distance
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        return distanceA - distanceB;
      });

    default:
      // Default to distance sorting
      return sorted.sort((a, b) => {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        return distanceA - distanceB;
      });
  }
};

export const getSortDisplayText = (sortBy: SortOption): string => {
  switch (sortBy) {
    case 'distance':
      return 'Distance (closest first)';
    case 'rating':
      return 'Rating (highest first)';
    default:
      return 'Distance (closest first)';
  }
};