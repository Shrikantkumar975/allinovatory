# Allo Inventory — Reservation System

## What is this?
Allo is building an inventory management platform for 
retailers with multi-warehouse and D2C brands.

## How to Run Locally

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Environment Variables**: Create a `.env` file in the root with your Supabase (or Postgres) connection strings:
   ```env
   DATABASE_URL
   DIRECT_URL
   ```

3. **Database Setup**: Push the Prisma schema and seed the database with initial products/warehouses:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the app.

## The Problem
When a customer proceeds to checkout, they may take 
5-10 minutes to complete the payment (UPI, 3DS flows, 
wallet redirects). During this window, many other 
customers are viewing the same product, adding it to 
their cart and proceeding to checkout. At the very end 
they face "Out of Stock" — which is a very bad experience.

### Two naive solutions and why they fail:

**1. Decrement stock only at payment time**
Two customers can complete payment for the same unit 
simultaneously. This causes oversell — one gets a refund, 
the other a bad experience, and the operations team has 
to manually clean up the mess.

**2. Decrement stock at add-to-cart time**
80% of carts are abandoned. The inventory is physically 
available but looks depleted to other shoppers. 
Conversion rate drops significantly.

## The Solution — Reservation System
When a user proceeds to checkout, we create a temporary 
reservation with a 10 minute expiry window. Three 
scenarios can happen:

1. User confirms payment → 
   totalUnits - 1, reservedUnits - 1 (permanent deduction)
   
2. User cancels → 
   reservedUnits - 1 (unit instantly back to available)
   
3. Timer expires → 
   reservedUnits - 1 (auto released by background job)

### Why totalUnits never changes until confirmation?
To protect against false inventory depletion. If we 
modified totalUnits on every reserve/cancel cycle, one 
bug in the system could permanently corrupt the inventory 
count. totalUnits only changes when money actually 
exchanges hands.

### Available stock is always:
availableUnits = totalUnits - reservedUnits

## Concurrency Approach

### The Problem with Two Step Approach
When two users hit reserve simultaneously:

Step 1: Both check stock → both see stock = 1
Step 2: Both create reservation → oversell

Another request can sneak in between the check 
and the write. This is the race condition.

### Approach 1 — Redis Distributed Lock (Considered)
Acquire a lock on the product before checking stock.
Only one request can proceed at a time.

Flow:
User A acquires lock → checks stock → writes 
reservation → releases lock
User B waits → lock released → checks stock → 
stock = 0 → gets 409

Downside:
- Extra Redis infrastructure needed
- Every request has overhead of hitting Redis first
- If Redis goes down → reservation system goes down

### Approach 2 — Atomic SQL Update (Chosen)
Instead of two separate steps, combine check and 
write into one atomic SQL operation:

```sql
UPDATE Stock
SET reservedUnits = reservedUnits + 1
WHERE id = X
AND (totalUnits - reservedUnits) >= 1
```

Postgres handles this at row level:
- 1 row updated → reservation created
- 0 rows updated → no stock available → 409

Two simultaneous requests on same row → Postgres 
queues them automatically → exactly one wins.

Why chosen over Redis:
- No extra infrastructure needed
- No explicit overhead lookup in Redis
- Postgres handles concurrency natively
- Simpler code, less things can go wrong

## Database Schema

### Why SQL over NoSQL?
This problem has three requirements that make 
SQL the clear choice:

1. Related data — Product → Warehouse → Stock 
   → Reservation (relational by nature)
2. Atomic updates — core of race condition fix
3. Transactions — confirm/release operations 
   need to be all-or-nothing

Postgres handles all three natively. MongoDB would 
need extra workarounds for atomic updates.

### Tables

**Product**
Stores basic product information.
- id, name, price, description

**Warehouse**
Stores warehouse information.
- id, name, location

**Stock**
Bridge between Product and Warehouse.
Tracks availability per product per warehouse.
- id, productId, warehouseId
- totalUnits → physical stock, only changes 
  on confirmed purchase
- reservedUnits → currently held in active 
  checkouts, default 0

**Reservation**
Temporary hold created when user enters checkout.
- id, stockId, quantity
- status → pending / confirmed / released
- expiresAt → createdAt + 10 minutes
- createdAt

### How tables connect
Product + Warehouse → Stock → Reservation

### Why store reservedUnits instead of counting?

Option A — Count on the fly (rejected):
SELECT COUNT(*) FROM reservations
WHERE stockId = X AND status = 'pending'

Problem: Gets slower as reservations table grows.
On high traffic this query becomes expensive.

Option B — Store reservedUnits directly (chosen):
SELECT totalUnits - reservedUnits FROM stock
WHERE id = X

Always a fast single row lookup. No joins. 
No counting. Trade-off: must keep reservedUnits 
in sync carefully on every operation.

## Expiry Mechanism

Reservations that aren't confirmed before expiresAt 
must be automatically released so units return to 
available stock.

### Three approaches considered:

**1. Lazy Cleanup (Rejected)**
Check and release expired reservations when stock 
is requested.

Problem: Cleanup happens inside the user's request.
If there are many expired reservations, every user 
request becomes slow. Bad performance on high traffic.

**2. Background Worker (Rejected)**
A continuous process that keeps checking for 
expired reservations.

Problem: Vercel runs serverless functions — they 
spin up on request and spin down after. Background 
worker dies when the function spins down. Expired 
reservations never get released.

**3. Cron Job (Chosen)**
A scheduled job runs every minute:

Find all reservations where:
- status = pending
- expiresAt < current time

For each expired reservation:
- Set status = released
- Decrease reservedUnits in Stock table

Why chosen:
- Runs independently of user requests
- No performance impact on users
- Works perfectly with Vercel Cron
- Simple to implement and maintain