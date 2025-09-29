import { test, expect } from '@playwright/test';
import { resetDatabase, waitForBackend } from '../helpers/setup';

const API_BASE = 'http://localhost:3000';

test.describe('Catalog API Tests', () => {
  test.beforeAll(async () => {
    await waitForBackend();
  });

  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('GET /api/catalog - should return all ticket tiers', async () => {
    const response = await fetch(`${API_BASE}/api/catalog`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(3);

    // Verify VIP ticket
    const vip = data.data.find((t: any) => t.tier === 'VIP');
    expect(vip).toBeDefined();
    expect(vip.priceUsd).toBe('100.00');
    expect(vip.quantityAvailable).toBe(100);

    // Verify Front Row ticket
    const frontRow = data.data.find((t: any) => t.tier === 'FRONT_ROW');
    expect(frontRow).toBeDefined();
    expect(frontRow.priceUsd).toBe('50.00');
    expect(frontRow.quantityAvailable).toBe(200);

    // Verify GA ticket
    const ga = data.data.find((t: any) => t.tier === 'GA');
    expect(ga).toBeDefined();
    expect(ga.priceUsd).toBe('10.00');
    expect(ga.quantityAvailable).toBe(500);
  });

  test('GET /api/catalog - should return correct structure', async () => {
    const response = await fetch(`${API_BASE}/api/catalog`);
    const data = await response.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);

    // Verify each ticket has required fields
    data.data.forEach((ticket: any) => {
      expect(ticket).toHaveProperty('tier');
      expect(ticket).toHaveProperty('priceUsd');
      expect(ticket).toHaveProperty('quantityAvailable');
    });
  });
});
