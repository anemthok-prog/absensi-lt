// Seed data JADWAL (layanan tambahan / FDS) — sumber: PDF "Jadwal LT Gasal TA 2026/2027"
// Jalankan: node server/seed-jadwal.js
// - guru_map: kode -> guru + jenis layanan (idempotent upsert)
// - jadwal: (hari, jam, kelas) -> kode guru / keterangan (idempotent, ON CONFLICT DO NOTHING)
// Catatan: baris bentrok (duplikat hari+jam) & sel yang sangat ambigu (gender-split,
// formula, kelompok jenis-layanan) TIDAK di-seed — itu butuh verifikasi manual.

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ==== GURU MAP (dari legend/Keterangan PDF) ====
const GURU_MAP = [
  ['B1', "Mansyur Nurudin, S.Pd.I.", "I'rob"],
  ['B2', "Nafisatul Umamah, S.Pd.", "Hadits (IBS)/Tahfidz (FDS)"],
  ['C1', "Siti Solihah, S.Pd., M.Pd.", "Akhlak"],
  ['C2', "Dinda Amaly Ayyu Humaida", "Akhlak"],
  ['D1', "Mokhamad Arifin, S.Pd.I.", "Hadits"],
  ['D2', "Slamet Riyanto, S.Ag.", "Akhlak dan MI"],
  ['D3', "Radis, S.Pd.", "Akhlak"],
  ['E1', "M. Kholiluddin, S.Ag.", "Tarikh"],
  ['G1', "Yulihadi, S.Pd", "Bahasa Indonesia/Lit Baca Tulis"],
  ['G2', "Rr. Sri Murniayani Tri W., S.Pd", "Bahasa Indonesia/Riset"],
  ['G3', "Taufiqurrohman, S.Pd.", "Bahasa Indonesia/Lit Baca Tulis"],
  ['G4', "Imam Supriyadi, S.Sos", "Bahasa Indonesia/Lit Baca Tulis"],
  ['G5', "Yakino, S.Pd., M.Pd.I.", "Riset"],
  ['G6', "Dian Lukiana, S.Pd., M.Pd.", "Literasi Baca Tulis/Riset"],
  ['H1', "H. M. Harmuzi, S.Ag.", "Nahwu/Fiqih"],
  ['H2', "Irham Basyir, S. Ag., M. Pd.", "Nahwu/Fiqih"],
  ['H3', "Mokh. Istajib, S.Pd.I", "Nahwu/Fiqih"],
  ['H4', "Nurlaila Febriyanti, S.Pd.I.", "Tahfidz"],
  ['I1', "Siti Nur Cahyani, M.Pd.", "Bahasa Inggris/EA 7 FDS"],
  ['I2', "Sakti Dwiastuti, M.Pd.", "Bahasa Inggris/EA 8 FDS"],
  ['I3', "Ari Endah Miyosi, S.Pd.", "Bahasa Inggris"],
  ['I4', "Astri Sugiarti, S.Pd.", "Bahasa Inggris"],
  ['I5', "Sigit Arfian Syah, S.Pd.", "Bahasa Inggris/Infotek"],
  ['J1', "H. M. Ja'far Muzakir, S.Pd.", "Matematika"],
  ['J2', "Tri Isnowati, S. Pd.", "Matematika"],
  ['J3', "Yuli Fitriono, S.Pd, M.Pd.", "Matematika"],
  ['J4', "Yuli Wardani, S.Pd.", "Matematika"],
  ['J5', "Ratri Maret Indriyani M., S.Pd.", "Matematika/Olim"],
  ['J6', "Mugi Febriyanto, S.Pd.", "Matematika/Olim"],
  ['K1', "Bangun Sudibyo, S.Pd.", "IPA"],
  ['K2', "Tri Sartikoningsih, M.Sc.", "IPA"],
  ['K3', "Rini Ariyanti, S.Pd.", "IPA/Olim"],
  ['K4', "Lukman Setiawan, S.Pd.I", "IPA/MI"],
  ['K5', "Wiwik Widhaningsih, S.Pd.", "IPA"],
  ['K6', "Ahmad Nur Asyik, S.Pd.", "IPA/Olim"],
  ['L1', "Dra. Hj. Kriswati, M.Ag", "Olim"],
  ['L5', "Yulia Sari Anggraeni, S.Pd.", "Olim"],
  ['L6', "Ana Pangesti, S.Pd.", "Olim"],
  ['N1', "Eki Sefriyanto, S.Pd.", "OR Prestasi"],
  ['N2', "Yodi Pradana, S.Pd.", "OR Prestasi"],
  ['N3', "Akhmad Amir, S.Pd.", "OR Prestasi"],
  ['O1', "Sugeng Widodo, S.Pd.", "Infotek/Robotik"],
  ['O2', "Sekar Kanti Rahayu, S.Kom.", "Infotek/Robotik"],
  ['P1', "Ahmad Khalwani, S.Pd.", "Nahwu/Fiqih/Khot Imla'"],
  ['Q1', "A. Maskur, S.Pd.I.", "Tahfidz"],
  ['Q2', "Fina Nihayah, S.Pd.", "Tahfidz"],
  ['S1', "M. Sholeh, S.Pd.", "Akhlak"],
  ['S2', "Siti Wahidatul Khasanah, S.Hum", "Nahwu/Fiqih/MI"],
  ['S3', "Syifa Febriola Tiara Cinta", "Tahfidz/MI"],
  ['S4', "Kadaryanto", "MI"],
  ['S5', "Irwan Rudiansyah", "Tajwid"],
  ['S6', "Hanifah Nur Azizah", "Bahasa Inggris/MI"],
  ['S7', "Aldini Aulia Rahmadanti", "Muhadloroh"],
  ['S8', "Farah Dien Rahmana", "Tahfidz"],
  ['S9', "Nahidl Iqbalul Anam, S.Fil.", "Nahwu/Fiqih/Khot Imla'"],
  ['S10', "Mohamad Tamzis, S.Pd.", "Tajwid/Nahwu"],
];

