// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  CATALOG: `${API_BASE_URL}/api/catalog`,
  BOOK: `${API_BASE_URL}/api/book`,
  ORDERS: (userId: string) => `${API_BASE_URL}/api/orders/${userId}`,
} as const;

// Cart Configuration
export const CART_AUTO_CLOSE_DELAY = 5000; // 5 seconds

// Ticket Tier Display Names
export const TIER_DISPLAY_NAMES: Record<string, string> = {
  VIP: 'VIP',
  FRONT_ROW: 'Front Row',
  GA: 'General Admission',
};
