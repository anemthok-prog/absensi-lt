const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Semua route jadwal butuh login
router.use(verifyToken);

// GET /api/jadwal/guru-map — daftar guru sesuai jadwal (kode -> guru -> jenis layanan)
router.get('/guru-map', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT kode, nama_guru, jenis_layanan FROM guru_map ORDER BY kode'
    );
    res.json(rows);
  } catch (err) {
    console.error('guru-map error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// GET /api/jadwal/saya — jadwal milik user yang login (berdasarkan link guru_map_kode)
router.get('/saya', async (req, res) => {
  try {
    const me = await pool.query('SELECT guru_map_kode FROM users WHERE id = $1', [req.user.id]);
    const kode = me.rows[0]?.guru_map_kode;
    if (!kode) return res.json([]);
    const { rows } = await pool.query(
      `SELECT j.id, j.hari, j.jam, j.kelas, j.kode_guru, j.keterangan,
              g.nama_guru, g.jenis_layanan
       FROM jadwal j
       LEFT JOIN guru_map g ON g.kode = j.kode_guru
       WHERE j.kode_guru = $1
       ORDER BY j.hari, j.jam, j.kelas`,
      [kode]
    );
    res.json(rows);
  } catch (err) {
    console.error('jadwal saya error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// GET /api/jadwal — grid jadwal (opsional filter ?hari=&kelas=), join guru_map
router.get('/', async (req, res) => {
  try {
    const { hari, kelas } = req.query;
    let sql = `
      SELECT j.id, j.hari, j.jam, j.kelas, j.kode_guru, j.keterangan,
             g.nama_guru, g.jenis_layanan
      FROM jadwal j
      LEFT JOIN guru_map g ON g.kode = j.kode_guru
      WHERE 1=1
    `;
    const params = [];
    if (hari) { params.push(hari); sql += ` AND j.hari = $${params.length}`; }
    if (kelas) { params.push(kelas); sql += ` AND j.kelas = $${params.length}`; }
    sql += ' ORDER BY j.hari, j.jam, j.kelas';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('jadwal error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

module.exports = router;
