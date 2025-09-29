# Concert Ticket Booking System

A full-stack concert ticket booking application built with React + TypeScript (frontend) and Node.js + TypeScript (backend) with PostgreSQL for data persistence. The system prevents double-booking through pessimistic locking and handles concurrent bookings reliably.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Bun** (for backend runtime)
- **Docker** (for PostgreSQL)
- **Git**

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ticket-Booking-System
   ```

2. **Start PostgreSQL Database**
   ```bash
   docker-compose up -d
   ```
   This starts a PostgreSQL instance on port 5432.

3. **Setup Backend**
   ```bash
   cd backend
   bun install
   bun run db:push      # Push schema to database
   bun run db:seed      # Seed initial ticket data
   bun run dev          # Start backend server on port 3000
   ```

4. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev          # Start frontend on port 3000 (Next.js)
   ```

5. **Access the Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3000/api`
   - Health Check: `http://localhost:3000/health`

---

## 📋 Features

### Functional Requirements ✅
- **Ticket Catalog**: View VIP ($100), Front Row ($50), and GA ($10) tickets
- **Real-time Availability**: See remaining quantities for each tier
- **Booking Flow**: Add tickets to cart and complete booking
- **No Double-Booking**: Pessimistic locking prevents race conditions
- **My Tickets**: View complete order history with all booking details
- **Mock Users**: Auto-generated user profiles with persistent sessions
- **Global Support**: USD currency display for all users

### Technical Implementation
- **Backend**: Express.js + TypeScript, PostgreSQL with Drizzle ORM
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with proper schema design and relationships
- **Concurrency Control**: Row-level pessimistic locking with `FOR UPDATE`
- **Transaction Management**: ACID-compliant transactions for booking flow

---

## 🏗️ Architecture & Design Decisions

### 1. **Preventing Double-Booking (Critical Requirement)**

**Implementation: Pessimistic Locking**

The system uses PostgreSQL's `FOR UPDATE` clause to implement row-level pessimistic locking:

```sql
SELECT tier, quantity_available, price_usd 
FROM tickets 
WHERE tier = $1 
FOR UPDATE;
```

**How It Works:**
1. When a booking starts, we begin a database transaction
2. We lock the ticket row(s) with `FOR UPDATE`
3. Other transactions attempting to book the same tickets must wait
4. We verify availability and update inventory atomically
5. We commit or rollback the transaction

**Why Pessimistic vs Optimistic:**
- **Pessimistic Locking (Chosen)**: Prevents conflicts before they happen. Better for high-contention scenarios like ticket booking where inventory is limited.
- **Optimistic Locking (Not Chosen)**: Would cause more failed bookings under high concurrency, resulting in poor user experience.

**Transaction Flow:**
```typescript
BEGIN TRANSACTION
  → Lock rows (FOR UPDATE)
  → Validate availability
  → Process payment (simulated)
  → Create order
  → Update inventory
  → COMMIT (or ROLLBACK on error)
  → Release locks
```

### 2. **Database Schema Design**

**Tables:**
- `tickets`: Inventory management (tier, price, quantity_available)
- `orders`: Order records (user_id, total_amount, status, created_at)
- `order_items`: Order details (order_id, ticket_tier, quantity, price_at_purchase)

**Key Decisions:**
- **Separate order_items table**: Maintains historical pricing and supports multiple items per order
- **price_at_purchase field**: Records exact price at time of booking (prevents discrepancies if prices change)
- **UUID for order IDs**: Scalable, non-sequential IDs for orders
- **Enums for ticket tiers**: Type safety and data integrity

### 3. **API Design**

**Endpoints:**
- `GET /api/catalog`: Fetch available tickets (read-replica ready)
- `POST /api/book`: Create booking with transaction management
- `GET /api/orders/:userId`: Fetch user's order history

**Design Principles:**
- RESTful architecture
- Proper HTTP status codes (200, 201, 400, 409, 500)
- Structured JSON responses with `success` flag
- Comprehensive error messages

### 4. **Frontend Architecture**

**Technology Choices:**
- **Next.js 14**: Server-side rendering, App Router, built-in routing
- **TypeScript**: Type safety across the stack
- **React Hooks**: useState, useEffect, useCallback, useMemo for optimization
- **Tailwind CSS**: Rapid UI development with utility classes

**Performance Optimizations:**
- Memoized functions with `useCallback` (formatters, handlers)
- Memoized computed values with `useMemo` (cart totals, counts)
- Extracted and memoized API calls
- Proper dependency arrays to prevent unnecessary re-renders

**State Management:**
- Local React state (no Redux needed for this scope)
- Optimistic UI updates for cart operations
- Server state synced after booking completion

### 5. **User Experience Decisions**

