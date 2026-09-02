# Project Structure - Absensi LT MTsN 1 Kebumen

## 📦 Complete File Tree

```
absensi-lt-mtsn1/
├── 📄 README.md                          # Main documentation
├── 📄 DEPLOYMENT.md                      # Production deployment guide
├── 📄 POSTGRESQL_SETUP.md                # PostgreSQL installation guide
├── 📄 package.json                       # Backend dependencies
├── 📄 package-lock.json
├── 📄 .env                               # Environment variables (create after setup)
├── 📄 .gitignore
├── 📄 start.sh                           # Quick start script
│
├── 📁 server/                            # Node.js + Express Backend
│   ├── 📄 index.js                       # Main server file (5000)
│   │                                      # - Security headers
│   │                                      # - CORS configuration
│   │                                      # - Route mounting
│   │                                      # - Error handling
│   │
│   ├── 📄 db.js                          # PostgreSQL connection pool
│   │                                      # - Connection pooling
│   │                                      # - Error handling
│   │
│   ├── 📄 setup-db.js                    # Database initialization
│   │                                      # - Create tables (users, absensi, audit_log)
│   │                                      # - Create indexes
│   │                                      # - Insert default admin user
│   │
│   ├── 📁 middleware/
│   │   ├── 📄 auth.js                    # JWT & role-based access control
│   │   │                                  # - verifyToken(): JWT validation
│   │   │                                  # - isAdmin(): Admin-only check
│   │   │                                  # - isGuruOrAdmin(): Role check
│   │   │                                  # - auditLog(): Logging all actions
│   │   │
│   │   └── 📄 upload.js                  # Multer file upload configuration
│   │                                      # - File type validation (JPG, PNG, GIF, PDF)
│   │                                      # - File size limit (5MB default)
│   │                                      # - Secure filename generation
│   │
│   └── 📁 routes/
│       ├── 📄 auth.js                    # Authentication routes
│       │   ├── POST /auth/register       # Register new guru
│       │   ├── POST /auth/login          # User login (returns JWT)
│       │   └── GET /auth/me              # Get current user profile
│       │
│       ├── 📄 absensi.js                 # Absensi CRUD routes
│       │   ├── POST /absensi             # Create new absensi (guru)
│       │   ├── GET /absensi              # Get absensi (filter by user/date)
│       │   ├── GET /absensi/:id          # Get detail absensi
│       │   ├── PUT /absensi/:id          # Update absensi (24h window)
│       │   └── DELETE /absensi/:id       # Delete absensi (admin only)
│       │
│       └── 📄 admin.js                   # Admin management routes
│           ├── GET /admin/users          # List all users (paginated)
│           ├── GET /admin/users/:id      # Get user detail
│           ├── PUT /admin/users/:id      # Update user info
│           ├── POST /admin/users/:id/reset-password
│           ├── POST /admin/users/:id/deactivate
│           ├── GET /admin/stats/summary  # Dashboard statistics
│           └── GET /admin/audit-logs     # Audit log history
│
├── 📁 uploads/                           # File storage (photos, documents)
│   └── .gitkeep
│
├── 📁 client/                            # React + Vite Frontend
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   ├── 📄 vite.config.js                 # Vite configuration
│   │                                      # - Port 3000
│   │                                      # - API proxy to http://localhost:5000
│   │
│   ├── 📄 index.html                     # HTML entry point
│   │                                      # - Dark cinematic theme
│   │                                      # - Global styles
│   │
│   └── 📁 src/
│       ├── 📄 main.jsx                   # React entry point
│       ├── 📄 App.jsx                    # Main App component
│       │                                  # - Router setup
│       │                                  # - Auth state management
│       │                                  # - Route guards
│       │
│       ├── 📄 App.css                    # Global styles
│       │                                  # - Dark cinematic UI
│       │                                  # - Layout, typography, components
│       │
│       ├── 📄 api.js                     # Axios HTTP client
│       │                                  # - Base URL configuration
│       │                                  # - JWT token injection
│       │                                  # - Error handling & auto-logout
│       │
│       └── 📁 pages/
│           ├── 📄 Login.jsx              # Login page
│           │   └── Login.css
│           │
│           ├── 📄 Dashboard.jsx          # Guru dashboard (home)
│           │   ├── Dashboard.css
│           │   └── Shows: stats, recent absensi, quick actions
│           │
│           ├── 📄 Profil.jsx             # Profile management
│           │   ├── Profil.css
│           │   └── Edit: nama, jabatan, no HP
│           │
│           ├── 📄 Absensi.jsx            # Create absensi form
│           │   ├── Absensi.css
│           │   └── Fields: tanggal, shift, kelas, status, foto, catatan
│           │
│           ├── 📄 Histori.jsx            # Absensi history/recap
│           │   ├── Histori.css
│           │   └── Filter by month/year, stats summary
│           │
│           └── 📁 admin/
│               ├── 📄 AdminDashboard.jsx # Admin home
│               │   ├── AdminDashboard.css
│               │   └── Stats: users, guru, absensi, hadir
│               │
│               ├── 📄 AdminUsers.jsx     # User management
│               │   ├── AdminUsers.css
│               │   └── Search, reset password, deactivate users
│               │
│               └── 📄 AdminAbsensi.jsx   # Absensi management
│                   ├── AdminAbsensi.css
│                   └── Filter, export CSV, view all data
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Browser (React Frontend)                    │
│  - Runs on http://localhost:3000                         │
│  - Stores JWT in localStorage                            │
│  - Dark cinematic UI (960px+ responsive)                 │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (production)
                         │ JWT in Authorization header
                         ↓
┌─────────────────────────────────────────────────────────┐
│        Nginx Reverse Proxy (Production)                  │
│  - Terminates HTTPS                                      │
│  - Rate limiting                                         │
│  - Security headers                                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│     Node.js + Express Server (http://localhost:5000)     │
│                                                           │
│  Middleware Stack:                                        │
│  1. CORS whitelist                                        │
│  2. Security headers (X-Frame-Options, CSP, etc)          │
│  3. Body parser (JSON limit)                              │
│  4. Route dispatcher                                      │
│                                                           │
│  Routes:                                                  │
│  ├── /api/auth       → verify JWT → auth.js              │
│  ├── /api/absensi    → verify JWT → absensi.js           │
│  └── /api/admin      → verify JWT → isAdmin → admin.js   │
│                                                           │
│  Each route:                                              │
│  - Input validation (express-validator)                   │
│  - Parameterized queries (SQL injection safe)             │
│  - File upload validation (whitelist extensions)          │
│  - Audit logging (all changes tracked)                    │
│  - Error handling (no stack traces in production)         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│           PostgreSQL Database                            │
│                                                           │
│  Tables:                                                  │
│  - users (id, username, email, password_hash, ...)       │
│  - absensi (id, user_id, tanggal, status, foto, ...)     │
│  - audit_log (id, user_id, action, old_data, new_data)   │
│                                                           │
│  Security:                                                │
│  - Passwords: bcryptjs (salt rounds: 10)                  │
│  - Connection pooling: max 20 connections                 │
│  - Prepared statements (parameterized queries)            │
│  - Audit trail of all modifications                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│           File Storage (/uploads)                        │
│  - Photos kegiatan (JPG, PNG)                             │
│  - Secured by: filename randomization, MIME type check    │
│  - Access: /uploads/* route in frontend                  │
└─────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### users table
```sql
id                 SERIAL PRIMARY KEY
username           VARCHAR(50) UNIQUE NOT NULL
email              VARCHAR(100) UNIQUE NOT NULL
password           VARCHAR(255) NOT NULL (bcrypt hash)
full_name          VARCHAR(100) NOT NULL
nip                VARCHAR(20)
role               VARCHAR(20) NOT NULL (guru / admin)
kelas              VARCHAR(10)
jabatan            VARCHAR(50)
no_hp              VARCHAR(15)
foto_profil        VARCHAR(255)
status             VARCHAR(20) DEFAULT 'active'
created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### absensi table
```sql
id                 SERIAL PRIMARY KEY
user_id            INTEGER NOT NULL REFERENCES users(id)
tanggal            DATE NOT NULL
hari               VARCHAR(10) NOT NULL
shift              VARCHAR(20) NOT NULL (pagi/siang/malam)
kelas              VARCHAR(10) NOT NULL
status             VARCHAR(20) NOT NULL (hadir/sakit/izin/alpa)
foto_kegiatan      VARCHAR(255)
catatan            TEXT
lokasi_gps         VARCHAR(100)
ip_address         VARCHAR(45)
created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(user_id, tanggal, shift)
```

