import React, { useState, useEffect } from 'react'
import {
  TrendUp,
  CheckCircle,
  FirstAidKit,
  HandWaving,
  XCircle,
} from '@phosphor-icons/react'
import api from '../api'
import Layout from '../components/Layout'
import './Dashboard.css'

const DAY_NAMES = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [jadwal, setJadwal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  // Ambil statistik; kalau bulan ini kosong, fallback ke bulan lalu agar dashboard tidak kosong
  const fetchData = async () => {
    const now = new Date()
    let m = now.getMonth() + 1
    let y = now.getFullYear()
    try {
      let res = await api.get(`/absensi/stats?bulan=${m}&tahun=${y}`)
      if (res.data.total === 0) {
        m = m === 1 ? 12 : m - 1
        y = m === 12 ? y - 1 : y
        res = await api.get(`/absensi/stats?bulan=${m}&tahun=${y}`)
      }
      setStats(res.data)
      const rec = await api.get('/absensi?limit=5')
      setRecent(rec.data.absensi || [])
      const jw = await api.get('/jadwal/saya')
      setJadwal(jw.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  const cards = [
    { key: 'hadir', label: 'Hadir', icon: CheckCircle, cls: 'hadir' },
    { key: 'sakit', label: 'Sakit', icon: FirstAidKit, cls: 'sakit' },
    { key: 'izin', label: 'Izin', icon: HandWaving, cls: 'izin' },
    { key: 'alpa', label: 'Alpa', icon: XCircle, cls: 'alpa' },
  ]
  const todayName = DAY_NAMES[new Date().getDay()]
  const todayJadwal = jadwal.filter((j) => j.hari === todayName)

  return (
    <Layout user={user} onLogout={onLogout} role={user?.role} active="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-label"><TrendUp weight="duotone" /> Kehadiran</div>
          <div className="value accent">{stats ? stats.persenHadir : 0}%</div>
          <p>{stats ? stats.hadir : 0} dari {stats ? stats.total : 0} hari kerja</p>
        </div>
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div className={`stat-card accent-${c.cls}`} key={c.key}>
              <div className="stat-label"><Icon weight="duotone" /> {c.label}</div>
              <div className={`value status-${c.cls}`}>{stats ? stats[c.key] : 0}</div>
              <p>hari</p>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h2>Jadwal Hari Ini · {todayName}</h2>
        {todayJadwal.length === 0 ? (
          <p className="dash-muted">Tidak ada jadwal hari ini.</p>
        ) : (
          <div className="dash-jadwal">
            {todayJadwal.map((j, i) => (
              <div key={i} className="dash-jadwal-day">
                <span className="dash-jadwal-hari">{j.jam}</span>
                <div className="dash-jadwal-items">
                  <span className="dash-jadwal-item">
                    <strong>{j.kelas}</strong>
                    {j.jenis_layanan && <em> · {j.jenis_layanan}</em>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Absensi Terbaru</h2>
        {recent.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Hari</th>
                <th>Shift</th>
                <th>Kelas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(abs => (
                <tr key={abs.id}>
                  <td>{new Date(abs.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>{abs.hari}</td>
                  <td style={{ textTransform: 'capitalize' }}>{abs.shift}</td>
                  <td>{abs.kelas || '-'}</td>
                  <td>
                    <span className={`status-badge status-${abs.status}`} style={{ textTransform: 'capitalize' }}>
                      {abs.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Belum ada data absensi</p>
        )}
      </div>

    </Layout>
  )
}

export default Dashboard

