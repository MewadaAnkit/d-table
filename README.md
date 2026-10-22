# Attendly — Full-Stack MERN Attendance Management System

**Attendly** is an enterprise-grade Attendance Management System built with MongoDB, Express.js, React.js (Vite + TypeScript), and Node.js. It features live camera selfie verification, GPS geolocation tracking, role-based access control (RBAC), overtime request workflows, manager verification queues, administrative directory governance, and CSV report exports.

---

## 1. Features Implemented

### 📷 Core Attendance Punch-In / Punch-Out
- **Live Camera Evidence**: Directly captures user selfies via the browser's `navigator.mediaDevices.getUserMedia` video stream and canvas snapshot. **Strictly live capture only**—no file upload fallback or file selector bypass.
- **GPS Coordinates**: Tracks latitude, longitude, and accuracy radius on punch events via the Geolocation API.
- **Server-Authoritative Timestamps & Calculations**: Prevents client-clock manipulation. Working durations are calculated on the backend in integer minutes to eliminate floating-point drift.
- **Standard 8-Hour Shift Logic (480 minutes)**:
  - `completed`: Total duration is at least 480 minutes upon punch-out.
  - `incomplete`: Total duration is under 480 minutes after punch-out.
  - `in_progress`: Punched in, active shift currently underway (never prematurely labeled as incomplete).
- **Duplicate Prevention**: Compound index `{ employeeId: 1, attendanceDate: 1 }` prevents duplicate records on the same business date.

### 🔒 Private & Secure Selfie Storage
- Private local storage adapter with extensible S3-compatible interface.
- Files are saved in an isolated directory using cryptographically random keys (UUIDs).
- Selfies are **never served via public URLs**. Access is restricted via an authenticated streaming endpoint (`/api/v1/attendance/:id/selfie/:type`), which strictly validates role and employee ownership before streaming.

### 🛡️ Role-Based Access Control (RBAC) & Authorization
- **Roles**: `employee`, `manager`, `admin`.
- **Public Signup Restriction**: Public registration is strictly restricted to the `employee` role. Manager and Admin accounts cannot be self-assigned.
- **Data Isolation**:
  - Employees can only view and query their own records and reports.
  - Managers can only view, verify, and approve records for direct reports assigned to their team.
  - Admins possess system-wide visibility and administrative authority.
- **Dual-Token Transport**: Supports both HttpOnly cookies and Bearer tokens for flexibility.

### ⏱️ Overtime Workflow
- Employees can submit overtime claims for completed shifts with justification reasons.
- Managers and Admins can review pending overtime claims.
- **Strict State Transitions**: Already approved/rejected requests cannot be re-reviewed.
- **Mandatory Remarks**: Rejecting an overtime request strictly requires a justification remark (minimum 3 characters).

### ✅ Manager & Admin Verification Queue
- Dedicated verification queue displaying punch-in/out times, GPS coordinates, duration, and selfie evidence side-by-side.
- Actions: Mark **Valid** or Mark **Invalid**.
- **Mandatory Rejection Remarks**: Marking attendance as `Invalid` strictly requires a remark explaining the discrepancy.

### 📊 Role-Specific Dashboards
- **Employee**: Today's active session, punch CTA, completed vs. incomplete shift count, overtime breakdown, and recent history.
- **Manager**: Team member count, currently checked-in employees, shift completion distribution, and pending approval alerts.
- **Admin**: Company-wide workforce statistics, active employee directory, active shift distribution, and global review shortcuts.

### 📑 Reports & CSV Export
- Daily attendance report with filters: date range, department, working status, and verification status.
- Secure, role-scoped CSV export endpoint (`/api/v1/reports/export`) delivering clean, escaped CSV downloads.

### 👥 User Directory Governance (Admin)
- Admin interface to search, filter by role/status, activate/deactivate accounts, and assign direct reporting managers.
- Self-deactivation prevention for the active administrator.

### 🌟 Bonus Features Implemented (Assessment Specification)
- **📍 Geofencing & Real-Time Proximity Radar**:
  - Restricts or flags attendance punches according to the office geofence perimeter (default 1,000m radius from headquarters coordinates).
  - Live Radar widget in the Punch In/Out view displaying current real-time distance from the office in meters/kilometers, perimeter status, and authorization lock.
  - Server-side enforcement flag `ENFORCE_GEOFENCE` to block unauthorized out-of-perimeter punches with 403 Forbidden errors.
- **🔔 In-App Notification Center & Missed Punch Alerts**:
  - Dedicated MongoDB notification model and API endpoints (`/api/v1/notifications`).
  - **Missed Punch Detection**: Automatically detects shifts exceeding 9 hours without punch-out and notifies employees with actionable links to resolve their shift.
  - **Instant Workflow Alerts**: Real-time alerts generated when Overtime is requested, approved, or rejected, and when attendance selfies are verified.
  - Interactive notification bell in the top navigation bar with unread count badge, time-ago format, and "Mark all as read".
- **⚡ Real-Time Updates (Socket.IO)**:
  - Integrated Socket.IO WebSocket server with room-based user and role targeting (`user:<id>`, `role:<role>`).
  - Real-time client listeners in `AppLayout` that automatically invalidate RTK Query caches and display live floating toast notifications when employees punch in/out or when manager decisions occur.
- **🌙 Full Dark Mode Experience**:
  - Class-based Tailwind dark mode with one-click theme toggle (Sun/Moon) in the top navigation bar.
  - Persisted in `localStorage` with zero-flash startup script in `index.html`.
  - Harmonious, curated dark theme across the entire application including sidebars, camera views, tables, cards, and modals.
- **📑 Multi-Format Export Reports (PDF & Excel)**:
  - **Excel (.xlsx)**: One-click export using SheetJS with formatted columns, auto-fitted cell widths, and shift compliance flags.
  - **PDF (.pdf)**: Executive attendance summary documents generated via `jspdf` and `jspdf-autotable` with company branding, audit dates, and metrics summaries.
  - Complements the existing CSV and direct print styles.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React |
| **State & API** | Redux Toolkit, RTK Query |
| **Routing & Forms** | React Router v7, React Hook Form, Zod |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | MongoDB with Mongoose ODM |
| **Security** | bcryptjs, jsonwebtoken, Helmet, CORS, Cookie-Parser, express-rate-limit |
| **Logging** | Winston Structured Logger |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom |

---

## 3. Project Structure

```text
taskanalytics/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── app/                # Redux Toolkit store configuration
│   │   ├── components/         # Common UI: Badge, Button, Modal, Pagination, SelfieModal
│   │   ├── features/auth/      # Auth slice & state
│   │   ├── layouts/            # AppLayout (Sidebar, Header) & AuthLayout
│   │   ├── pages/
│   │   │   ├── public/         # LoginPage, SignupPage, UnauthorizedPage, NotFoundPage
│   │   │   ├── employee/       # EmployeeDashboard, PunchPage, MyAttendance, Overtime, Reports, Profile
│   │   │   ├── manager/        # ManagerDashboard, TeamAttendance, VerificationQueue, OvertimeApprovals, TeamReports
│   │   │   └── admin/          # AdminDashboard, UserManagement, AllAttendance, AdminReports
│   │   ├── routes/             # AppRoutes & ProtectedRoute guards
│   │   ├── services/           # RTK Query API endpoints
│   │   ├── test/               # React Testing Library & Vitest unit tests
│   │   └── types/              # TypeScript models and interfaces
│   ├── index.html
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Zod validated env, Winston logger, Mongoose connectDB
│   │   ├── middleware/         # auth (JWT), role (RBAC), validate (Zod), error handler
│   │   ├── models/             # User, Attendance, OvertimeRequest schemas
│   │   ├── modules/
│   │   │   ├── auth/           # Login, Signup, Logout, Me
│   │   │   ├── attendance/     # Punch-In, Punch-Out, Verification, Stream Selfie
│   │   │   ├── overtime/       # Request, Review (Approve/Reject)
│   │   │   ├── reports/        # Daily reports & CSV export
│   │   │   ├── users/          # Admin directory, manager assignment, status toggle
│   │   │   └── dashboard/      # Role-specific dashboard aggregations
│   │   ├── storage/            # Private local storage adapter
│   │   ├── utils/              # Date calculations, JWT helpers, CSV generator
│   │   ├── app.ts              # Express application configuration
│   │   ├── server.ts           # Bootstrapping script
│   │   └── scripts/seed.ts     # Comprehensive demo seeding script
│   ├── tests/                  # Backend Supertest + Vitest tests
│   ├── tsconfig.json
│   └── vitest.config.ts
├── package.json                # Root monorepo workspace configuration
├── checklist.md                # Development verification checklist
└── README.md
```

---

## 4. Environment Variables

### Backend (`server/.env`)
Create `server/.env` with the following keys (see `server/.env.example`):

```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/attendly
JWT_SECRET=attendly_super_secure_jwt_secret_key_2026!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
TIMEZONE=UTC
STORAGE_DRIVER=local
MAX_FILE_SIZE_MB=5
```

### Frontend (`client/.env`)
Create `client/.env` with the following key (see `client/.env.example`):

```ini
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on port 27017 or a MongoDB Atlas URI

### Installation
From the root directory, install all workspace dependencies:
```bash
npm install
```

### Database Seeding
Initialize sample accounts, reporting hierarchies, and realistic attendance records:
```bash
npm run seed
```

### Running Locally
Run both client and server concurrently:
```bash
npm run dev
```
Or start each service independently in separate terminals:
- **Server**: `npm run dev --workspace=server` (starts on `http://localhost:5000`)
- **Client**: `npm run dev --workspace=client` (starts on `http://localhost:5173`)

---

## 6. Demo Accounts (Development & Testing)

All seeded accounts use the password: `Password123!`

