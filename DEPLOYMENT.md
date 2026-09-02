# Production Deployment Guide

## 🏢 Deployment Options

### Option 1: VPS (Recommended untuk Sekolah)
- DigitalOcean, Linode, atau AWS Lightsail
- Cost: ~$5-15/bulan
- Full control, scalable

### Option 2: Platform as a Service (PaaS)
- Heroku, Railway, Render
- Cost: Free tier atau ~$10+/bulan
- Easier to manage, but less flexible

### Option 3: On-Premises Server
- Server lokal di sekolah
- Cost: Hardware + maintenance
- Full privacy control

---

## 🚀 VPS Deployment (Ubuntu 20.04)

### 1. Connect to VPS
```bash
ssh root@your_server_ip
```

### 2. Update System
```bash
apt update && apt upgrade -y
apt install -y curl wget git build-essential
```

### 3. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node -v && npm -v
```

### 4. Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib

# Start service
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER absensi WITH PASSWORD 'your_secure_password';
CREATE DATABASE absensi_mtsn1 OWNER absensi;
\q
EOF
```

### 5. Install Nginx (Reverse Proxy)
```bash
apt install -y nginx

# Start service
systemctl start nginx
systemctl enable nginx
```

### 6. Clone Project
```bash
cd /var/www
git clone <your_repo_url> absensi-mtsn1
cd absensi-mtsn1

# Setup environment
cp .env.example .env
nano .env

# Update:
# DB_HOST=localhost
# DB_USER=absensi
# DB_PASSWORD=your_secure_password
# JWT_SECRET=generate_random_string
# NODE_ENV=production
```

### 7. Install Dependencies & Build
```bash
npm install --production

# Build frontend
cd client
npm install
npm run build
cd ..
```

### 8. Setup Database
```bash
npm run setup-db
```

### 9. Configure PM2 (Process Manager)
```bash
npm install -g pm2

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'absensi-backend',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    watch: false,
    ignore_watch: ['node_modules', 'uploads'],
    max_memory_restart: '500M'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 10. Configure Nginx
```bash
# Create nginx config
cat > /etc/nginx/sites-available/absensi << 'EOF'
upstream backend {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name your_domain.com;
    client_max_body_size 10M;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        root /var/www/absensi-mtsn1/client/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Upload files
    location /uploads {
        root /var/www/absensi-mtsn1;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/absensi /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Restart nginx
systemctl restart nginx
```

### 11. Setup SSL (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx

certbot --nginx -d your_domain.com

# Auto-renew
systemctl enable certbot.timer
systemctl start certbot.timer
```

### 12. Setup Firewall
```bash
ufw enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

### 13. Backup Database
```bash
# Create backup script
cat > /usr/local/bin/backup-absensi.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/absensi"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U absensi absensi_mtsn1 | gzip > $BACKUP_DIR/absensi_$DATE.sql.gz
find $BACKUP_DIR -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-absensi.sh

# Cron job (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-absensi.sh" | crontab -
```

---

## 🔒 Security Checklist

- [ ] Change admin password immediately
- [ ] Update JWT_SECRET to random 32+ chars
- [ ] Update DB_PASSWORD to strong password
- [ ] Enable SSL/HTTPS certificate
- [ ] Setup firewall rules
- [ ] Enable automatic backups
- [ ] Setup monitoring/alerts
- [ ] Configure rate limiting
- [ ] Enable CORS for frontend domain only
- [ ] Disable database password in logs
- [ ] Setup fail2ban for brute force protection

## 📊 Monitoring Commands

```bash
# Check PM2 status
pm2 status
pm2 logs absensi-backend

# Check Nginx
systemctl status nginx
tail -f /var/log/nginx/error.log

# Check PostgreSQL
sudo -u postgres psql -l

# Check disk usage
df -h

# Check memory
free -h
```

## 🔄 Deployment Updates

```bash
cd /var/www/absensi-mtsn1

# Pull latest code
git pull origin main

# Install new dependencies
npm install --production

# Build frontend
cd client && npm run build && cd ..

# Run migrations (if any)
npm run setup-db

# Restart backend
pm2 restart absensi-backend

# Verify
pm2 logs absensi-backend
```

## 🆘 Troubleshooting

### Cannot connect to database
```bash
# Check PostgreSQL service
systemctl status postgresql

# Check credentials in .env
cat .env | grep DB_

# Test connection
sudo -u postgres psql -d absensi_mtsn1
```

### Nginx 502 Bad Gateway
```bash
# Check backend running
pm2 status

# Check logs
pm2 logs absensi-backend
tail -f /var/log/nginx/error.log
```

### Disk space full
```bash
# Clean old backups
find /var/backups/absensi -mtime +30 -delete

# Check what's using space
du -sh /var/www/absensi-mtsn1/*
du -sh /var/backups/*
```

---

## 📞 Support Contacts

- Server Issues: Contact hosting provider
- SSL Issues: Check certbot status
- Database Issues: Check PostgreSQL logs
- Application Issues: Check PM2 logs