// ==== JADWAL grid (kelas bernama, baris unik & bersih) ====
// [hari, jam, kelas, kode_guru|null, keterangan]
const JADWAL = [
  // Ahad
  ['Ahad', '18.30 - 19.50', '9H', 'B1', null], ['Ahad', '18.30 - 19.50', '9I', 'Q1', null], ['Ahad', '18.30 - 19.50', '9J', 'H1', null],
  // Senin 14.10-15.30
  ['Senin', '14.10 - 15.30', '7D', 'I4', null], ['Senin', '14.10 - 15.30', '7E', 'J4', null],
  ['Senin', '14.10 - 15.30', '8A', 'J1', null], ['Senin', '14.10 - 15.30', '8B', 'I1', null],
  ['Senin', '14.10 - 15.30', '9A', 'J5', null], ['Senin', '14.10 - 15.30', '9B', 'I3', null],
  ['Senin', '14.10 - 15.30', '9C', 'K5', null], ['Senin', '14.10 - 15.30', '9D', 'J2', null],
  ['Senin', '14.10 - 15.30', '9E', 'K6', null], ['Senin', '14.10 - 15.30', '9F', 'G3', null],
  ['Senin', '14.10 - 15.30', '9G', 'J3', null], ['Senin', '14.10 - 15.30', '9H', 'G1', null],
  ['Senin', '14.10 - 15.30', '9I', 'G4', null], ['Senin', '14.10 - 15.30', '9J', 'H2', null],
  // Senin 18.30-19.50
  ['Senin', '18.30 - 19.50', '9H', 'D1', null], ['Senin', '18.30 - 19.50', '9I', 'Q1', null], ['Senin', '18.30 - 19.50', '9J', 'C2', null],
  // Selasa 14.10-15.30
  ['Selasa', '14.10 - 15.30', '7D', 'J2', null], ['Selasa', '14.10 - 15.30', '7E', 'I5', null],
  ['Selasa', '14.10 - 15.30', '8A', 'I3', null], ['Selasa', '14.10 - 15.30', '8B', 'J3', null],
  ['Selasa', '14.10 - 15.30', '9A', 'K6', null], ['Selasa', '14.10 - 15.30', '9B', 'G4', null],
  ['Selasa', '14.10 - 15.30', '9C', 'I1', null], ['Selasa', '14.10 - 15.30', '9D', 'K4', null],
  ['Selasa', '14.10 - 15.30', '9E', 'G6', null], ['Selasa', '14.10 - 15.30', '9F', 'K5', null],
  ['Selasa', '14.10 - 15.30', '9G', 'K2', null], ['Selasa', '14.10 - 15.30', '9H', 'J1', null],
  ['Selasa', '14.10 - 15.30', '9I', 'J6', null], ['Selasa', '14.10 - 15.30', '9J', 'J5', null],
  // Selasa 18.30-19.50
  ['Selasa', '18.30 - 19.50', '9H', 'Q1', null], ['Selasa', '18.30 - 19.50', '9I', 'H1', null], ['Selasa', '18.30 - 19.50', '9J', 'B2', null],
  // Rabu 18.30-19.50 (7D/8A = sel kombinasi -> kode + keterangan)
  ['Rabu', '18.30 - 19.50', '7D', 'I1', 'EA'], ['Rabu', '18.30 - 19.50', '8A', 'O2', 'Infotek'],
  ['Rabu', '18.30 - 19.50', '9H', 'C2', null], ['Rabu', '18.30 - 19.50', '9I', 'B1', null], ['Rabu', '18.30 - 19.50', '9J', 'S8', null],
  // Rabu 14.10-15.30 (Ekstra; 7D-8B = OLIM)
  ['Rabu', '14.10 - 15.30', '7D', null, 'OLIM'], ['Rabu', '14.10 - 15.30', '7E', null, 'OLIM'],
  ['Rabu', '14.10 - 15.30', '8A', null, 'OLIM'], ['Rabu', '14.10 - 15.30', '8B', null, 'OLIM'],
  ['Rabu', '14.10 - 15.30', '9A', 'H4', null], ['Rabu', '14.10 - 15.30', '9B', 'K3', null],
  ['Rabu', '14.10 - 15.30', '9C', 'G2', null], ['Rabu', '14.10 - 15.30', '9D', 'I5', null],
  ['Rabu', '14.10 - 15.30', '9E', 'I4', null], ['Rabu', '14.10 - 15.30', '9F', 'J3', null],
  ['Rabu', '14.10 - 15.30', '9G', 'G1', null], ['Rabu', '14.10 - 15.30', '9H', 'I1', null],
  ['Rabu', '14.10 - 15.30', '9I', 'D2', null], ['Rabu', '14.10 - 15.30', '9J', 'G3', null],
  // Jumat 14.00-15.20
  ['Jumat', '14.00 - 15.20', '9C', 'I5', null], ['Jumat', '14.00 - 15.20', '9D', 'G2', null],
  ['Jumat', '14.00 - 15.20', '9E', 'Q1', null], ['Jumat', '14.00 - 15.20', '9F', 'I3', null],
  ['Jumat', '14.00 - 15.20', '9G', 'N3', null],
];

