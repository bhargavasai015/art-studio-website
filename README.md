# GDGC Art Studio Website

A full-stack, responsive web application for an art studio featuring **one-of-a-kind painting sales**, **wall mural bookings**, and **custom wheel-thrown pottery commissions**, backed by strict **Role-Based Access Control (RBAC)**, **atomic concurrency protection**, and **persistent SQLite storage**.

Built for the **Google Developer Groups on Campus (GDGC)** Web Development Student Chapter assignment, configured with the official **`seedData.zip`** and **Indian Rupee (₹ / INR)** pricing.

---

## 🎨 System Highlights

- **Original Folk Art Gallery**: 12 curated traditional Indian folk artworks from `seed.json` (Madhubani, Warli, Tanjore, Pattachitra, Kalamkari, Gond, Cheriyal, Rajasthani Miniature, Pichwai, Nirmal, Kerala Mural, and Varanasi Ghats). Each painting is one-of-a-kind. When bought, its status atomically changes to `sold`. If the buyer cancels their order, the artwork is immediately restored to `available`.
- **Wall Mural Commissions**: Interactive date selection enforcing the 7-to-90-day booking window, wall surface area validation (10 to 500 sq ft), dynamic studio pricing based on the official seed rate (**₹150 / sq ft**), duplicate date prevention, and customer cancellation up to 3 days before the date.
- **Custom Pottery Requests**: Catalog choice from 5 authentic artisanal vessel silhouettes (Kulhad, Surahi, Matka, Diya set, Gamla) and 6 traditional glazes (Kumkum Red, Haldi Yellow, Mehendi Green, Indigo Blue, Sandalwood Beige, Charcoal Black), order quantity limits (1 to 12 pieces), production lead time validation (≥ 14 days away), and customer editing/cancellation restricted to the `requested` status.
- **Server-Enforced RBAC**:
  - `401 Unauthorized` for missing/invalid authentication.
  - `403 Forbidden` for wrong-role access (e.g., customers attempting admin/studio endpoints, or studio admins attempting to place customer orders).
  - `404 Not Found` when a customer attempts to query another customer's record (preventing ID enumeration).
  - Public registration strictly provisions `customer` accounts; studio admin accounts can only be provisioned server-side.
- **Robust Concurrency**: SQLite transactions (`BEGIN IMMEDIATE`) and database partial unique indexes prevent double-booking or simultaneous multi-customer purchases.
- **Comprehensive UX**: Loading, empty, and error states on every screen, plus quick 1-click test credentials in the authentication modal.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Lucide Icons, Pure Responsive CSS (handles long titles & descriptions) |
| **Backend** | Node.js (v20+ / v24), Express 4, JWT, bcryptjs |
| **Database** | SQLite via native Node standard library (`node:sqlite` / `DatabaseSync`) with WAL mode |
| **Testing** | Node native test runner (`node:test`), Supertest |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v20.0.0 or later (Node 24 supported natively).
- **npm** v9.0.0 or later.
- **Git**.

### 2. Clone and Setup Environment
```bash
# Clone the repository
git clone <repository-url>
cd art-studio-website

# Setup backend environment file
copy .env.example backend\.env   # On Windows
# cp .env.example backend/.env    # On Linux/macOS
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 4. Initialize and Seed Database
The backend includes a dedicated seeding script that sets up studio rates (**₹150/sq ft**), pottery catalog items, glaze palettes, all 12 paintings from `seed.json`, and testing accounts:
```bash
cd backend
npm run seed
```
> **Tip:** You can reset the database to its pristine state at any time by running:
> ```bash
> node src/db/seed.js --reset
> ```

### 5. Start the Application

#### Option A: Single-Server Unified Mode (Recommended)
Build the frontend and run the Express server, which serves both the API and the production UI on a single port:
```bash
# Build frontend
cd frontend
npm run build

