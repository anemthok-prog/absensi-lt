# Deploy Absensi LT ke VPS (produksi)

Panduan deplocasi ke server sendiri (Ubuntu 22.04+). Sesi app: Node.js (>=18) + PostgreSQL.

## 1. Siapkan server
```bash
sudo apt update && sudo apt install -y git curl postgresql postgresql-contrib nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Buat database & user
```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE absensi_lt;
CREATE USER absensi WITH PASSWORD 'BUKAN_DEFAULT_YANG_KUAT_12Ch4r!';
GRANT ALL PRIVILEGES ON DATABASE absensi_lt TO absensi;
SQL
# kalo error "permission denied for schema public":
sudo -u postgres psql -d absensi_lt -c "GRANT ALL ON SCHEMA public TO absensi;"
```

## 3. Clone (repo PRIVATE → butuh key/enter)
```bash
cd /var/www
sudo git clone https://github.com/anemthok-prog/absensi-lt.git  # atau via SSH
cd absensi-lt
```

## 4. Install & isi .env
```bash
cd server && cp ../.env.example .env && ../...
```
Isi `.env` (di server, jangan di-commit):
- `NODE_ENV=production`, `CLIENT_URL=https://DOMAIN`
- `DB_PASSWORD=<yang kuat>`, `DB_NAME=absensi_lt`, `DB_USER=absensi`
- `JWT_SECRET=<random 32+>` (generate: `openssl rand -hex 32`)
- `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=<kuat>`
- `EMAIL_USER`/`EMAIL_PASS` (App Password Gmail) + `MAIL_LOGGING=false`
- `PORT=5001`

## 5. Migrasi DB + admin awal
```bash
cd server && node setup-db.js   # buat tabel + admin (kalau ADMIN_PASSWORD diset)
```

## 6. Build frontend
```bash
cd ../client && npm install && npm run build   # hasil di client/dist
```

## 7. Jalankan API via PM2
```bash
cd ../server && pm2 start ecosystem.config.js
pm2 save && pm2 startup   # ikuti perintah yang muncul
```

## 8. Nginx + HTTPS
```bash
sudo cp /var/www/absensi-lt/deploy/nginx-absensi-lt.conf /etc/nginx/sites-available/absensi-lt
# edit SERVER_DOMAIN, root path bila perlu
sudo ln -sf /etc/nginx/sites-available/absensi-lt /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d DOMAIN   # HTTPS otomatis
```

## 9. Keamanan produksi
- `.env` JANGAN di-commit (sudah di-gitignore). Rahasia hanya di server.
- Password admin kuat (`ADMIN_PASSWORD`), bukan default.
- `NODE_ENV=production` → CORS hanya `CLIENT_URL`, rate-limit aktif.
- Back-up DB rutin: add cron → `sudo -u postgres pg_dump absensi_lt | gzip > /backup/absensi_lt-$(date +%F).sql.gz`
- `npm audit --omit=dev` rutin.

## Checklist target
- [ ] `.env` aman di server, bukan di repo
- [ ] Admin pakai password kuat
- [ ] HTTPS aktif (certbot)
- [ ] CORS terisi `CLIENT_URL`
- [ ] `MAIL_LOGGING=false`
- [ ] Backup DB terjadwal
