# Design Decisions & Architecture — GDGC Art Studio Website

This document provides concise answers to the four core design questions required by the GDGC Art Studio assignment brief.

---

### 1. How do login and the two roles work?

The application implements a stateless **JSON Web Token (JWT)** authentication architecture with **bcryptjs** (10 salt rounds) for cryptographic password hashing.

1. **Role Division**:
   - **`customer`**: Can browse paintings, purchase available paintings, book wall painting dates, submit custom pottery requests, and view/cancel/edit only their own records.
   - **`admin` (Studio Lead)**: Can browse paintings, add new paintings, edit available paintings, view all customer orders, confirm/decline wall bookings, and accept/decline custom pottery commissions. Admin accounts are barred from placing customer orders or booking murals (`403 Forbidden`).

2. **Secure Provisioning & RBAC Enforcement**:
   - The studio admin account is provisioned exclusively through backend initialization/seeding (`admin@artstudio.com`).
   - Public user registration is restricted to creating `customer` accounts. The backend strictly hardcodes or sanitizes `role: 'customer'`, ignoring any client-provided role fields to prevent privilege escalation.
   - Every protected route enforces role checks through backend middleware:
     - Unauthenticated requests return **HTTP 401 Unauthorized**.
     - Authenticated requests with the incorrect role return **HTTP 403 Forbidden**.
     - When a customer queries a record (order, booking, or pottery request) owned by a different customer, the server returns **HTTP 404 Not Found** (preventing ID enumeration and information disclosure).

---

### 2. Which database did you choose, and why?

We chose **SQLite** utilizing Node.js's native **`node:sqlite` (`DatabaseSync`)**.

1. **Native Portability & Zero-Dependency Execution**:
   - `node:sqlite` is built directly into modern Node.js runtimes. It eliminates the need for native C++ compilation, `node-gyp`, and platform-dependent prebuilt binary downloads, allowing any developer or evaluator to run the application cleanly on any machine without toolchain conflicts.

2. **Strict ACID Compliance & Real Transactions**:
   - Art inventory and reservation scheduling require absolute data consistency. SQLite provides real transactions (`BEGIN IMMEDIATE`, `COMMIT`, `ROLLBACK`) that guarantee atomic state transitions when purchasing one-of-a-kind art pieces and reserving calendar dates.

3. **High-Concurrency WAL Mode**:
   - The database is initialized with `PRAGMA journal_mode = WAL;` (Write-Ahead Logging), `PRAGMA foreign_keys = ON;`, and `PRAGMA busy_timeout = 10000;`. WAL mode permits simultaneous read operations without blocking write transactions.

4. **Persistence Across Restarts**:
   - Data persists on disk in `./data/art_studio.db`, maintaining state across backend reboots and test suites.

---

### 3. How do you stop two people from taking the same painting or date?

We employ a defense-in-depth concurrency model combining **atomic conditional SQL queries**, **transaction isolation**, and **database partial unique indexes**:

#### A. Preventing Duplicate Painting Purchases
- **The Challenge**: Each painting is one-of-a-kind and must be purchased exactly once.
- **The Solution**:
  1. The purchase endpoint wraps the checkout operation in a `BEGIN IMMEDIATE` transaction, immediately obtaining SQLite's reserved write lock.
  2. The update statement executes an atomic check-and-set:
     ```sql
     UPDATE paintings
     SET status = 'sold', updated_at = datetime('now')
     WHERE id = ? AND status = 'available';
     ```
  3. If two collectors click "Purchase" at the exact same millisecond, the first query executes and reports `changes === 1`. The second query matches zero available rows (`changes === 0`).
  4. The server detects `changes === 0`, cancels the transaction, and returns **HTTP 409 Conflict** with the message: *"This painting has just been purchased by another collector."*

#### B. Preventing Duplicate Wall Booking Dates
- **The Challenge**: Each calendar date can be booked at most once for an active mural project.
- **The Solution**:
  1. **Database Partial Unique Index**: We created a partial unique index in SQLite:
     ```sql
     CREATE UNIQUE INDEX IF NOT EXISTS idx_wall_bookings_active_date
       ON wall_bookings(booking_date)
       WHERE status IN ('requested', 'confirmed');
     ```
  2. This guarantees at the storage engine level that two rows with statuses `requested` or `confirmed` can never share the same `booking_date`.
  3. When two concurrent requests target the same date, SQLite rejects the second attempt with an `SQLITE_CONSTRAINT_UNIQUE` violation, which our handler intercepts and returns as **HTTP 409 Conflict** (*"This date has already been booked. Please choose another date."*).
  4. When an existing booking is cancelled or declined, the date is automatically released and becomes available for new reservations.

---

### 4. What did you finish, what did you leave out, and what would you do next?

#### What We Finished (100% of Core Requirements):
- **Painting Sales**: Public gallery browsing with filters (all, available, sold); admin painting creation and editing (restricted to `available` artworks); atomic one-of-a-kind purchasing; customer order cancellation with immediate restoration of painting availability.
- **Wall-Painting Bookings**: Strict date boundary validation (7 to 90 days in the future); wall size boundary checks (10 to 500 sq ft); address capture; automatic price calculation from seed rate ($15.00/sq ft); duplicate date prevention; admin confirmation and declining; customer cancellation allowed strictly up to 3 days before the booking date.
- **Custom Pottery Requests**: Catalog selection using seeded item silhouettes and glaze formulations; quantity limits (1 to 12 pieces); needed-by date validation (≥ 14 days away); admin accept and decline workflows; customer editing and cancellation restricted to `requested` status.
- **Security & RBAC**: Strict separation of customer and admin privileges; JWT sessions; HTTP 401 for unauthenticated requests; HTTP 403 for wrong-role requests; HTTP 404 when querying another user's records.
- **Interface & UX**: Comprehensive loading states, empty states, and error alerts on every screen; clear feedback when actions are refused; pre-filled 1-click test credentials for easy evaluation.
- **Automated Test Suite**: 46 automated integration and concurrency tests passing with a 100% success rate.

#### What We Left Out (Explicitly Out of Scope per Brief Section 06):
- Real payment processing (payment gateways like Stripe or PayPal).
- Social login, password resets, email verification, and email/SMS transactional notifications.
- Multipart image file uploads (curated Unsplash URLs are used for art assets).
- Production cloud deployment, Docker containers, and CI/CD pipelines.

#### What We Would Do Next (Future Enhancements):
1. **Real-time Push Notifications**: Implement WebSockets or Server-Sent Events (SSE) so that when an artwork is sold or a date is booked, all connected clients immediately update without page refreshes.
2. **Direct Image Uploads**: Add presigned URL uploads directly to AWS S3 or Cloudinary with automated thumbnail generation.
3. **Interactive Visual Mural Previewer**: Integrate a canvas-based room visualizer where customers can upload a photo of their living room wall and preview mural concepts at scale.
4. **Automated Calendar Reminders**: Send calendar invite files (.ics) and reminder alerts 5 days prior to scheduled wall painting sessions.
