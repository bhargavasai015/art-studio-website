# GDGC Web Development Assignment — Final Submission Checklist

This checklist verifies compliance with every deliverable and requirement specified in the GDGC Art Studio brief.

---

## 📋 Core Assignment Requirements Matrix

### 1. Sells Paintings
- [x] Each painting is one of a kind and can only be purchased once.
- [x] Studio can add paintings with details (title, artist, medium, dimensions, price, image).
- [x] Studio can edit paintings **only while available** (attempting to edit sold painting returns HTTP 400).
- [x] Customer buys an available painting (creates order with status `placed`, changes painting status to `sold`).
- [x] Customer can cancel their order, atomically returning the painting to `available` status.
- [x] Concurrency safety: atomic conditional SQL updates and transactions prevent duplicate purchases.

### 2. Paints Walls, on Booking
- [x] Booking date must be between **7 and 90 days** in the future (validated on server).
- [x] Wall size must be between **10 and 500 sq ft** (validated on server).
- [x] Address is captured and stored.
- [x] Rate is fetched from seed data ($15.00/sq ft) and total price calculated on server (`wall_size * rate`).
- [x] Each date can be booked only once (enforced by SQLite partial unique index on active statuses).
- [x] Studio can **confirm** or **decline** bookings (status: `requested` → `confirmed` or `declined`).
- [x] Customer can cancel only **up to 3 days before the date** (cancellation within 3 days returns HTTP 400).
- [x] Cancelled or declined bookings free up the calendar date for future reservations.

### 3. Makes Custom Pottery, on Request
- [x] Customer chooses an item and glaze from seed data catalog (validated against database IDs).
- [x] Quantity validated between **1 and 12** items.
- [x] Needed-by date validated to be at least **14 days** away.
- [x] Studio can **accept** or **decline** custom pottery requests.
- [x] Customer can edit or cancel requests **only while status is requested** (modifying after accept/decline returns HTTP 400).

### 4. RBAC (Role-Based Access Control)
- [x] Two roles implemented: `customer` and `admin`.
- [x] Unauthenticated protected requests return **HTTP 401**.
- [x] Wrong role requests return **HTTP 403** (e.g., customers attempting admin endpoints; admins attempting customer purchases).
- [x] Customer asking for someone else's record returns **HTTP 404** (not 403, preventing ID enumeration).
- [x] Public registration strictly provisions `customer` accounts; studio admin accounts can only be provisioned server-side.
- [x] Server never trusts role, price, ownership, or status supplied by client request bodies.

### 5. Data and Interface UX
- [x] Every screen that loads data implements a **loading state**, **empty state**, and **error state**.
- [x] Clear explanatory error messages when an action is refused (e.g. "painting just sold", "date just taken", "cancellation deadline passed").
- [x] Responsive layout with accessible forms and clean art studio visual design.

### 6. Deliverables Verification
- [x] Runnable project in workspace.
- [x] `README.md` with complete prerequisites, setup, seeding, and run instructions.
- [x] `DESIGN.md` answering all four questions from brief section 05.
- [x] `.env.example` with placeholder values for all environment variables.
- [x] `.gitignore` properly excluding secrets, `.env`, `node_modules`, `dist`, and database files.
- [x] 46 automated tests passing with 100% success rate.
- [x] `DEMO_SCRIPT.md` containing a timed 5-minute video walkthrough guide.
