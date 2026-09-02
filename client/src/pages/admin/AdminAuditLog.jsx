import React, { useState, useEffect } from 'react'
import { CaretLeft, CaretRight, ShieldCheck } from '@phosphor-icons/react'
import api from '../../api'
import Layout from '../../components/Layout'
import './AdminAuditLog.css'

const ACTION_LABEL = {
  LOGIN: 'Login',
  CREATE: 'Tambah',
  UPDATE: 'Ubah',
  DELETE: 'Hapus',
  RESET_PASSWORD: 'Reset Password',
  ACTIVATE: 'Aktifkan',
  DEACTIVATE: 'Nonaktifkan',
}

const ACTION_COLOR = {
  LOGIN: 'accent',
  CREATE: 'ok',
  UPDATE: 'accent',
  DELETE: 'danger',
  RESET_PASSWORD: 'warn',
  ACTIVATE: 'ok',
  DEACTIVATE: 'warn',
}

function fmtWaktu(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function AdminAuditLog({ user, onLogout }) {
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    fetchLogs()
  }, [page])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}`)
      setLogs(res.data.logs || [])
      setTotal(res.data.pagination?.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const pages = Math.ceil(total / limit)

  return (
    <Layout user={user} onLogout={onLogout} role="admin" active="audit">
      <div className="page-header">
        <h1>Audit Log</h1>
        <span className="page-header-sub">Jejak aktivitas pengguna di sistem</span>
      </div>

      <div className="card">
        {loading ? (
          <p className="audit-loading">Memuat data...</p>
        ) : logs.length > 0 ? (
          <div className="users-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Objek</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="audit-time">{fmtWaktu(l.created_at)}</td>
                    <td><strong>{l.username || '-'}</strong></td>
                    <td>
                      <span className={`audit-badge audit-${ACTION_COLOR[l.action] || 'accent'}`}>
                        {ACTION_LABEL[l.action] || l.action}
                      </span>
                    </td>
                    <td><code>{l.table_name || '-'} #{l.record_id || '-'}</code></td>
                    <td className="audit-ip">{l.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="audit-loading"><ShieldCheck weight="duotone" /> Belum ada aktivitas tercatat.</p>
        )}

        {total > limit && (
          <div className="pagination" style={{ marginTop: '20px' }}>
            <button onClick={() => setPage(Math.max(1, page - 1))} className="btn btn-secondary" disabled={page === 1}>
              <CaretLeft weight="bold" /> Sebelumnya
            </button>
            <span className="page-info">Halaman {page} dari {pages}</span>
            <button onClick={() => setPage(page + 1)} className="btn btn-secondary" disabled={page >= pages}>
              Berikutnya <CaretRight weight="bold" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminAuditLog
