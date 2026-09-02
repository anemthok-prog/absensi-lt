# Setup PostgreSQL untuk Absensi LT MTsN 1

## macOS (Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start service
brew services start postgresql@15

# Verify installation
psql --version
```

## Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Windows

Download dari: https://www.postgresql.org/download/windows/

## Verify Installation

```bash
# Connect to PostgreSQL
psql -U postgres

# Dalam psql shell:
\l                    # List databases
\q                    # Quit

# Test connection from Node.js
cd /Users/anm/Desktop/absensi-lt-mtsn1
npm run setup-db
```

## Default PostgreSQL User

- Username: `postgres`
- Password: (empty atau set saat install)

## Troubleshoot

### "psql: command not found"
```bash
# Add PostgreSQL to PATH (macOS)
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Connection refused
```bash
# Check if PostgreSQL is running
brew services list              # macOS
sudo systemctl status postgresql # Linux

# Restart service
brew services restart postgresql@15  # macOS
sudo systemctl restart postgresql   # Linux
```

### Can't connect as postgres user
```bash
# Create postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"

# Update .env file with new password
```

---

Setelah PostgreSQL jalan, jalankan:
```bash
cd /Users/anm/Desktop/absensi-lt-mtsn1
npm run setup-db
```
