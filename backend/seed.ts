import { db } from './db.js';
import { tickets } from './schema.js';

/**
 * Seeds the database with initial ticket data
 */
export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Insert initial tickets with conflict handling
    // Matching assignment requirements: VIP=$100, Front Row=$50, GA=$10
    const seedData = [
      {
        tier: 'VIP' as const,
        priceUsd: '100.00',
        quantityAvailable: 100, // Reasonable inventory for 500 concurrent users
        totalQuantity: 100,
      },
      {
        tier: 'FRONT_ROW' as const, 
        priceUsd: '50.00',
        quantityAvailable: 200,
        totalQuantity: 200,
      },
      {
        tier: 'GA' as const,
        priceUsd: '10.00', 
        quantityAvailable: 500,
        totalQuantity: 500,
      },
    ];

    // Use insert with onConflictDoNothing to prevent re-insertion
    await db.insert(tickets)
      .values(seedData)
      .onConflictDoNothing();

    console.log('✅ Database seeding completed successfully!');
    
    // Verify the data was inserted
    const allTickets = await db.select().from(tickets);
    console.log('📋 Current tickets:', allTickets);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.main) {
  await seedDatabase();
  process.exit(0);
}
