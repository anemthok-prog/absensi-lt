import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  ClipboardText,
  CheckCircle,
  ArrowRight,
  Warning,
  ClockCounterClockwise,
  ListBullets,
  ShieldCheck,
} from '@phosphor-icons/react'
import api from '../../api'
import Layout from '../../components/Layout'
import './AdminDashboard.css'

function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  const today = stats.today || {}
  const trend = stats.trend || []
  const maxTrend = Math.max(1, ...trend.map((t) => t.count))
  const notSubmitted = stats.notSubmitted || []

  const statusChips = [
    { key: 'hadir', label: 'Hadir', color: 'var(--status-hadir)' },
    { key: 'sakit', label: 'Sakit', color: 'var(--status-sakit)' },
    { key: 'izin', label: 'Izin', color: 'var(--status-izin)' },
    { key: 'alpa', label: 'Alpa', color: 'var(--status-alpa)' },
  ]

  return (
    <Layout user={user} onLogout={onLogout} role="admin" active="dashboard">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <span className="page-header-sub">Monitoring aktivitas & kehadiran hari ini</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent-teal">
          <div className="stat-row">
            <span className="stat-label">Total Pengguna</span>
            <span className="stat-chip"><Users weight="duotone" /></span>
          </div>
          <div className="stat-value">{stats.totalUsers || 0}</div>
        </div>
        <div className="stat-card accent-user">
          <div className="stat-row">
            <span className="stat-label">Total Guru</span>
            <span className="stat-chip"><Users weight="duotone" /></span>
          </div>
          <div className="stat-value">{stats.totalGuru || 0}</div>
        </div>
        <div className="stat-card accent-info">
          <div className="stat-row">
            <span className="stat-label">Absensi Hari Ini</span>
            <span className="stat-chip"><ClockCounterClockwise weight="duotone" /></span>
          </div>
          <div className="stat-value">{today.total || 0}</div>
        </div>
        <div className="stat-card accent-brand">
          <div className="stat-row">
            <span className="stat-label">Hadir Hari Ini</span>
            <span className="stat-chip"><CheckCircle weight="duotone" /></span>
          </div>
          <div className="stat-value">{today.hadir || 0}</div>
        </div>
      </div>

      <div className="dash-cols">
        <div className="card dash-panel">
          <h2>Status Hari Ini</h2>
          <div className="status-chips">
            {statusChips.map((s) => (
              <div className="status-chip" key={s.key}>
                <span className="dot" style={{ background: s.color }} />
                <span className="chip-label">{s.label}</span>
                <span className="chip-value" style={{ color: s.color }}>{today[s.key] || 0}</span>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: '22px' }}>Tren 7 Hari Terakhir</h2>
          <div className="trend-bars">
            {trend.map((t) => (
              <div className="trend-col" key={t.tanggal} title={`${t.tanggal}: ${t.count} absensi`}>
                <span className="trend-value">{t.count}</span>
                <div className="trend-bar" style={{ height: `${(t.count / maxTrend) * 100}%` }} />
                <span className="trend-label">{t.tanggal.slice(8, 10)}/{t.tanggal.slice(5, 7)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card dash-panel">
          <h2>
            <Warning weight="duotone" /> Guru Belum Input ({notSubmitted.length})
          </h2>
          {notSubmitted.length > 0 ? (
            <ul className="not-submitted">
              {notSubmitted.map((g) => (
                <li key={g.id}>
                  <span className="ns-name">{g.full_name || g.username}</span>
                  {g.username && <span className="ns-user">@{g.username}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ns-empty">Semua guru sudah input absensi hari ini 🎉</p>
          )}
        </div>
      </div>

      <div className="admin-actions">
        <div className="action-card" onClick={() => navigate('/admin/users')}>
          <div className="action-icon"><Users weight="duotone" /></div>
          <h3>Manajemen Guru</h3>
          <p>Kelola akun guru dan data pribadi</p>
          <button className="btn btn-secondary">Kelola <ArrowRight weight="bold" /></button>
        </div>
        <div className="action-card" onClick={() => navigate('/admin/absensi')}>
          <div className="action-icon"><ClipboardText weight="duotone" /></div>
          <h3>Data Absensi</h3>
          <p>Lihat dan kelola data absensi</p>
          <button className="btn btn-secondary">Lihat <ArrowRight weight="bold" /></button>
        </div>
        <div className="action-card" onClick={() => navigate('/admin/kelas')}>
          <div className="action-icon"><ListBullets weight="duotone" /></div>
          <h3>Kelola Kelas</h3>
          <p>Atur kelas & shift untuk input absensi</p>
          <button className="btn btn-secondary">Kelola <ArrowRight weight="bold" /></button>
        </div>
        <div className="action-card" onClick={() => navigate('/admin/audit')}>
          <div className="action-icon"><ShieldCheck weight="duotone" /></div>
          <h3>Audit Log</h3>
          <p>Jejak aktivitas pengguna</p>
          <button className="btn btn-secondary">Lihat <ArrowRight weight="bold" /></button>
        </div>
      </div>
    </Layout>
  )
}

export default AdminDashboard
