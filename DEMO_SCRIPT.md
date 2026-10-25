# 5-Minute Video Demo Script & Presentation Guide

This script is structured to be recorded in **under 5 minutes** for the GDGC Web Development Assignment submission video. Follow the timed cue cards below while recording your screen.

---

## ⏱️ Video Breakdown (Total Time: 4m 45s)

| Section | Timestamp | Content |
|---|---|---|
| **1. Introduction & Overview** | 0:00 – 0:35 | Introduce yourself, project goals, and high-level tech stack |
| **2. Customer Flow: Sign Up & Painting Purchase** | 0:35 – 1:30 | Customer registration/login, Indian folk gallery browsing, one-of-a-kind purchase in ₹ |
| **3. Customer Flow: Wall Mural & Custom Pottery** | 1:30 – 2:30 | Wall mural booking (boundaries & live ₹150/sq ft calculation), custom pottery request |
| **4. Studio Admin Flow: Approvals & Painting Management** | 2:30 – 3:30 | Studio login (`studio@artstudio.in`), confirming mural, accepting pottery, managing paintings |
| **5. Code Walkthrough: Atomic Concurrency Control** | 3:30 – 4:20 | Deep dive into atomic purchase transactions and unique booking constraints |
| **6. Automated Tests & Conclusion** | 4:20 – 4:45 | Running `npm test` showing 46 passing tests and concluding remarks |

---

## 🎬 Section-by-Section Spoken Script & Screen Actions

### Section 1: Introduction (0:00 – 0:35)
**Screen to show**: Homepage / Gallery on `http://localhost:5001`.
> **Spoken words:**
> *"Hello! My name is [Your Name], and this is my submission for the GDGC Web Development Assignment: the GDGC Art Studio Website.
> 
> The application is built using a React and Vite frontend with responsive styling, an Express and Node.js backend, and a persistent SQLite database using Node's native `node:sqlite` driver with WAL mode.
> 
> All data has been seeded directly from the provided `seedData.zip`, featuring 12 authentic traditional Indian folk paintings, 5 custom pottery items, 6 glazes, and pricing in Indian Rupees (₹), all secured with server-enforced role-based access control."*

---

### Section 2: Customer Flow — Sign Up & Painting Purchase (0:35 – 1:30)
**Screen to show**: Click "Sign In", click "Create Account" tab, or use Demo Customer.
> **Spoken words:**
> *"First, let's explore the customer experience. I will log in using our customer account, Aria Montgomery. Notice the user badge updates to Customer.
> 
> In the Paintings Gallery, each piece is one-of-a-kind, featuring styles like Madhubani, Warli, and Tanjore. If we look at painting 'p-002', 'Warli Village Scene', it is currently Available for ₹1,800.
> 
> Notice how our responsive card layout cleanly displays both short titles and long narratives, such as painting #12's wide Varanasi Ghats description.
> 
> I'll click 'Purchase', review the collector confirmation, and confirm the order. Immediately, the status shifts to 'Sold', removing it from available inventory.
> 
> When I navigate to 'My Account' under Painting Orders, my placed order is visible. If I click 'Cancel Order', the order cancels, and the painting is atomically restored to Available status in the gallery for other collectors."*

---

### Section 3: Customer Flow — Wall Mural & Custom Pottery (1:30 – 2:30)
**Screen to show**: Click "Book Wall Mural" then "Custom Pottery".
> **Spoken words:**
> *"Next is our Wall Mural Booking service. The backend enforces strict business rules: the date must be between 7 and 90 days away, and the wall size between 10 and 500 square feet.
> 
> As I adjust the surface slider to 100 square feet, the system calculates the commission in real-time at the studio seed rate of ₹150 per square foot, totaling ₹15,000.
> 
> I'll select a date 20 days in the future, enter the address, and submit. The booking is now recorded with status 'Requested'. Notice that per assignment rules, customers can cancel only up to 3 days before the event.
> 
> Now let's visit Custom Pottery. Clients can choose from the 5 silhouettes in the seed dataset—such as the Kulhad, Surahi, or Matka—and 6 traditional glazes, including Kumkum Red and Indigo Blue. I'll pick a quantity of 3 pieces and a needed-by date 21 days away—satisfying the 14-day production lead time rule—and submit the commission."*

---

### Section 4: Studio Admin Flow — Approvals & Management (2:30 – 3:30)
**Screen to show**: Sign out as customer, sign in as Studio Lead (`studio@artstudio.in` / `Studio@123`). Open "Studio Admin".
> **Spoken words:**
> *"Now let's switch to the studio's administrator account from seedData: `studio@artstudio.in`. Notice the navigation exposes the 'Studio Admin' dashboard.
> 
> Here, the studio team can view all client orders, bookings, and pottery commissions.
> 
> In the Wall Mural queue, we see the booking we just placed. As the studio admin, I can review the location and click 'Confirm'. The status updates in the database to 'Confirmed'.
> 
> In the Pottery Requests queue, I can inspect the custom specifications and click 'Accept'.
> 
> Furthermore, in the gallery, the studio can add new paintings or edit existing ones. However, in accordance with the specification, only available paintings can be edited—sold paintings cannot be altered."*

---

### Section 5: Code Walkthrough — Concurrency & Security (3:30 – 4:20)
**Screen to show**: Open VS Code / IDE showing `backend/src/routes/orders.js` and `backend/src/db/schema.sql`.
> **Spoken words:**
> *"Now let's look at the code behind our race condition prevention.
> 
> In `orders.js`, when a customer purchases a painting, we wrap the transaction in `BEGIN IMMEDIATE`. We execute an atomic update statement:
> `UPDATE paintings SET status = 'sold' WHERE id = ? AND status = 'available'`.
> 
> If two clients click purchase at the exact same millisecond, SQLite's write lock and the conditional `WHERE status = 'available'` ensure that exactly one query updates a row. The second query matches zero rows; our code catches `changes === 0` and returns HTTP 409 Conflict.
> 
> For wall bookings, in `schema.sql`, we implemented a partial unique index on `booking_date` filtered for active statuses: `WHERE status IN ('requested', 'confirmed')`. This guarantees at the database engine level that no two active bookings can ever share the same calendar date.
> 
> Additionally, our RBAC middleware enforces HTTP 401 for unauthenticated requests, HTTP 403 for unauthorized roles, and HTTP 404 when a customer requests another customer's record to prevent data enumeration."*

---

### Section 6: Automated Tests & Conclusion (4:20 – 4:45)
**Screen to show**: Terminal running `cd backend && npm test`.
> **Spoken words:**
> *"To ensure reliability, we wrote 46 automated integration and concurrency tests covering all boundary conditions, RBAC rules, and cancellation policies.
> 
> As you can see on screen, running `npm test` executes the full suite with all 46 tests passing.
> 
> Thank you for reviewing my submission for the GDGC Art Studio Website! All code, setup instructions, and design answers are documented in the repository."*
