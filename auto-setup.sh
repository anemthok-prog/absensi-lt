#!/bin/bash

# Auto Setup Script - Absensi LT MTsN 1 Kebumen
# Run this to setup everything automatically

set -e

PROJECT_DIR="/Users/anm/Desktop/absensi-lt-mtsn1"
cd "$PROJECT_DIR"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         AUTO SETUP - Absensi LT MTsN 1 Kebumen              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check PostgreSQL
echo "📋 STEP 1: Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not installed"
    echo "Install with: brew install postgresql@15"
    echo "Then start: brew services start postgresql@15"
    exit 1
fi
echo "✅ PostgreSQL found: $(psql --version)"
echo ""

# Step 2: Check if PostgreSQL is running
echo "📋 STEP 2: Checking PostgreSQL service..."
if ! pg_isready -h localhost &> /dev/null; then
    echo "⚠️  PostgreSQL not running. Starting..."
    brew services start postgresql@15 || {
        echo "❌ Failed to start PostgreSQL"
        exit 1
    }
    sleep 2
fi
echo "✅ PostgreSQL is running"
echo ""

# Step 3: Setup database
echo "📋 STEP 3: Setting up database..."
node server/setup-db.js || {
    echo "❌ Database setup failed"
    exit 1
}
echo "✅ Database initialized"
echo ""

# Step 4: Build frontend
echo "📋 STEP 4: Building frontend..."
cd client && npm run build > /dev/null 2>&1 || {
    echo "❌ Frontend build failed"
    exit 1
}
cd ..
echo "✅ Frontend built"
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ SETUP COMPLETE                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Next: Start servers in 2 terminals"
echo ""
echo "Terminal 1:"
echo "  cd $PROJECT_DIR"
echo "  npm run dev"
echo ""
echo "Terminal 2:"
echo "  cd $PROJECT_DIR/client"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo "Login: admin / admin123"
echo ""
