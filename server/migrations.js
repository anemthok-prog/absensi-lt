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

  // ===== Tabel inti (users, absensi, audit_log) =====
  // Dibuat di sini juga (idempotent) supaya bisa jalan ke DATABASE_URL/hosted
  // tanpa harus pakai setup-db.js yang butuh DB_* + CREATE DATABASE.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      nip VARCHAR(20),
      role VARCHAR(20) NOT NULL DEFAULT 'guru',
      kelas VARCHAR(10),
      jabatan VARCHAR(50),
      no_hp VARCHAR(15),
      foto_profil VARCHAR(255),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS absensi (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tanggal DATE NOT NULL,
      hari VARCHAR(10) NOT NULL,
      shift VARCHAR(20) NOT NULL,
      kelas VARCHAR(10),
      status VARCHAR(20) NOT NULL,
      foto_kegiatan VARCHAR(255),
      catatan TEXT,
      lokasi_gps VARCHAR(100),
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, tanggal, shift)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      table_name VARCHAR(50),
      record_id INTEGER,
      old_data JSONB,
      new_data JSONB,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_absensi_user_id ON absensi(user_id);
    CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
  `);

  console.log('✓ Migrations ready (password_resets, kelas, shift, users, absensi, audit_log)');

  // ===== Fitur JADWAL (layanan tambahan / FDS) =====
  // guru_map: pemetaan kode (dari PDF jadwal) -> guru + jenis layanan
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guru_map (
      id SERIAL PRIMARY KEY,
      kode VARCHAR(10) UNIQUE NOT NULL,
      nama_guru VARCHAR(160) NOT NULL,
      jenis_layanan VARCHAR(120),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // jadwal: (hari, jam, kelas) -> kode guru (NULL untuk aktivitas khusus: Olim/Ekstra/Pramuka)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jadwal (
      id SERIAL PRIMARY KEY,
      hari VARCHAR(12) NOT NULL,
      jam VARCHAR(20) NOT NULL,
      kelas VARCHAR(12) NOT NULL,
      kode_guru VARCHAR(10) REFERENCES guru_map(kode) ON DELETE CASCADE,
      keterangan VARCHAR(120),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(hari, jam, kelas)
    );
  `);
  // Backward-compat: kalau kolom sudah ada dengan NOT NULL dari versi lama, longgarkan.
  await pool.query(`ALTER TABLE jadwal ALTER COLUMN kode_guru DROP NOT NULL`);

  // Link akun user -> guru_map (biar jadwal sesuai nama guru PDF)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS guru_map_kode VARCHAR(10)`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_users_guru_map ON users(guru_map_kode)`
  );

  // Bootstrap admin pertama — hanya jika ADMIN_PASSWORD di-set (anti default-cred lemah)
  const bcrypt = require('bcryptjs');
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  if (adminPassword) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO users (username, email, password, full_name, role, status)
       VALUES ($1, $2, $3, $4, 'admin', 'active')
       ON CONFLICT (username) DO NOTHING`,
      [adminUsername, `${adminUsername}@mtsn1kebumen.id`, hashed, 'Administrator']
    );
    console.log(`✓ Admin siap (username: ${adminUsername})`);
  } else {
    console.log('⚠️  ADMIN_PASSWORD belum diset — akun admin TIDAK dibuat otomatis.');
  }

  // Auto-seed data jadwal (guru_map + jadwal) kalau masih kosong — biar app langsung kebuka
  // dengan jadwal dari PDF pas deploy. Idempotent.
  const { GURU_MAP, JADWAL } = require('./data/jadwal-data');
  const { rows: [{ c: gmCount }] } = await pool.query('SELECT COUNT(*)::int AS c FROM guru_map');
  if (gmCount === 0) {
    for (const [kode, nama, jenis] of GURU_MAP) {
      await pool.query(`INSERT INTO guru_map (kode, nama_guru, jenis_layanan) VALUES ($1,$2,$3) ON CONFLICT (kode) DO NOTHING`, [kode, nama, jenis]);
    }
    for (const [hari, jam, kelas, kode, ket] of JADWAL) {
      await pool.query(`INSERT INTO jadwal (hari, jam, kelas, kode_guru, keterangan) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (hari, jam, kelas) DO NOTHING`, [hari, jam, kelas, kode, ket]);
    }
    console.log(`✓ Auto-seed jadwal: ${GURU_MAP.length} guru_map + ${JADWAL.length} baris jadwal`);
  }
  // Auto-buat akun guru dari guru_map kalau GURU_DEFAULT_PASSWORD di-set (biar guru PDF bisa login utk tes)
  const guruPw = process.env.GURU_DEFAULT_PASSWORD;
  if (guruPw && guruPw.length >= 8) {
    const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
    let created = 0;
    for (const [kode, nama] of GURU_MAP) {
      const namaBersih = nama.split(',')[0].trim();
      const uname = slug(namaBersih) || ('guru.' + kode.toLowerCase());
      const exists = await pool.query('SELECT id FROM users WHERE guru_map_kode = $1', [kode]);
      if (exists.rowCount > 0) continue;
      const hashed = await bcrypt.hash(guruPw, 10);
      const r = await pool.query(
        `INSERT INTO users (username, email, password, full_name, role, status, guru_map_kode)
         VALUES ($1,$2,$3,$4,'guru','active',$5) ON CONFLICT (username) DO NOTHING`,
        [uname, `${uname}@mtsn1kebumen.id`, hashed, namaBersih, kode]
      );
      if (r.rowCount > 0) created++;
    }
    if (created) console.log(`✓ Auto-buat akun guru (password dari GURU_DEFAULT_PASSWORD): ${created}`);
  }
}

module.exports = { runMigrations };
