import { Pool } from 'pg';

/**
 * Reset database to initial state for testing
 * Clears all orders and resets ticket inventory
 */
export async function resetDatabase() {
  const pool = new Pool({
    user: 'user',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'ticketdb',
  });

  try {
    // Delete all order data
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    
    // Reset ticket inventory to initial quantities
    await pool.query(`
      UPDATE tickets 
      SET quantity_available = total_quantity
    `);
    
    console.log('✅ Database reset successfully');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Wait for backend to be ready
 * Polls health endpoint until backend responds
 */
export async function waitForBackend(maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        console.log('✅ Backend is ready');
        return;
      }
    } catch (e) {
      console.log(`⏳ Waiting for backend... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('❌ Backend not ready after maximum attempts');
}

/**
 * Wait for frontend to be ready
 */
export async function waitForFrontend(maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        console.log('✅ Frontend is ready');
        return;
      }
    } catch (e) {
      console.log(`⏳ Waiting for frontend... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('❌ Frontend not ready after maximum attempts');
}

/**
 * Set specific ticket quantity for testing
 */
export async function setTicketQuantity(tier: string, quantity: number) {
  const pool = new Pool({
    user: 'user',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'ticketdb',
  });

  try {
    await pool.query(
      'UPDATE tickets SET quantity_available = $1 WHERE tier = $2',
      [quantity, tier]
    );
  } finally {
    await pool.end();
  }
}