# Start backend server
cd ../backend
npm start
```
Open **[http://localhost:5001](http://localhost:5001)** in your browser.

#### Option B: Full-Stack Development Mode (With Hot-Reload)
Run the backend and frontend in separate terminals:
- **Terminal 1 (Backend API):**
  ```bash
  cd backend
  npm start
  # API runs on http://localhost:5001
  ```
- **Terminal 2 (Frontend Dev Server):**
  ```bash
  cd frontend
  npm run dev
  # Vite dev server runs on http://localhost:5173
  ```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Provisioned Test Credentials

The database is pre-seeded with verified test accounts matching the official `seed.json`. You can also use the **1-Click Fill** buttons inside the application's Sign In modal:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Studio Lead** | `studio@artstudio.in` | `Studio@123` | Official seedData studio account: add/edit paintings, confirm/decline bookings, accept/decline pottery |
| **Customer** | `customer@example.com` | `CustomerPassword123!` | Buy paintings in ₹, book murals, request pottery, cancel own records |
| **Customer 2** | `bob@example.com` | `BobPassword123!` | Used for cross-user permission and concurrency tests |

---

## 🧪 Automated Testing

The backend includes a comprehensive test suite of **46 automated tests** covering authentication, date boundaries, business logic, RBAC enforcement, and race condition prevention:

```bash
cd backend
npm test
```

### Test Suite Summary:
- **`auth.test.js`** (7 tests): Registration role enforcement, invalid email/passwords, password hashing verification, 401 unauthenticated, 401 invalid tokens.
- **`paintings.test.js`** (6 tests): Public browsing of all 12 paintings, admin creation, customer forbidden from creating (403), admin editing available paintings, refusal to edit sold paintings (400), customer forbidden from editing (403).
- **`orders.test.js`** (8 tests): Atomic painting purchase, admin purchase refusal (403), double-purchase conflict (409), customer view isolation, admin view all, cross-customer order isolation (404), order cancellation with inventory restoration.
- **`bookings.test.js`** (12 tests): 7-to-90-day boundary validation, 10-to-500 sq ft validation, price calculation (₹150/sq ft), duplicate date refusal (409), admin confirm/decline, cancellation at least 3 days before date, refusal within 3 days (400), cross-customer isolation (404), admin booking refusal (403).
- **`pottery.test.js`** (11 tests): Catalog options retrieval (Kulhad, Surahi, etc.), custom request creation, needed-by date validation (≥ 14 days), quantity limits (1-12), edit while requested, admin accept/decline, refusal to edit/cancel accepted commissions (400), cross-customer isolation (404).
- **`concurrency.test.js`** (2 tests): Simultaneous concurrent purchase of the same painting (exactly one 201, one 409), simultaneous concurrent booking of the same date (exactly one 201, one 409).

**Test Result:** `46 passed, 0 failed` across 6 test suites.

---

## 📁 Repository Structure

```
art-studio-website/
├── .env.example            # Environment variables template (INR currency, ₹150 rate)
├── .gitignore              # Git exclusions for dependencies, secrets, databases
├── README.md               # Setup and project documentation
├── DESIGN.md               # Architectural answers for evaluation
├── DEMO_SCRIPT.md          # Step-by-step 5-minute video walkthrough script
├── SUBMISSION_CHECKLIST.md # Verification checklist
│
├── backend/
│   ├── package.json
│   ├── public/images/      # 12 authentic folk art painting images from seedData
│   ├── src/
│   │   ├── config.js       # Environment configuration (PORT, INR currency, rate)
│   │   ├── server.js       # Express application entrypoint and static image server
│   │   ├── db/
│   │   │   ├── schema.sql  # Relational SQLite schema with indexes and constraints
│   │   │   ├── database.js # SQLite connection with WAL mode and transaction helper
│   │   │   ├── seed.json   # Official seed dataset from assignment
│   │   │   └── seed.js     # Database initialization and seeding script
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT verification and RBAC enforcement (studio & customer)
│   │   ├── routes/
│   │   │   ├── auth.js     # User registration, login, and profile
│   │   │   ├── paintings.js# Gallery browse, add, and edit
│   │   │   ├── orders.js   # Purchasing and order cancellation
│   │   │   ├── bookings.js # Wall mural scheduling and administration
│   │   │   └── pottery.js  # Custom pottery requests and administration
│   │   └── tests/
│   │       ├── testHelper.js       # Test runner utilities
│   │       ├── auth.test.js        # Authentication and RBAC tests
│   │       ├── paintings.test.js   # Painting management tests
│   │       ├── orders.test.js      # Order and cancellation tests
│   │       ├── bookings.test.js    # Wall booking boundary tests
│   │       ├── pottery.test.js     # Custom pottery commission tests
│   │       └── concurrency.test.js # Race condition safety tests
│
└── frontend/
    ├── package.json
    ├── vite.config.js      # Vite build configuration with API reverse proxy
    ├── index.html          # HTML shell with Google Fonts
    └── src/
        ├── main.jsx        # React root mounting
        ├── App.jsx         # Main layout and tab router
        ├── index.css       # Responsive editorial art studio styling
        ├── api/
        │   └── client.js   # Unified API client with JWT interception
        ├── context/
        │   └── AuthContext.jsx # Authentication state provider
        ├── components/
        │   ├── Navbar.jsx          # Studio navigation and user badge
        │   ├── AuthModal.jsx       # Login/Register modal with 1-click test fill
        │   ├── StatusBadge.jsx     # Visual badges for entity states
        │   ├── LoadingSpinner.jsx  # Consistent loading state indicator
        │   ├── EmptyState.jsx      # Empty collection visualizer
        │   └── ErrorMessage.jsx    # User-friendly error alert box
        └── pages/
            ├── GalleryPage.jsx        # Painting gallery and purchasing modal in ₹
            ├── WallBookingPage.jsx    # Wall mural calendar and ₹150/sq ft calculator
            ├── PotteryPage.jsx        # Custom pottery commissioning form in ₹
            ├── CustomerDashboard.jsx  # Customer orders, bookings, and pottery
            └── AdminDashboard.jsx     # Studio staff management console
```
