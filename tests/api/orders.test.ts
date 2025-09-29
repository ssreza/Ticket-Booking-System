import { test, expect } from '@playwright/test';
import { resetDatabase, waitForBackend } from '../helpers/setup';

const API_BASE = 'http://localhost:3000';

test.describe('Orders API Tests', () => {
  test.beforeAll(async () => {
    await waitForBackend();
  });

  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('GET /api/orders/:userId - should return empty array for user with no orders', async () => {
    const userId = 'new-user-123';
    const response = await fetch(`${API_BASE}/api/orders/${userId}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  test('GET /api/orders/:userId - should return user orders after booking', async () => {
    const userId = 'test-user-orders';

    // First, make a booking
    const bookingRequest = {
      userId,
      cartItems: [
        { tier: 'VIP', quantity: 2 },
        { tier: 'GA', quantity: 5 }
      ]
    };

    await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingRequest)
    });

    // Now fetch orders
    const response = await fetch(`${API_BASE}/api/orders/${userId}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);

    const order = data.data[0];
    expect(order.userId).toBe(userId);
    expect(order.totalAmount).toBe('250.00'); // 2×$100 + 5×$10
    expect(order.status).toBe('PAID');
    expect(order.items).toHaveLength(2);
    expect(order).toHaveProperty('createdAt');
  });

  test('GET /api/orders/:userId - should return multiple orders', async () => {
    const userId = 'multi-order-user';

    // Make first booking
    await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        cartItems: [{ tier: 'VIP', quantity: 1 }]
      })
    });

    // Make second booking
    await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        cartItems: [{ tier: 'GA', quantity: 10 }]
      })
    });

    // Fetch orders
    const response = await fetch(`${API_BASE}/api/orders/${userId}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);

    // Verify orders are sorted by date (newest first)
    const dates = data.data.map((o: any) => new Date(o.createdAt).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  test('GET /api/orders/:userId - should include all order item details', async () => {
    const userId = 'detailed-order-user';

    // Make booking
    await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        cartItems: [
          { tier: 'VIP', quantity: 1 },
          { tier: 'FRONT_ROW', quantity: 2 }
        ]
      })
    });

    // Fetch orders
    const response = await fetch(`${API_BASE}/api/orders/${userId}`);
    const data = await response.json();

    const order = data.data[0];
    
    // Verify VIP item
    const vipItem = order.items.find((i: any) => i.ticketTier === 'VIP');
    expect(vipItem).toBeDefined();
    expect(vipItem.quantity).toBe(1);
    expect(vipItem.priceAtPurchase).toBe('100.00');

    // Verify Front Row item
    const frItem = order.items.find((i: any) => i.ticketTier === 'FRONT_ROW');
    expect(frItem).toBeDefined();
    expect(frItem.quantity).toBe(2);
    expect(frItem.priceAtPurchase).toBe('50.00');
  });

  test('GET /api/orders/:userId - should only return orders for specific user', async () => {
    const user1 = 'user-1';
    const user2 = 'user-2';

    // User 1 makes booking
    await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user1,
        cartItems: [{ tier: 'VIP', quantity: 1 }]
      })
    });

    // User 2 makes booking
    await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user2,
        cartItems: [{ tier: 'GA', quantity: 5 }]
      })
    });

    // Fetch user1 orders
    const user1Response = await fetch(`${API_BASE}/api/orders/${user1}`);
    const user1Data = await user1Response.json();

    expect(user1Data.data).toHaveLength(1);
    expect(user1Data.data[0].userId).toBe(user1);
    expect(user1Data.data[0].totalAmount).toBe('100.00');

    // Fetch user2 orders
    const user2Response = await fetch(`${API_BASE}/api/orders/${user2}`);
    const user2Data = await user2Response.json();

    expect(user2Data.data).toHaveLength(1);
    expect(user2Data.data[0].userId).toBe(user2);
    expect(user2Data.data[0].totalAmount).toBe('50.00');
  });
});