### audit_log table
```sql
id                 SERIAL PRIMARY KEY
user_id            INTEGER REFERENCES users(id)
action             VARCHAR(100) NOT NULL
table_name         VARCHAR(50)
record_id          INTEGER
old_data           JSONB
new_data           JSONB
ip_address         VARCHAR(45)
created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## 🚀 Quick Commands

```bash
# Development
npm run dev                    # Start backend (nodemon on :5000)
cd client && npm run dev       # Start frontend (Vite on :3000)

# Database
npm run setup-db              # Initialize database + create admin

# Build
cd client && npm run build    # Build React for production (dist/)

# Production
npm start                     # Run backend (no nodemon)
NODE_ENV=production npm start # Run with production settings
```

## 🔑 Key Technologies

- **Backend**: Node.js, Express.js, PostgreSQL, JWT, bcryptjs
- **Frontend**: React 18, Vite, React Router v6, Axios
- **Styling**: Dark cinematic CSS (no framework bloat)
- **Security**: Input validation, parameterized queries, password hashing
- **File Upload**: Multer (JPG, PNG, GIF, PDF up to 5MB)
- **Database Backup**: Manual via pg_dump
- **Process Management**: PM2 (production)

## 📝 Notes

- All timestamps in UTC
- JWT expires in 7 days (configurable)
- Guru can edit absensi within 24 hours of submission
- Admin can view/edit/delete any absensi
- Photos uploaded to ./uploads/ (configure S3 for production)
- All database changes logged in audit_log table
- No passwords stored in logs

---

**Last Updated**: September 2026
**Version**: 1.0.0
