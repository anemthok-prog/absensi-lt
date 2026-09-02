import React, { useState, useEffect } from 'react'
import {
  ClipboardText,
  CheckCircle,
  FirstAidKit,
  HandWaving,
  XCircle,
  DownloadSimple,
  CaretLeft,
  CaretRight,
  Trash,
  Image,
} from '@phosphor-icons/react'
import api from '../../api'
import Layout from '../../components/Layout'
import { exportXlsx } from '../../utils/export'
import { NAMA_BULAN } from '../../constants'

// Format jam dari created_at → "HH:MM" (lokal)
const pad2 = (n) => String(n).padStart(2, '0')
const fmtJam = (iso) => {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

import './AdminAbsensi.css'

function AdminAbsensi({ user, onLogout }) {
  const [absensi, setAbsensi] = useState([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [guruId, setGuruId] = useState('')
  const [gurus, setGurus] = useState([])

  useEffect(() => {
    fetchAbsensi()
  }, [bulan, tahun, page, guruId])

  // Ambil daftar guru untuk filter rekap per guru
  useEffect(() => {
    api.get('/admin/users?role=guru&limit=200')
      .then((res) => setGurus(res.data.users || []))
      .catch(() => {})
  }, [])

  const fetchAbsensi = async () => {
    try {
      setLoading(true)
      const guruParam = guruId ? `&user_id=${guruId}` : ''
      const response = await api.get(`/absensi?bulan=${bulan}&tahun=${tahun}&page=${page}&limit=30${guruParam}`)
      setAbsensi(response.data.absensi)
    } catch (err) {
      console.error('Error fetching absensi:', err)
      setMessage(err.response?.data?.message || 'Error loading data')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (absensiId) => {
    if (!window.confirm('Hapus data absensi ini?')) {
      return
    }

    try {
      await api.delete(`/absensi/${absensiId}`)
      setMessage('Data absensi berhasil dihapus')
      setMessageType('success')
      fetchAbsensi()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error deleting absensi')
      setMessageType('error')
    }
  }

  const exportReportFile = () => {
    if (absensi.length === 0) {
      setMessage('Tidak ada data untuk diekspor')
      setMessageType('error')
      return
    }

    const columns = ['Tanggal', 'Jam', 'Hari', 'Shift', 'Kelas', 'Guru', 'Status', 'Catatan']
    const rows = absensi.map(a => [
      new Date(a.tanggal).toLocaleDateString('id-ID'),
      fmtJam(a.created_at),
      a.hari,
      a.shift,
      a.kelas,
      a.guru_nama || '',
      a.status,
      a.catatan || '',
    ])
    exportXlsx({
      fileName: `laporan-absensi-${bulan}-${tahun}.xlsx`,
      title: 'Laporan Data Absensi',
      subtitle: `MTsN 1 Kebumen · Panel Admin · ${NAMA_BULAN[bulan - 1]} ${tahun}`,
      owner: user?.full_name,
      columns,
      rows,
      statusCols: [6],
    })
  }

  const bulanList = [
    { val: 1, label: 'Januari' },
    { val: 2, label: 'Februari' },
    { val: 3, label: 'Maret' },
    { val: 4, label: 'April' },
    { val: 5, label: 'Mei' },
    { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' },
    { val: 8, label: 'Agustus' },
    { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' },
    { val: 11, label: 'November' },
    { val: 12, label: 'Desember' },
  ]

  const summary = [
    { label: 'Total', value: absensi.length, icon: ClipboardText },
    { label: 'Hadir', value: absensi.filter(a => a.status === 'hadir').length, icon: CheckCircle },
    { label: 'Sakit', value: absensi.filter(a => a.status === 'sakit').length, icon: FirstAidKit },
    { label: 'Izin', value: absensi.filter(a => a.status === 'izin').length, icon: HandWaving },
    { label: 'Alpa', value: absensi.filter(a => a.status === 'alpa').length, icon: XCircle },
  ]

  return (
    <Layout user={user} onLogout={onLogout} role="admin" active="absensi">
      <div className="page-header">
        <h1>Data Absensi</h1>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="filter-export-section">
          <div className="filter-group">
            <label>Bulan</label>
            <select value={bulan} onChange={(e) => { setBulan(parseInt(e.target.value)); setPage(1); }}>
              {bulanList.map(b => (
                <option key={b.val} value={b.val}>{b.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Tahun</label>
            <select value={tahun} onChange={(e) => { setTahun(parseInt(e.target.value)); setPage(1); }}>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Guru</label>
            <select value={guruId} onChange={(e) => { setGuruId(e.target.value); setPage(1); }}>
              <option value="">Semua Guru</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.id}>{g.full_name || g.username}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={exportReportFile} disabled={absensi.length === 0}>
            <DownloadSimple weight="duotone" /> Ekspor Laporan
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Loading...</p>
        ) : absensi.length > 0 ? (
          <>
            <div className="absensi-table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jam</th>
                    <th>Hari</th>
                    <th>Shift</th>
                    <th>Kelas</th>
                    <th>Guru</th>
                    <th>Status</th>
                    <th className="hide-mobile">Catatan</th>
                    <th>Foto</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {absensi.map((abs) => (
                    <tr key={abs.id}>
                      <td>{new Date(abs.tanggal).toLocaleDateString('id-ID')}</td>
                      <td>{fmtJam(abs.created_at)}</td>
                      <td>{abs.hari}</td>
                      <td className="capitalize">{abs.shift}</td>
                      <td>{abs.kelas}</td>
                      <td>{abs.guru_nama || '-'}</td>
                      <td>
                        <span className={`status-badge status-${abs.status}`}>
                          {abs.status}
                        </span>
                      </td>
                      <td className="catatan-col hide-mobile">{abs.catatan ? abs.catatan.substring(0, 30) + '...' : '-'}</td>
                      <td>
                        {abs.foto_kegiatan ? (
                          <a href={`/uploads/${abs.foto_kegiatan}`} target="_blank" rel="noopener noreferrer" className="photo-icon" title="Lihat foto">
                            <Image weight="duotone" />
                          </a>
                        ) : <span className="photo-none">-</span>}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(abs.id)}
                          className="btn-delete"
                          title="Hapus"
                        >
                          <Trash weight="duotone" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                className="btn btn-secondary"
                disabled={page === 1}
              >
                <CaretLeft weight="bold" /> Sebelumnya
              </button>
              <span className="page-info">Halaman {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                className="btn btn-secondary"
                disabled={absensi.length < 30}
              >
                Berikutnya <CaretRight weight="bold" />
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Tidak ada data absensi untuk periode ini</p>
        )}
      </div>

      <div className="stats-card">
        <h2>Ringkasan</h2>
        <div className="stats-summary">
          {summary.map((s) => {
            const SumIcon = s.icon
            return (
              <div className="summary-item" key={s.label}>
                <span className="label"><SumIcon weight="duotone" /> {s.label}</span>
                <span className="value">{s.value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}

export default AdminAbsensi
