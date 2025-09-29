import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { tickets } from './schema.js';

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

// Start the server
app.listen(port, () => {
  console.log(`🎫 Ticket Booking API running on port ${port}`);
});