# Quick Test Guide

## 🚀 Quick Start (2 Steps)

### 1. Install Test Dependencies
```bash
npm install
# No browser installation needed - API tests only!
```

### 2. Start Required Services
```bash
# Terminal 1 - Database
docker-compose up -d

# Terminal 2 - Backend  
cd backend && bun run dev
```

### 3. Run Tests
```bash
# Terminal 3 - Tests
bun run test
```

**Note**: Frontend is NOT required for API tests!

## 📊 What Gets Tested

### **API Endpoint Tests**
✅ **GET /api/catalog** - Returns all ticket tiers with correct pricing  
✅ **POST /api/book** - Successfully books tickets  
✅ **POST /api/book** - Handles insufficient stock errors  
✅ **POST /api/book** - Updates inventory after booking  
✅ **POST /api/book** - Prevents double-booking (concurrent requests)  
✅ **GET /api/orders/:userId** - Returns user order history  
✅ **GET /api/orders/:userId** - Returns empty array for new users  
✅ **GET /api/orders/:userId** - Isolates orders by user  

## 🎯 Test Commands

```bash
# Run all API tests
bun run test

# Interactive UI mode
bun run test:ui

# View last test report
bun run test:report
```

## 🔍 Test Files

- `tests/api/catalog.test.ts` - Catalog API tests (2 tests)
- `tests/api/booking.test.ts` - Booking API tests (6 tests)
- `tests/api/orders.test.ts` - Orders API tests (5 tests)

**Total: 13 fast API tests**

## ⚡ Expected Results

```
Running 13 API tests using 1 worker

  ✓ catalog.test.ts (2 passed)
  ✓ booking.test.ts (6 passed) 
  ✓ orders.test.ts (5 passed)

  13 passed (15s)
```

**Much faster!** API tests complete in ~15 seconds vs 2+ minutes for UI tests.

## 🐛 Troubleshooting

### Tests Fail Immediately
**Check:** Are all services running?
```bash
curl http://localhost:3000/health  # Backend
curl http://localhost:3000          # Frontend
```

### Database Errors
**Fix:** Reset the database
```bash
docker-compose down -v
docker-compose up -d
cd backend && bun run db:push && bun run db:seed
```

### Port 3000 In Use
**Fix:** Stop other processes using port 3000
```bash
lsof -ti:3000 | xargs kill -9
```

## 📸 Visual Debugging

Tests automatically capture:
- 📷 **Screenshots** on failure
- 🎥 **Videos** on failure  
- 📝 **Traces** for debugging

View in test report: `npm run test:report`

## ✨ Tips

1. **Use UI Mode** for development: `npm run test:e2e:ui`
2. **Run single test**: Click test name in UI mode
3. **Inspect elements**: Use debug mode to pause tests
4. **Check database**: Each test starts with fresh data

## 🎓 Example Test Run

```bash
$ npm run test:e2e

Running 15 tests using 1 worker

  ✓ [chromium] › booking-flow.spec.ts:10 - catalog display (2.1s)
  ✓ [chromium] › booking-flow.spec.ts:28 - add to cart (1.8s)
  ✓ [chromium] › booking-flow.spec.ts:42 - complete booking (5.2s)
  ✓ [chromium] › booking-flow.spec.ts:75 - inventory update (7.3s)
  ...

  15 passed (2m 28s)

To open last HTML report run:
  npx playwright show-report
```

## 📚 More Info

See `e2e/README.md` for detailed documentation.
