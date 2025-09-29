import { pgTable, serial, varchar, numeric, integer, uuid, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tickets (Inventory) Table
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  tier: varchar('tier', { length: 50 }).unique().notNull(), // VIP, FRONT_ROW, GA
  priceUsd: numeric('price_usd', { precision: 10, scale: 2 }).notNull(),
  quantityAvailable: integer('quantity_available').notNull(), // Critical field for locking
  totalQuantity: integer('total_quantity').notNull(),
});

// Orders (Successful Bookings) Table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(), // Mock user ID
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // PAID, FAILED, PENDING
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Order Items (Details) Table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  ticketTier: varchar('ticket_tier', { length: 50 }).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
});

// Define relationships
export const ordersRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

// Type definitions for TypeScript
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
