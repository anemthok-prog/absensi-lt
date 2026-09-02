#!/bin/bash

# Absensi LT MTsN 1 - Quick Start Script
# Run: bash start.sh

set -e

echo "🚀 Starting Absensi LT MTsN 1 System..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

echo "✓ npm $(npm -v)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found"
    echo "   Install from: https://www.postgresql.org/download/"
    echo "   Or: brew install postgresql@15"
    echo ""
fi

# Create uploads directory
mkdir -p uploads
echo "✓ Uploads directory ready"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    echo "   Creating default .env..."
    cat > .env << 'EOF'
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=absensi_mtsn1
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=change_this_to_random_string_min_32_chars_production
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
EOF
    echo "✓ .env created (update dengan password PostgreSQL Anda)"
    echo ""
    echo "⚠️  PENTING: Edit .env dan ubah:"
    echo "   - DB_PASSWORD: ganti dengan password PostgreSQL"
    echo "   - JWT_SECRET: ganti dengan random string"
    echo ""
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup database
echo ""
echo "🗄️  Setting up database..."
npm run setup-db

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Terminal 1 - Start Backend:"
echo "   npm run dev"
echo ""
echo "2. Terminal 2 - Start Frontend:"
echo "   cd client && npm run dev"
echo ""
echo "3. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "4. Login dengan:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  CHANGE PASSWORD ADMIN IMMEDIATELY!"
echo ""
