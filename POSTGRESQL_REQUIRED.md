# 🚨 POSTGRESQL REQUIRED - INSTALL NOW

**Status**: PostgreSQL not found
**Next Action**: Install PostgreSQL immediately

---

## ⚡ Quick Install (2 minutes)

### On macOS (Recommended)

```bash
# Install PostgreSQL 15
brew install postgresql@15

# Start the service
brew services start postgresql@15

# Verify installation
psql --version
```

**Expected output**: `psql (PostgreSQL) 15.x`

---

## ✅ After Installation

Once PostgreSQL is installed and running, run:

```bash
cd /Users/anm/Desktop/absensi-lt-mtsn1
bash auto-setup.sh
```

This will automatically:
1. ✅ Verify PostgreSQL is running
2. ✅ Initialize database (absensi_mtsn1)
3. ✅ Create tables & admin user
4. ✅ Build frontend

Then start servers in 2 terminals:

```bash
# Terminal 1
npm run dev

# Terminal 2
cd client && npm run dev
```

---

## 🎯 System Ready When

- ✅ PostgreSQL installed (`brew install postgresql@15`)
- ✅ Service running (`brew services start postgresql@15`)
- ✅ auto-setup.sh completed
- ✅ Backend running on :5000
- ✅ Frontend running on :3000
- ✅ Login works at http://localhost:3000

---

## 📋 Full Install Options

See `POSTGRESQL_SETUP.md` for:
- macOS (Homebrew, Direct, Docker)
- Windows (Installer, WSL)
- Linux (apt, yum, Docker)

---

## 🔄 Next Step

```bash
brew install postgresql@15
brew services start postgresql@15
```

Then run auto-setup script again.

---

**Time**: 2-3 minutes
**Status**: ⏳ Waiting for PostgreSQL
