// Ticket & Catalog Types
export type TicketTier = {
  tier: string;
  priceUsd: string;
  quantityAvailable: number;
};

export type CatalogResponse = {
  success: boolean;
  data: TicketTier[];
  error?: string;
};

// Cart Types
export type CartItem = {
  tier: string;
  quantity: number;
  priceUsd: string;
};

// Order Types
export type OrderItem = {
  id: number;
  orderId: string;
  ticketTier: string;
  quantity: number;
  priceAtPurchase: string;
};

export type Order = {
  id: string;
  userId: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

export type OrdersResponse = {
  success: boolean;
  data: Order[];
  error?: string;
};

// Booking Types
export type BookingRequest = {
  userId: string;
  cartItems: Array<{
    tier: string;
    quantity: number;
  }>;
};

export type BookingSuccess = {
  orderId: string;
  userId: string;
  totalAmount: string;
  items: Array<{
    tier: string;
    quantity: number;
    priceAtPurchase: string;
  }>;
  status: string;
};

export type BookingResponse = {
  success: boolean;
  data?: BookingSuccess;
  error?: string;
};
