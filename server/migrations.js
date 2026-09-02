const pool = require('./db');

// Migrasi idempotent — jalan tiap server start, aman dipanggil berulang.
async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      attempts INTEGER DEFAULT 0,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
  `);

  // Tabel kelas (dinamis, dikelola admin) — idempotent
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kelas (
      id SERIAL PRIMARY KEY,
      nama VARCHAR(10) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed 30 kelas default (7A..9J) hanya kalau tabel kosong
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM kelas');
  if (rows[0].c === 0) {
    const names = [7, 8, 9].flatMap((g) =>
      'ABCDEFGHIJ'.split('').map((l) => `${g}${l}`)
    );
    for (const n of names) {
      await pool.query('INSERT INTO kelas (nama) VALUES ($1) ON CONFLICT (nama) DO NOTHING', [n]);
    }
    console.log('✓ Seed kelas default: ' + names.length);
  }

  console.log('✓ Migrations ready (password_resets, kelas)');

  // Tabel shift (dinamis, dikelola admin)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shift (
      id SERIAL PRIMARY KEY,
      nama VARCHAR(20) NOT NULL UNIQUE,
      urutan INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const { rows: shr } = await pool.query('SELECT COUNT(*)::int AS c FROM shift');
  if (shr[0].c === 0) {
    await pool.query(`INSERT INTO shift (nama, urutan) VALUES ('siang', 1), ('malam', 2) ON CONFLICT (nama) DO NOTHING`);
    console.log('✓ Seed shift default: siang, malam');
  }
  console.log('✓ Migrations ready (password_resets, kelas, shift)');
}

module.exports = { runMigrations };
