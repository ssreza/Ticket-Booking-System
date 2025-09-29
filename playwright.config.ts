import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright API Test Configuration
 * Tests backend API endpoints only (no UI)
 */
export default defineConfig({
  testDir: './tests/api',
  testMatch: '**/*.test.ts',
  fullyParallel: false, // Run tests sequentially to avoid database conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent race conditions
  reporter: 'html',
  timeout: 30000,
  
  use: {
    baseURL: 'http://localhost:3000', // Backend API
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'api-tests',
      testMatch: '**/*.test.ts',
    },
  ],

  // Only requires backend to be running
  // Terminal 1: docker-compose up -d (database)
  // Terminal 2: cd backend && bun run dev
  // Terminal 3: bun run test
});
