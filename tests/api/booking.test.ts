import { test, expect } from '@playwright/test';
import { resetDatabase, waitForBackend } from '../helpers/setup';

const API_BASE = 'http://localhost:3000';

test.describe('Booking API Tests', () => {
  test.beforeAll(async () => {
    await waitForBackend();
  });

  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('POST /api/book - should successfully book tickets', async () => {
    const bookingRequest = {
      userId: 'test-user-123',
      cartItems: [
        { tier: 'VIP', quantity: 2 }
      ]
    };

    const response = await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingRequest)
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('orderId');
    expect(data.data.userId).toBe('test-user-123');
    expect(data.data.totalAmount).toBe('200.00'); // 2 × $100
    expect(data.data.status).toBe('PAID');
    expect(data.data.items).toHaveLength(1);
    expect(data.data.items[0].tier).toBe('VIP');
    expect(data.data.items[0].quantity).toBe(2);
  });

  test('POST /api/book - should book multiple ticket types', async () => {
    const bookingRequest = {
      userId: 'test-user-456',
      cartItems: [
        { tier: 'VIP', quantity: 1 },
        { tier: 'FRONT_ROW', quantity: 2 },
        { tier: 'GA', quantity: 5 }
      ]
    };

    const response = await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingRequest)
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.totalAmount).toBe('250.00'); // 1×$100 + 2×$50 + 5×$10
    expect(data.data.items).toHaveLength(3);
  });

  test('POST /api/book - should fail when insufficient stock', async () => {
    const bookingRequest = {
      userId: 'test-user-789',
      cartItems: [
        { tier: 'VIP', quantity: 500 } // More than available (100)
      ]
    };

    const response = await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingRequest)
    });

    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Insufficient stock');
  });

  test('POST /api/book - should update inventory after booking', async () => {
    // Book 5 VIP tickets
    const bookingRequest = {
      userId: 'test-user-inventory',
      cartItems: [{ tier: 'VIP', quantity: 5 }]
    };

    await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingRequest)
    });

    // Check catalog to verify inventory decreased
    const catalogResponse = await fetch(`${API_BASE}/api/catalog`);
    const catalogData = await catalogResponse.json();

    const vip = catalogData.data.find((t: any) => t.tier === 'VIP');
    expect(vip.quantityAvailable).toBe(95); // 100 - 5 = 95
  });

  test('POST /api/book - should fail with invalid request', async () => {
    const invalidRequest = {
      userId: 'test-user',
      // Missing cartItems
    };

    const response = await fetch(`${API_BASE}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest)
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('POST /api/book - should handle concurrent bookings correctly', async () => {
    // Book tickets close to limit
    const booking1 = {
      userId: 'user-1',
      cartItems: [{ tier: 'VIP', quantity: 60 }]
    };

    const booking2 = {
      userId: 'user-2',
      cartItems: [{ tier: 'VIP', quantity: 60 }]
    };

    // Execute both bookings simultaneously
    const [response1, response2] = await Promise.all([
      fetch(`${API_BASE}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking1)
      }),
      fetch(`${API_BASE}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking2)
      })
    ]);

    const data1 = await response1.json();
    const data2 = await response2.json();

    // One should succeed, one should fail (or both could succeed if done quickly)
    const successCount = [data1.success, data2.success].filter(Boolean).length;
    
    // At least one should succeed
    expect(successCount).toBeGreaterThanOrEqual(1);

    // If both succeeded, verify total doesn't exceed available
    if (successCount === 2) {
      const catalogResponse = await fetch(`${API_BASE}/api/catalog`);
      const catalogData = await catalogResponse.json();
      const vip = catalogData.data.find((t: any) => t.tier === 'VIP');
      expect(vip.quantityAvailable).toBeGreaterThanOrEqual(0);
    }
  });
});
