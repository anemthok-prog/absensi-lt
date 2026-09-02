const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { verifyToken, isAdmin, auditLog } = require('../middleware/auth');

const router = express.Router();

// Create new user (guru) — admin only
router.post('/users', verifyToken, isAdmin, [
  body('username').isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
  body('full_name').notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('role').optional().isIn(['guru', 'admin']).withMessage('Role tidak valid'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    const { username, email, password, full_name, nip, kelas, jabatan, no_hp, role } = req.body;

    const dupe = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (dupe.rows.length > 0) {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const targetRole = role === 'admin' ? 'admin' : 'guru';
    const result = await pool.query(
      `INSERT INTO users (username, email, password, full_name, nip, kelas, jabatan, no_hp, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING id, username, email, full_name, nip, role, status`,
      [username, email, hashedPassword, full_name, nip || null, kelas || null, jabatan || null, no_hp || null, targetRole]
    );

    await auditLog('CREATE', 'users', result.rows[0].id, {}, result.rows[0], req);

    res.status(201).json({
      message: targetRole === 'admin' ? 'Admin berhasil ditambahkan' : 'Guru berhasil ditambahkan',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Activate user back (admin only)
router.post('/users/:id/activate', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['active', id]
    );
    await auditLog('ACTIVATE', 'users', id, existing.rows[0], { status: 'active' }, req);
    res.json({ message: 'Pengguna berhasil diaktifkan' });
  } catch (err) {
    console.error('Activate user error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Get all users (admin only)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, email, full_name, nip, role, kelas, jabatan, no_hp, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = $' + (params.length + 1);
      params.push(role);
    }

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND role = $' + (countParams.length + 1);
      countParams.push(role);
    }

    if (status) {
      countQuery += ' AND status = $' + (countParams.length + 1);
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, username, email, full_name, nip, role, kelas, jabatan, no_hp, status, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Update user (admin only)
router.put('/users/:id', verifyToken, isAdmin, [
  body('full_name').notEmpty().withMessage('Full name required'),
  body('username').isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('kelas').optional(),
  body('jabatan').optional(),
  body('no_hp').optional(),
  body('role').optional().isIn(['guru', 'admin']).withMessage('Role tidak valid'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { username, email, full_name, kelas, jabatan, no_hp, role, status } = req.body;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Jangan izinkan admin mengubah role sendiri (hindari kehilangan akses)
    if (role && role !== existing.rows[0].role && id == req.user.id) {
      return res.status(400).json({ message: 'Tidak bisa mengubah role Anda sendiri' });
    }

    // Cek duplikat username/email (kecuali user yang sedang diedit)
    const dupe = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id <> $3',
      [username, email, id]
    );
    if (dupe.rows.length > 0) {
      return res.status(400).json({ message: 'Username atau email sudah digunakan oleh pengguna lain' });
    }

    const targetRole = role || existing.rows[0].role;
    const result = await pool.query(
      `UPDATE users SET username = $1, email = $2, full_name = $3, kelas = $4, jabatan = $5, no_hp = $6, status = $7, role = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, username, email, full_name, nip, role, kelas, jabatan, no_hp, status, foto_profil`,
      [username, email, full_name, kelas || null, jabatan || null, no_hp || null, status || 'active', targetRole, id]
    );

    await auditLog('UPDATE', 'users', id, existing.rows[0], result.rows[0], req);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Reset user password (admin only)
router.post('/users/:id/reset-password', verifyToken, isAdmin, [
  body('newPassword').isLength({ min: 8 }).withMessage('Password min 8 char'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );

    await auditLog('RESET_PASSWORD', 'users', id, {}, { id }, req);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Deactivate user (admin only)
router.post('/users/:id/deactivate', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deactivation
    if (id == req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['inactive', id]
    );

    await auditLog('DEACTIVATE', 'users', id, existing.rows[0], { status: 'inactive' }, req);

    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    console.error('Deactivate user error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Get statistics (admin only)
router.get('/stats/summary', verifyToken, isAdmin, async (req, res) => {
  try {
    const [usersCount, guruCount, absensiCount, hadir] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['guru']),
      pool.query('SELECT COUNT(*) FROM absensi'),
      pool.query('SELECT COUNT(*) FROM absensi WHERE status = $1', ['hadir']),
    ]);

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalGuru: parseInt(guruCount.rows[0].count),
      totalAbsensi: parseInt(absensiCount.rows[0].count),
      totalHadir: parseInt(hadir.rows[0].count),
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Get audit logs (admin only)
router.get('/audit-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT a.*, u.username FROM audit_log a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM audit_log');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      logs: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Jangan hapus diri sendiri
    if (id == req.user.id) {
      return res.status(400).json({ message: 'Tidak bisa menghapus akun sendiri' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Hapus data absensi milik user lalu user-nya
      await client.query('DELETE FROM absensi WHERE user_id = $1', [id]);
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await auditLog('DELETE', 'users', id, existing.rows[0], { id, username: existing.rows[0].username }, req);
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

// Get admin dashboard (monitoring) — admin only
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const t = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [users, gurus, tToday, hadir, sakit, izin, alpa] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM users'),
      pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role = 'guru'"),
      pool.query('SELECT COUNT(*)::int AS c FROM absensi WHERE tanggal = $1', [t]),
      pool.query("SELECT COUNT(*)::int AS c FROM absensi WHERE tanggal = $1 AND status = 'hadir'", [t]),
      pool.query("SELECT COUNT(*)::int AS c FROM absensi WHERE tanggal = $1 AND status = 'sakit'", [t]),
      pool.query("SELECT COUNT(*)::int AS c FROM absensi WHERE tanggal = $1 AND status = 'izin'", [t]),
      pool.query("SELECT COUNT(*)::int AS c FROM absensi WHERE tanggal = $1 AND status = 'alpa'", [t]),
    ]);

    // Guru aktif yang belum input absensi hari ini
    const notSubmitted = await pool.query(
      `SELECT u.id, u.full_name, u.username, u.no_hp FROM users u
       WHERE u.role = 'guru' AND u.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM absensi a WHERE a.user_id = u.id AND a.tanggal = $1)
       ORDER BY u.full_name`, [t]
    );

    // Tren 7 hari terakhir
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const c = await pool.query('SELECT COUNT(*)::int AS c FROM absensi WHERE tanggal = $1', [ds]);
      trend.push({ tanggal: ds, count: c.rows[0].c });
    }

    res.json({
      totalUsers: users.rows[0].c,
      totalGuru: gurus.rows[0].c,
      today: {
        total: tToday.rows[0].c,
        hadir: hadir.rows[0].c,
        sakit: sakit.rows[0].c,
        izin: izin.rows[0].c,
        alpa: alpa.rows[0].c,
      },
      notSubmitted: notSubmitted.rows,
      trend,
    });
  } catch (err) {
    console.error('Get admin dashboard error:', err);
    res.status(500).json({ message: 'Kesalahan server' });
  }
});

module.exports = router;
