# 🎯 IMMEDIATE ACTION CHECKLIST

**Status**: ✅ Ready to Deploy
**Date**: September 1, 2026
**Time**: 13:04 UTC

---

## ⚡ DO THIS NOW (Right Now!)

### Step 1: Install PostgreSQL (2 minutes)
```bash
brew install postgresql@15
brew services start postgresql@15
psql --version
```
**Expected output**: `psql (PostgreSQL) 15.x`

### Step 2: Verify Installation
```bash
# Check if service is running
brew services list | grep postgresql

# Should show: postgresql@15 started
```

### Step 3: Setup Database (1 minute)
```bash
cd /Users/anm/Desktop/absensi-lt-mtsn1
npm run setup-db
```
**Expected output**: Database tables created, default admin user inserted

### Step 4: Start Backend (Terminal 1)
```bash
cd /Users/anm/Desktop/absensi-lt-mtsn1
npm run dev
```
**Expected output**: `✓ Server running on http://localhost:5000`

### Step 5: Start Frontend (Terminal 2)
```bash
cd /Users/anm/Desktop/absensi-lt-mtsn1/client
npm run dev
```
**Expected output**: `✓ Local: http://localhost:3000`

### Step 6: Test Login
- Open: http://localhost:3000
- Username: `admin`
- Password: `admin123`
- ✅ Should see admin dashboard

---

## ✅ Quick Verification Checklist

After login:
- [ ] Dashboard loads without errors
- [ ] Can see 4 KPI cards (users, guru, absensi, hadir)
- [ ] Sidebar menu visible
- [ ] Can click through menu items

### Test Guru Features (Add Test User First)
1. Admin → Users → Add new guru
2. Create test user with:
   - Username: testguru
   - Password: test123
   - Role: guru
3. Logout and login as testguru
4. [ ] Dashboard loads
5. [ ] Can submit absensi
6. [ ] Can view riwayat
7. [ ] Can edit profile

### Test Admin Features
1. Login as admin
2. [ ] Can list all users
3. [ ] Can search users
4. [ ] Can view all absensi
5. [ ] Can export CSV
6. [ ] Can reset user password

---

## 🚨 If Something Goes Wrong

### PostgreSQL Error: "psql: command not found"
```bash
# Add to PATH
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version
```

### PostgreSQL Error: "Connection refused"
```bash
# Restart service
brew services restart postgresql@15

# Check status
brew services list | grep postgresql
```

### Port 5000 or 3000 Already In Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Setup Error
```bash
# Check database exists
psql -U postgres -l | grep absensi_mtsn1

# If not, run again
npm run setup-db
```

### Frontend Won't Start
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Success Indicators

When everything is working:

✅ Backend Terminal Shows:
```
✓ Server running on http://localhost:5000
✓ Connected to PostgreSQL
```

✅ Frontend Terminal Shows:
```
VITE v4.x.x  ready in XXX ms
➜  Local:   http://localhost:3000/
```

✅ Browser Shows:
- Login page loads
- Admin dashboard after login
- All menu items clickable
- No console errors (F12)

---

## 🔄 Testing Flow (10 minutes)

1. **Login Test** (1 min)
   - [ ] Login as admin/admin123 works

2. **Dashboard Test** (1 min)
   - [ ] Dashboard displays 4 cards with numbers
   - [ ] Stats visible and readable

3. **User Management** (3 min)
   - [ ] Go to Admin → Users
   - [ ] Add new guru (test user)
   - [ ] Search for user
   - [ ] Edit user
   - [ ] Reset password

4. **Absensi Submission** (2 min)
   - [ ] Logout, login as test guru
   - [ ] Go to Isi Absensi
   - [ ] Fill all fields
   - [ ] Upload photo (if available)
   - [ ] Submit form

5. **History & Export** (2 min)
   - [ ] Go to Riwayat Absensi
   - [ ] Filter by month
   - [ ] Check stats display
   - [ ] Admin: Test CSV export

6. **Profile Edit** (1 min)
   - [ ] Edit profile
   - [ ] Change password
   - [ ] Save changes

---

## 🔐 Security Tasks (Do These Before Production)

- [ ] Change admin password (do now!)
- [ ] Update JWT_SECRET in .env (before deploying)
- [ ] Update DB_PASSWORD in .env (before deploying)
- [ ] Enable HTTPS (on VPS, see DEPLOYMENT.md)
- [ ] Setup database backups (see DEPLOYMENT.md)

---

## 📋 Before Production Deployment

Read in order:
1. [ ] DEPLOYMENT.md (complete guide)
2. [ ] Security Checklist (in DEPLOYMENT.md)
3. [ ] Database Backup Setup
4. [ ] SSL Certificate Setup
5. [ ] Firewall Configuration

---

## 📞 Quick Reference

**Project Location**: `/Users/anm/Desktop/absensi-lt-mtsn1`

**Default Admin**: 
- Username: admin
- Password: admin123

**Backend API**: http://localhost:5000
**Frontend URL**: http://localhost:3000
**Database**: PostgreSQL on localhost:5432

**Start Commands**:
```bash
cd /Users/anm/Desktop/absensi-lt-mtsn1

# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

---

## 🎯 Done When

- ✅ PostgreSQL installed and running
- ✅ Database initialized (`npm run setup-db` successful)
- ✅ Backend server running on :5000
- ✅ Frontend app running on :3000
- ✅ Login works (admin/admin123)
- ✅ Can see dashboard
- ✅ Can test guru features
- ✅ Can test admin features

---

## 📚 Next Documentation to Read

After testing:
1. **DEPLOYMENT.md** - For production setup
2. **POSTGRESQL_SETUP.md** - For database troubleshooting
3. **PROJECT_STRUCTURE.md** - For architecture understanding

---

## ✨ You're Done When

System is **LIVE** and **TESTED** when:

✅ All 6 steps above completed
✅ Login works
✅ Dashboard displays
✅ Can submit absensi
✅ Can view history
✅ Admin can manage users
✅ Export CSV works
✅ No console errors

**Then**: Ready for production deployment (follow DEPLOYMENT.md)

---

**STATUS**: 🎊 System Complete - Ready for Setup

**NEXT**: Run the 6 steps above now!

---

*This checklist is your go-to reference. Follow it step-by-step.*
*Estimated time to full system running: 15 minutes*
