# Sistem Absensi LT MTsN 1 Kebumen

Platform web modern untuk manajemen absensi guru dengan fitur lengkap dan keamanan tingkat enterprise.

## 🎯 Fitur Utama

### Untuk Guru
- **Dashboard**: Overview absensi dan statistik personal
- **Isi Absensi**: Form lengkap dengan pilihan shift, kelas, upload foto kegiatan
- **Riwayat**: Rekap data absensi per bulan dengan filtering
- **Profil**: Kelola data pribadi dan informasi akun

### Untuk Admin
- **Dashboard Admin**: Statistik sistem dan ringkasan data
- **Manajemen Guru**: CRUD user, reset password, deaktivasi akun
- **Data Absensi**: View semua data, filter per bulan, export CSV
- **Audit Log**: Tracking semua aksi di sistem

## 🔒 Keamanan

✓ **JWT Authentication** - Token-based session management
✓ **Password Hashing** - bcryptjs dengan salt rounds 10
✓ **CORS Protection** - Whitelist domain tertentu saja
✓ **Security Headers** - X-Frame-Options, CSP, HSTS, XSS Protection
✓ **Input Validation** - express-validator untuk semua input
✓ **File Upload Security** - Whitelist tipe file, limit ukuran 5MB
✓ **SQL Injection Protection** - Parameterized queries (pg library)
✓ **HTTPS Ready** - Environment-based CORS untuk production
✓ **Audit Logging** - Semua action tercatat di database
✓ **Role-Based Access** - Admin vs Guru dengan permission control

## 📋 Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- JWT + bcryptjs untuk auth
- Multer untuk file upload

**Frontend:**
- React 18 + Vite
- React Router v6 untuk routing
- Axios untuk HTTP client
- Dark cinematic UI

**Deployment:**
- Server: Node.js
- Database: PostgreSQL
- File Storage: Local filesystem (bisa upgrade ke S3)

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- PostgreSQL 12+
- npm atau yarn

### 1. Setup Database

```bash
cd /Users/anm/Desktop/absensi-lt-mtsn1

# Install backend dependencies
npm install

# Setup database (create tables, default admin user)
npm run setup-db
```

### 2. Configure Environment

Edit `.env` di root folder:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=absensi_mtsn1
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_min_32_chars_change_in_prod
JWT_EXPIRE=7d
NODE_ENV=development
```

**PENTING**: Ganti JWT_SECRET dengan string random panjang di production!

### 3. Start Backend

```bash
npm run dev
```

Server akan jalan di `http://localhost:5000`

### 4. Setup Frontend

```bash
cd client
npm install
npm run dev
```

Frontend akan jalan di `http://localhost:3000`

### 5. Login

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN**

## 📁 Project Structure

```
absensi-lt-mtsn1/
├── server/
│   ├── middleware/
│   │   ├── auth.js           # JWT verification, role checking
│   │   └── upload.js         # Multer configuration
│   ├── routes/
│   │   ├── auth.js           # Login, register, get profile
│   │   ├── absensi.js        # CRUD absensi
│   │   └── admin.js          # Admin operations
│   ├── db.js                 # Database connection pool
│   ├── setup-db.js           # Database initialization
│   └── index.js              # Main server file
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profil.jsx
│   │   │   ├── Absensi.jsx
│   │   │   ├── Histori.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       └── AdminAbsensi.jsx
│   │   ├── App.jsx
│   │   ├── api.js            # Axios instance
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── uploads/                  # Folder untuk upload file
├── .env
├── package.json
└── README.md
```

## 🔐 Security Checklist untuk Production

- [ ] Ganti JWT_SECRET dengan string random 32+ karakter
- [ ] Ganti DB_PASSWORD dengan password yang aman
- [ ] Update CORS origin ke domain produksi
- [ ] Enable HTTPS (set NODE_ENV=production)
- [ ] Backup database secara regular
- [ ] Monitor audit logs untuk aktivitas mencurigakan
- [ ] Rotate admin password
- [ ] Setup rate limiting di reverse proxy
- [ ] Enable database backups otomatis
- [ ] Setup monitoring/alerting

## 📊 Database Schema

### users
```
id (PK) | username | email | password | full_name | nip | role | kelas | jabatan | no_hp | status | created_at
```

### absensi
```
id (PK) | user_id (FK) | tanggal | hari | shift | kelas | status | foto_kegiatan | catatan | ip_address | created_at
```

### audit_log
```
id (PK) | user_id (FK) | action | table_name | record_id | old_data (JSONB) | new_data (JSONB) | ip_address | created_at
```

## 🛠️ API Endpoints

### Auth
- `POST /api/auth/register` - Register guru baru
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user profile

### Absensi (Guru)
- `POST /api/absensi` - Buat absensi baru (multipart/form-data)
- `GET /api/absensi` - Get absensi user (support filter bulan/tahun)
- `GET /api/absensi/:id` - Get detail absensi
- `PUT /api/absensi/:id` - Update absensi (24 jam window)

### Admin
- `GET /api/admin/users` - Daftar semua user
- `GET /api/admin/users/:id` - Detail user
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `POST /api/admin/users/:id/deactivate` - Deactivate user
- `GET /api/admin/stats/summary` - Dashboard statistics
- `GET /api/admin/audit-logs` - Audit log list

## 🐛 Troubleshooting

### Error: Database connection failed
```bash
# Check postgres service
brew services list
brew services start postgresql

# Test connection
psql -U postgres -h localhost -c "SELECT 1"
```

### Error: Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Error: File upload not working
```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

### Error: CORS issues
Check `.env` dan pastikan frontend URL ada di whitelist CORS

## 📝 Catatan Penting

1. **File Upload**: Disimpan di folder `./uploads/`. Untuk production, gunakan cloud storage (S3, GCS)
2. **Session Expiry**: JWT token expire dalam 7 hari. Guru harus login kembali setelah itu
3. **Edit Absensi**: Guru hanya bisa edit absensi dalam 24 jam setelah submit
4. **Photo Requirements**: Max 5MB, format JPG/PNG/GIF
5. **Backup**: Setup automatic database backup sebelum launch production

## 📞 Support

Untuk issues/bugs, silakan check:
1. Database connection - `npm run setup-db`
2. Environment variables di `.env`
3. Node & npm versions - `node -v && npm -v`
4. PostgreSQL service running - `brew services list`

## 📄 License

Internal use only - MTsN 1 Kebumen

---

**Dibuat dengan ❤️ untuk meningkatkan efisiensi absensi guru**

*Last updated: September 2026*