**Cart Behavior:**
- Cart as modal (quick access, doesn't disrupt browsing)
- Auto-closes after successful booking (5-second delay)
- Real-time inventory updates in UI (optimistic)
- Quantity controls within cart for easy adjustments

**Order History:**
- Separate page (shareable URL, better UX for reviewing)
- Back navigation with router
- Detailed order breakdown with pricing history

---

## 🎯 Trade-offs & Considerations

### 1. **Pessimistic Locking Trade-offs**

**Advantages:**
- ✅ Guarantees consistency (no overbooking)
- ✅ Simple to reason about
- ✅ Works well for high-contention resources
- ✅ Better UX (fewer failed bookings)

**Disadvantages:**
- ⚠️ Locks reduce concurrency (transactions wait)
- ⚠️ Potential for deadlocks (mitigated by consistent lock ordering)
- ⚠️ Slightly higher latency during peak load

**Why Acceptable:**
For a ticket booking system with limited inventory and high demand, preventing double-booking is more critical than maximum throughput. Users prefer waiting slightly longer over seeing "sold out" after adding items to cart.

### 2. **Single Database Instance**

**Current Setup:**
- Single PostgreSQL instance
- All reads and writes go to primary

**Production Recommendation:**
- **Read Replicas**: Route `/api/catalog` to read replicas
- **Write Primary**: Keep `/api/book` and `/api/orders` on primary
- **Connection Pooling**: Already configured (max: 20 connections)
- **Monitoring**: Add Prometheus/Grafana for metrics

### 3. **Payment Simulation**

**Current Implementation:**
```typescript
function simulatePayment(userId: string, amount: number): boolean {
  return Math.random() < 0.95; // 95% success rate
}
```

**Production Requirement:**
- Integrate Stripe/PayPal/Square
- Handle webhooks for async confirmation
- Implement idempotency keys
- Add payment reconciliation
- Store payment transaction IDs

### 4. **No Authentication**

**Current:** Mock users with client-side generation

**Production Requirement:**
- JWT-based authentication
- OAuth 2.0 (Google, Facebook login)
- Session management
- Rate limiting per user
- CSRF protection

---

## 📊 Availability & Reliability Design

### Target: 99.99% Availability (Four Nines)

**Current Design Intent:**

1. **Database Reliability**
   - PostgreSQL with WAL (Write-Ahead Logging)
   - Automated backups with point-in-time recovery
   - Connection pooling for resource management

2. **Horizontal Scaling Approach**
   - Stateless backend (can run multiple instances)
   - Load balancer (NGINX/ALB) distributes traffic
   - Database connection pooling prevents exhaustion

3. **Error Handling**
   - Comprehensive try-catch blocks
   - Transaction rollbacks on failures
   - Graceful error messages to users
   - Logging for debugging

**Production Implementation for HA:**

```
┌─────────────────────────────────────────┐
│         Load Balancer (ALB)             │
│            Health Checks                │
└───────────┬─────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼────┐    ┌────▼───┐
│ Region │    │ Region │
│   A    │    │   B    │
│        │    │        │
│ App×3  │    │ App×3  │
│        │    │        │
└───┬────┘    └────┬───┘
    │              │
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │  PostgreSQL  │
    │   Primary    │
    │  + Replicas  │
    └──────────────┘
```

**Recommended Infrastructure:**
- **Multi-AZ Deployment**: Database in multiple availability zones
- **Auto-scaling**: EC2 Auto Scaling Groups or ECS/EKS
- **Circuit Breakers**: Prevent cascade failures
- **CDN**: CloudFront for static assets
- **Monitoring**: CloudWatch, Datadog, or New Relic
- **Alerting**: PagerDuty for incidents

### Performance Under Load

**Current Configuration:**
- Connection pool: 20 concurrent connections
- Transaction timeout: 2 seconds
- Expected p95 latency: <500ms (local)

**Load Testing Recommendation:**
```bash
# Example with k6
k6 run --vus 500 --duration 30s load-test.js
```

**Scale Assumptions (from assignment):**
- ~1,000 DAU
- ~500 concurrent users peak
- Current setup handles this with proper connection pooling

---

## 🔒 Security Considerations

**Implemented:**
- SQL injection prevention (parameterized queries via Drizzle ORM)
- CORS configuration
- Input validation
- Transaction isolation

**Production Additions Needed:**
- Rate limiting (express-rate-limit)
- HTTPS/TLS encryption
- API authentication (JWT)
- Input sanitization
- OWASP security headers
- Audit logging
- DDoS protection (CloudFlare/AWS Shield)

---

## 🧪 Testing

### API Tests (Automated)

**13 comprehensive API tests** covering all endpoints:

```bash
# Run all tests
bun run test

# Interactive mode
bun run test:ui
```

**Test Coverage:**
- ✅ Catalog API (2 tests)
- ✅ Booking API (6 tests) - includes concurrency tests
- ✅ Orders API (5 tests)

See `TEST_GUIDE.md` for detailed testing instructions.

### Manual Testing
1. Test booking flow with multiple users
2. Verify cart operations
3. Check order history
4. Test concurrent bookings (open multiple tabs)

---

## 📦 Project Structure

```
Ticket-Booking-System/
├── backend/
│   ├── db.ts              # Database connection & client
│   ├── schema.ts          # Drizzle schema definitions
│   ├── index.ts           # Express server & API routes
│   ├── seed.ts            # Database seeding script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Main catalog page
│   │   │   └── my-tickets/
│   │   │       └── page.tsx       # Order history page
│   │   ├── components/
│   │   │   ├── Cart.tsx           # Shopping cart modal
│   │   │   └── CartIcon.tsx       # Cart icon with badge
│   │   └── utils/
│   │       └── userUtils.ts       # Mock user generation
│   └── package.json
├── docker-compose.yml     # PostgreSQL setup
└── README.md
```

---

## 🚧 Known Limitations & Future Improvements

### Current Limitations
1. No real authentication system
2. Single database instance (not HA)
3. No payment integration
4. No email notifications
5. No ticket cancellation/refund
6. Client-side mock users (not persisted server-side)

### Future Enhancements
- [ ] Add seat selection for Front Row tickets
- [ ] Implement ticket transfer between users
- [ ] Add email confirmations
- [ ] Integrate real payment gateway
- [ ] Add admin dashboard for inventory management
- [ ] Implement waiting list for sold-out tiers
- [ ] Add ticket QR codes
- [ ] Mobile app (React Native)
- [ ] Real-time inventory updates (WebSocket)
- [ ] Analytics dashboard

---

## 🤝 Contributing

This is a take-home assignment project. For questions or clarifications, please reach out.

---

## 📄 License

This project is for evaluation purposes.