| Role | Name | Email | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | Eleanor Vance | `admin@attendly.local` | Full administrative control, user governance, company-wide logs |
| **Manager** | Sarah Jenkins | `manager@attendly.local` | Team manager with 3 direct reports, verification & approval queues |
| **Employee** | Alex Rivera | `alex@attendly.local` | Direct report to Sarah. Shift not started today—ready to test live punch-in |
| **Employee** | David Kim | `david@attendly.local` | Currently active session today—ready to test live punch-out |
| **Employee** | Maria Santos | `maria@attendly.local` | Direct report to Sarah with past completed & incomplete records |

---

## 7. Running the Automated Test Suites

### Backend Tests (Supertest + Vitest)
Executes 13 tests covering authentication, RBAC, employee isolation, manager team scoping, duplicate punch prevention, 8-hour status classification, and verification remarks validation:
```bash
npm run test:server
```

### Frontend Tests (React Testing Library + Vitest)
Executes unit tests verifying badge styling, status formatting, and Redux auth slice state management:
```bash
npm run test:client
```

### Run All Tests
```bash
npm test
```

---

## 8. Backend API Reference

### Authentication
- `POST /api/v1/auth/signup` — Register a new employee account (rate-limited).
- `POST /api/v1/auth/login` — Authenticate and receive JWT cookie & token (rate-limited).
- `POST /api/v1/auth/logout` — Clear session cookies.
- `GET /api/v1/auth/me` — Retrieve active authenticated user profile.

### Attendance
- `POST /api/v1/attendance/punch-in` — Begin shift with live selfie data URI and GPS coordinates.
- `POST /api/v1/attendance/punch-out` — End active shift, calculate duration, and assign working status.
- `GET /api/v1/attendance/active` — Check if logged-in user has an active shift.
- `GET /api/v1/attendance/me` — Paginated history for logged-in employee.
- `GET /api/v1/attendance/team` — Team attendance for managers.
- `GET /api/v1/attendance` — Global attendance records for admins.
- `GET /api/v1/attendance/:id` — Details of a specific record (scoped by role/team).
- `PATCH /api/v1/attendance/:id/verification` — Mark shift as Valid or Invalid (requires remark on invalid).
- `GET /api/v1/attendance/:id/selfie/:type` — Authenticated private stream of punch-in (`in`) or punch-out (`out`) selfie.

### Overtime
- `POST /api/v1/overtime` — Submit overtime request on a completed shift.
- `GET /api/v1/overtime/me` — Paginated overtime claims for logged-in employee.
- `GET /api/v1/overtime` — Manager team queue or admin company queue.
- `PATCH /api/v1/overtime/:id/review` — Approve or reject claim (requires remark on reject).

### Reports & Admin
- `GET /api/v1/reports/daily` — Filtered, paginated attendance report.
- `GET /api/v1/reports/export` — Scoped, RFC-compliant CSV export stream.
- `GET /api/v1/users` — Admin directory listing with search & filters.
- `GET /api/v1/users/managers` — Active manager listing for assignment dropdowns.
- `PATCH /api/v1/users/:id` — Update role, department, name, or assigned manager.
- `PATCH /api/v1/users/:id/status` — Activate or deactivate account.
- `GET /api/v1/dashboard/employee` — Aggregated metrics for employee dashboard.
- `GET /api/v1/dashboard/manager` — Aggregated metrics for manager dashboard.
- `GET /api/v1/dashboard/admin` — Aggregated metrics for admin dashboard.

---

## 9. Production Deployment Guidelines

### Backend Deployment (e.g. Render, Railway, AWS ECS)
1. Set environment variables on the host:
   - `PORT`: provided by host (e.g., `5000` or `10000`).
   - `NODE_ENV`: `production`.
   - `MONGODB_URI`: MongoDB Atlas connection string with replica set.
   - `JWT_SECRET`: 32+ character random secret.
   - `CLIENT_URL`: production frontend URL (e.g., `https://attendly.vercel.app`).
2. Build command: `npm run build --workspace=server`
3. Start command: `node dist/server.js` (inside `server/`)
4. Health check endpoint: `GET /api/v1/health`

### Frontend Deployment (e.g. Vercel, Netlify)
1. Root directory: `client/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable: `VITE_API_URL=https://<your-backend-api-domain>/api/v1`

---

## 10. Design Assumptions & Technical Notes

1. **Standard Shift Duration**: Defined as 480 minutes (8 hours). Punched-out shifts meeting or exceeding 480 minutes are marked `completed`; those under 480 minutes are marked `incomplete`. In-progress shifts remain `in_progress` until punch-out occurs.
2. **Human Verification Over Biometric Guarantees**: Camera capture and GPS coordinates serve as evidentiary data for managerial verification. The platform deliberately avoids claiming infallible biometric facial recognition or untamperable anti-spoofing.
3. **Private Selfie Storage**: Stored images are kept in private server storage and served only through an authenticated, authorization-checked streaming endpoint. Public image URLs are deliberately avoided.
4. **Business Timezone Consistency**: Date boundaries are calculated based on the configured business timezone (default `UTC`), ensuring standard day boundaries regardless of client system clock offsets.