async function seed() {
  // Guru map
  for (const [kode, nama, jenis] of GURU_MAP) {
    await pool.query(
      `INSERT INTO guru_map (kode, nama_guru, jenis_layanan)
       VALUES ($1, $2, $3)
       ON CONFLICT (kode) DO UPDATE SET nama_guru = EXCLUDED.nama_guru, jenis_layanan = EXCLUDED.jenis_layanan`,
      [kode, nama, jenis]
    );
  }
  const { rows: [{ c: cGuru }] } = await pool.query('SELECT COUNT(*)::int AS c FROM guru_map');
  console.log(`✓ Guru map: ${cGuru} entri`);

  // Jadwal grid
  let inserted = 0;
  for (const [hari, jam, kelas, kode, ket] of JADWAL) {
    const r = await pool.query(
      `INSERT INTO jadwal (hari, jam, kelas, kode_guru, keterangan)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (hari, jam, kelas) DO UPDATE SET kode_guru = EXCLUDED.kode_guru, keterangan = EXCLUDED.keterangan`,
      [hari, jam, kelas, kode, ket]
    );
    inserted += r.rowCount;
  }
  const { rows: [{ c: cJadwal }] } = await pool.query('SELECT COUNT(*)::int AS c FROM jadwal');
  console.log(`✓ Jadwal: ${cJadwal} baris (seed terproses: ${inserted})`);

  // ==== Buat akun guru dari guru_map (data guru yang bisa akses) ====
  // GURU_DEFAULT_PASSWORD WAJIB di-set — TANPA itu, akun guru TIDAK dibuat (hindari password
  // default yang mudah ditebak). Data guru_map + jadwal tetap di-seed.
  const bcrypt = require('bcryptjs');
  const DEFAULT_PW = process.env.GURU_DEFAULT_PASSWORD;
  if (!DEFAULT_PW || DEFAULT_PW.length < 8) {
    console.log('⚠️ GURU_DEFAULT_PASSWORD belum di-set (min 8 karakter) — akun guru SKIP. Data jadwal tetap masuk.');
  } else {
    const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
    let linked = 0;
    for (const [kode, nama] of GURU_MAP) {
      const namaBersih = nama.split(',')[0].trim();
      const uname = slug(namaBersih) || ('guru.' + kode.toLowerCase());
      const email = `${uname}@mtsn1kebumen.id`;
      const sudah = await pool.query('SELECT id FROM users WHERE guru_map_kode = $1', [kode]);
      if (sudah.rowCount > 0) { linked++; continue; }
      const hashed = await bcrypt.hash(DEFAULT_PW, 10);
      const r = await pool.query(
        `INSERT INTO users (username, email, password, full_name, role, status, guru_map_kode)
         VALUES ($1, $2, $3, $4, 'guru', 'active', $5)
         ON CONFLICT (username) DO NOTHING`,
        [uname, email, hashed, namaBersih, kode]
      );
      if (r.rowCount > 0) linked++;
    }
    const { rows: [{ c: cLink }] } = await pool.query('SELECT COUNT(*)::int AS c FROM users WHERE guru_map_kode IS NOT NULL');
    console.log(`✓ Akun guru ter-link: ${cLink}`);
  }

  await pool.end();
  console.log('Seed jadwal selesai.');
}

seed().catch((e) => { console.error('Error seeding:', e); process.exit(1); });
