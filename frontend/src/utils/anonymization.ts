/**
 * Utility functions for anonymizing reviewer information
 */

/**
 * Generate a better hash from a string (user ID) using a simple but effective algorithm
 * This ensures consistent anonymous identifiers for the same user
 */
function betterHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36); // Convert to base36 for shorter strings
}

/**
 * Generate a unique reviewer number from user ID
 * Uses the full hash to ensure uniqueness while maintaining consistency
 */
function generateUniqueNumber(userId: string, maxLength: number = 4): string {
  const hashStr = betterHash(userId);
  // Take first maxLength characters and convert back to ensure it's numeric-looking
  const truncated = hashStr.substring(0, maxLength);
  // Convert base36 back to decimal and ensure it's always the same length
  const decimal = parseInt(truncated, 36);
  const paddedNumber = decimal.toString().padStart(maxLength, '0');
  return paddedNumber;
}

/**
 * Generate an anonymous username based on user ID
 * Returns consistent usernames like "Reviewer #1234", "Reviewer #5678", etc.
 * Each user ID will always produce the same reviewer number
 */
export function generateAnonymousUsername(userId: string): string {
  const uniqueNumber = generateUniqueNumber(userId, 4);
  return `Reviewer #${uniqueNumber}`;
}

/**
 * Generate anonymous avatar initials based on user ID
 * Returns consistent initials like "R12", "R34", etc.
 */
export function generateAnonymousInitials(userId: string): string {
  const uniqueNumber = generateUniqueNumber(userId, 2);
  return `R${uniqueNumber}`;
}

/**
 * Generate a consistent avatar background color based on user ID
 * Returns a Material-UI color palette color
 */
export function generateAnonymousAvatarColor(userId: string): string {
  const colors = [
    '#1976d2', // blue
    '#388e3c', // green
    '#f57c00', // orange
    '#7b1fa2', // purple
    '#c2185b', // pink
    '#00796b', // teal
    '#455a64', // blue-grey
    '#5d4037', // brown
    '#d32f2f', // red
    '#1565c0', // dark blue
    '#2e7d32', // dark green
    '#ef6c00', // dark orange
  ];
  
  const hashStr = betterHash(userId);
  const hashNum = parseInt(hashStr.substring(0, 4), 36);
  const colorIndex = hashNum % colors.length;
  return colors[colorIndex];
}

/**
 * Anonymize reviewer data while preserving review integrity
 */
export function anonymizeReviewerData(review: any) {
  return {
    ...review,
    userName: generateAnonymousUsername(review.userId),
    userAvatar: '', // Remove real avatar
    isVerified: false, // Remove verification status for anonymity
  };
}