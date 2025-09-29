import express from 'express';
import cors from 'cors';
import { db, getClient } from './db.js';
import { tickets, orders, orderItems } from './schema.js';
import { eq, desc, inArray } from 'drizzle-orm';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * GET /api/catalog - Read Endpoint
 * 
 * Returns all available tickets with their tier, price, and quantity available.
 * In a production environment with read replicas, this endpoint would target a read replica.
 */
app.get('/api/catalog', async (req, res) => {
  try {
    console.log('GET /api/catalog: Fetching ticket catalog');
    
    // Query: Select tier, price_usd, and quantity_available from the tickets table
    const ticketCatalog = await db.select({
      tier: tickets.tier,
      priceUsd: tickets.priceUsd,
      quantityAvailable: tickets.quantityAvailable
    }).from(tickets);
    
    // Note: In a production environment with read replicas, you would:
    // 1. Configure a separate connection pool for read replicas
    // 2. Use that pool for non-transactional reads like this one
    
    console.log(`GET /api/catalog: Found ${ticketCatalog.length} ticket tiers`);
    
    // Return the data as JSON
    return res.status(200).json({ 
      success: true,
      data: ticketCatalog
    });
    
  } catch (error) {
    console.error('Error fetching ticket catalog:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch ticket catalog'
    });
  }
});

/**
 * GET /api/orders/:userId - Get User Orders Endpoint
 * 
 * Returns all orders for a specific user with their order items.
 * This endpoint allows users to view their booking history (My Tickets).
 */
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`GET /api/orders/${userId}: Fetching orders for user`);
    
    // Fetch all orders for the user
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    
    if (userOrders.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        return {
          ...order,
          items
        };
      })
    );
    
    console.log(`GET /api/orders/${userId}: Found ${ordersWithItems.length} orders`);
    
    return res.status(200).json({
      success: true,
      data: ordersWithItems
    });
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user orders'
    });
  }
});

/**
 * Type definitions for booking request
 */
type CartItem = {
  tier: string;
  quantity: number;
};

type BookingRequest = {
  userId: string;
  cartItems: CartItem[];
};

/**
 * POST /api/book - Ticket Booking Endpoint
 * 
 * Handles the critical booking flow with proper transaction handling
 * and pessimistic locking to prevent race conditions/double booking.
 */
app.post('/api/book', async (req, res) => {
  // Validate request body
  const { userId, cartItems } = req.body as BookingRequest;
  
  if (!userId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: userId and non-empty cartItems array required'
    });
  }
  
  // Get client for transaction
  const client = await getClient();
  
  try {
    console.log(`POST /api/book: Processing booking for user ${userId}`);
    console.log('Cart items:', JSON.stringify(cartItems));
    
    // Step 1: Start transaction
    await client.query('BEGIN');
    
    // Track total amount for the order
    let totalAmount = 0;
    const orderItems = [];
    
    // Step 2: Iterate through cart items and lock rows
    for (const item of cartItems) {
      // Step 2a: Lock the row and retrieve current inventory
      const lockQuery = `
        SELECT tier, quantity_available, price_usd 
        FROM tickets 
        WHERE tier = $1 
        FOR UPDATE;
      `;
      
      const result = await client.query(lockQuery, [item.tier]);
      
      // Handle case where tier doesn't exist
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Invalid ticket tier: ${item.tier}`
        });
      }
      
      // Step 2b: Check availability
      const available = result.rows[0].quantity_available;
      const priceUsd = result.rows[0].price_usd;
      
      if (item.quantity > available) {
        // If failed, immediately rollback and return error
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: `Insufficient stock for tier ${item.tier}. Requested: ${item.quantity}, Available: ${available}`
        });
      }
      
      // Calculate item subtotal
      const itemTotal = parseFloat(priceUsd) * item.quantity;
      totalAmount += itemTotal;
      
      // Track order item for later insertion
      orderItems.push({
        tier: item.tier,
        quantity: item.quantity,
        priceAtPurchase: priceUsd
      });
    }
    
    // Step 3: Simulate payment processing
    const paymentSuccess = simulatePayment(userId, totalAmount);
    
    if (!paymentSuccess) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Payment processing failed'
      });
    }
    
    // Step 4: Create order record
    const orderInsertQuery = `
      INSERT INTO orders (user_id, total_amount, status)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const orderResult = await client.query(orderInsertQuery, [
      userId,
      totalAmount.toFixed(2),
      'PAID'
    ]);
    
    const orderId = orderResult.rows[0].id;
    
    // Step 5: Create order items and update inventory
    for (const item of orderItems) {
      // Insert order item
      const itemInsertQuery = `
        INSERT INTO order_items (order_id, ticket_tier, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4)
      `;
      
      await client.query(itemInsertQuery, [
        orderId,
        item.tier,
        item.quantity,
        item.priceAtPurchase
      ]);
      
      // Update inventory
      const updateQuery = `
        UPDATE tickets
        SET quantity_available = quantity_available - $2
        WHERE tier = $1
      `;
      
      await client.query(updateQuery, [item.tier, item.quantity]);
    }
    
    // Step 6: Commit the transaction
    await client.query('COMMIT');
    
    console.log(`POST /api/book: Successfully created order ${orderId} for user ${userId}`);
    
    // Return success with order details
    return res.status(201).json({
      success: true,
      data: {
        orderId,
        userId,
        totalAmount: totalAmount.toFixed(2),
        items: orderItems,
        status: 'PAID'
      }
    });
    
  } catch (error) {
    // Rollback on any error
    await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
    
    console.error('Error processing booking:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process booking'
    });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
});

/**
 * Simulate payment processing
 * 
 * This is a mock function that simulates payment processing.
 * In a real application, this would integrate with a payment gateway.
 */
function simulatePayment(userId: string, amount: number): boolean {
  // Always succeed for test users (for reliable API testing)
  if (userId.startsWith('test-user')) {
    console.log(`Payment for TEST user ${userId} amount $${amount.toFixed(2)}: SUCCESS (test mode)`);
    return true;
  }
  
  // Simulate 95% success rate for regular users
  const success = Math.random() < 0.95;
  
  console.log(`Payment for user ${userId} amount $${amount.toFixed(2)}: ${success ? 'SUCCESS' : 'FAILED'}`);
  
  return success;
}

// Start the server
app.listen(port, () => {
  console.log(`🎫 Ticket Booking API running on port ${port}`);
});