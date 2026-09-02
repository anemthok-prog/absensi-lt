# Absensi LT — MTsN 1 Kebumen

Sistem absensi guru / pegawai berbasis web dengan panel admin. Frontend React + Vite, backend Express (Node), database PostgreSQL.

## Tech Stack

- **Frontend:** React 18, Vite 5, React Router, Phosphor Icons, Axios
- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT auth, bcrypt, Multer (upload foto), Nodemailer (OTP reset password)
- **DB:** PostgreSQL 15+

---

## Prasyarat

- Node.js **18+**
- PostgreSQL **15+** (harus sudah running)
- npm

---

## 1. Setup Cepat (disarankan)

```bash
# 1. Buat file .env dari template, lalu isi nilainya
cp .env.example .env
#    ⚠️ Edit .env: isi DB_PASSWORD, JWT_SECRET, dan ADMIN_PASSWORD

# 2. Install dependensi backend
npm install

# 3. Install dependensi frontend
cd client && npm install && cd ..

# 4. Setup database (buat DB, tabel, dan akun admin)
npm run setup-db

# 5. (Opsional) Isi data demo: guru + absensi + admin siap login
#    node server/seed-demo.js

# 6. Build frontend agar bisa dijalankan satu origin
npm run build

# 7. Jalankan server
npm start
#    → buka http://localhost:5001
```

Login default (setelah `seed-demo.js`):
- **Admin:** `admin` / `admin123`
- **Guru demo:** `guru.budi` / `Guru1234` (dan `guru.siti`, `guru.agus`, dst.)

> Alternatif: `bash start.sh` — script otomatis cek Node/PostgreSQL, buat `.env` default, install dependency, dan setup DB. Tetap wajib edit `.env` (DB_PASSWORD & buat akun admin).

---

## 2. Mode Development (biar bisa edit-edit)

Jalankan backend dan frontend terpisah:

```bash
# Terminal 1 — backend (auto-restart)
npm run dev

# Terminal 2 — frontend (Vite, hot-reload)
cd client && npm run dev
```

Frontend: `http://localhost:3000` (proksi `/api` ke backend). Backend: `http://localhost:5001`.

---

## 3. Konfigurasi Environment (`.env`)

| Variabel | Keterangan |
|---|---|
| `PORT` | Port server (default `5001`) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Origin frontend yang diizinkan CORS (di produksi wajib diisi) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Kredensial PostgreSQL |
| `JWT_SECRET` | Kunci rahasia JWT (string acak panjang) |
| `JWT_EXPIRE` | Masa berlaku token (contoh: `7d`) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Akun admin awal (dibuat oleh `setup-db.js` hanya jika `ADMIN_PASSWORD` diisi) |
| `UPLOAD_DIR` | Folder penyimpanan upload |
| `MAX_FILE_SIZE` | Ukuran maksimum file (byte) |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | SMTP untuk email OTP reset password |
| `MAIL_LOGGING` | `true` = OTP ditampilkan di layar/console (mode dev, tanpa SMTP asli) |

> **Database via URL (opsional):** `DATABASE_URL` juga didukung (dipakai di hosting seperti Neon), menggantikan `DB_*`.

---

## 4. Script npm

| Script | Fungsi |
|---|---|
| `npm start` | Jalankan server produksi (serve API + `client/dist`) |
| `npm run dev` | Jalankan server dengan nodemon (auto-restart) |
| `npm run build` | Build frontend ke `client/dist` |
| `npm run setup-db` | Buat database, tabel, index, dan akun admin awal |
| `npm run client` | Jalankan Vite dev server |

---

## 5. Struktur Folder

```
absensi-lt-mtsn1/
├── server/            # Backend Express (routes, middleware, db, migrasi, seed)
├── client/            # Frontend React + Vite
├── deploy/            # Konfigurasi deployment (PM2, dll)
├── docs/              # Dokumentasi tambahan
├── uploads/           # Foto upload (gitignored, jangan ikut repository)
├── .env.example       # Template env
├── render.yaml        # Blueprint deploy ke Render
└── start.sh           # Script quick-start
```

---

## 6. Deployment

- Repo ini mendukung deploy ke **Render** (lihat `render.yaml`) — satu web service yang build frontend lalu menjalankan backend (single origin).
- `DATABASE_URL` (contoh: Neon) dipakai jika dideploy ke hosting Postgres.
- Detail lengkap: lihat `DEPLOYMENT.md` dan `deploy/`.

---

## Keamanan

- `.env` **tidak pernah** di-commit (gitignored). Jangan pernah share `.env` berisi kredensial asli.
- `uploads/` berisi foto kegiatan (privasi) — jangan ikut tersebar.
- CI mengecek secret (Gitleaks) dan build frontend di setiap push/PR (lihat `.github/workflows/ci.yml`).
