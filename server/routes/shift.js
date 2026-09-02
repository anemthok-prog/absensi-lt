const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { verifyToken, isGuruOrAdmin, isAdmin, auditLog } = require('../middleware/auth');

const router = express.Router();

// List semua shift — guru & admin
router.get('/', verifyToken, isGuruOrAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nama FROM shift ORDER BY urutan, nama');
    res.json({ shift: result.rows });
  } catch (err) {
    console.error('Get shift error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Tambah shift — admin
router.post('/', verifyToken, isAdmin, [
  body('nama').notEmpty().withMessage('Nama shift wajib diisi').isLength({ max: 20 }).withMessage('Maks 20 karakter'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  try {
    const { nama } = req.body;
    const clean = nama.trim().toLowerCase();
    const order = await pool.query('SELECT COALESCE(MAX(urutan),0)+1 AS u FROM shift');
    try {
      const result = await pool.query('INSERT INTO shift (nama, urutan) VALUES ($1, $2) RETURNING id, nama', [clean, order.rows[0].u]);
      await auditLog('CREATE', 'shift', result.rows[0].id, {}, result.rows[0], req);
      res.status(201).json({ message: 'Shift ditambahkan', shift: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ message: 'Shift sudah ada' });
      throw err;
    }
  } catch (err) {
    console.error('Create shift error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Ubah shift — admin
router.put('/:id', verifyToken, isAdmin, [
  body('nama').notEmpty().withMessage('Nama shift wajib diisi').isLength({ max: 20 }).withMessage('Maks 20 karakter'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  try {
    const { id } = req.params;
    const { nama } = req.body;
    const clean = nama.trim().toLowerCase();
    const existing = await pool.query('SELECT * FROM shift WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Shift tidak ditemukan' });
    try {
      const result = await pool.query('UPDATE shift SET nama = $1 WHERE id = $2 RETURNING id, nama', [clean, id]);
      await auditLog('UPDATE', 'shift', id, existing.rows[0], result.rows[0], req);
      res.json({ message: 'Shift diperbarui', shift: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ message: 'Nama shift sudah ada' });
      throw err;
    }
  } catch (err) {
    console.error('Update shift error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Hapus shift — admin
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM shift WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Shift tidak ditemukan' });

    const used = await pool.query('SELECT COUNT(*)::int AS c FROM absensi WHERE shift = $1', [existing.rows[0].nama]);
    if (used.rows[0].c > 0) {
      return res.status(400).json({ message: `Shift masih dipakai ${used.rows[0].c} data absensi. Ganti dulu.` });
    }

    await pool.query('DELETE FROM shift WHERE id = $1', [id]);
    await auditLog('DELETE', 'shift', id, existing.rows[0], {}, req);
    res.json({ message: 'Shift dihapus' });
  } catch (err) {
    console.error('Delete shift error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

module.exports = router;
