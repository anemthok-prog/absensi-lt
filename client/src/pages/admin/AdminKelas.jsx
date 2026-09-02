import React, { useState, useEffect } from 'react'
import { Plus, PencilSimple, Trash, Check, X, ListBullets, ClockClockwise } from '@phosphor-icons/react'
import api from '../../api'
import Layout from '../../components/Layout'
import './AdminKelas.css'

function AdminKelas({ user, onLogout }) {
  const [tab, setTab] = useState('kelas')

  return (
    <Layout user={user} onLogout={onLogout} role="admin" active="kelas">
      <div className="page-header">
        <h1>Kelola Kelas & Shift</h1>
        <span className="page-header-sub">Tambah, ubah, atau hapus kelas & shift absensi</span>
      </div>

      <div className="kelas-tabs">
        <button className={tab === 'kelas' ? 'kelas-tab active' : 'kelas-tab'} onClick={() => setTab('kelas')}>
          <ListBullets weight="duotone" /> Kelas
        </button>
        <button className={tab === 'shift' ? 'kelas-tab active' : 'kelas-tab'} onClick={() => setTab('shift')}>
          <ClockClockwise weight="duotone" /> Shift
        </button>
      </div>

      {tab === 'kelas' && <KelasPanel user={user} onLogout={onLogout} />}
      {tab === 'shift' && <ShiftPanel user={user} onLogout={onLogout} />}
    </Layout>
  )
}

// Reusable list + add + inline edit + delete
function useCrud(endpoint, typeLabel, flash) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [newNama, setNewNama] = useState('')
  const [editId, setEditId] = useState(null)
  const [editNama, setEditNama] = useState('')

  const fetchAll = async () => {
    try {
      const res = await api.get(endpoint)
      setItems(res.data[typeLabel] || [])
    } catch (err) {
      flash('error', 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const add = async (e) => {
    e.preventDefault()
    if (!newNama.trim()) return
    setBusy(true)
    try {
      await api.post(endpoint, { nama: newNama })
      setNewNama('')
      flash('success', 'Berhasil ditambahkan')
      fetchAll()
    } catch (err) {
      flash('error', err.response?.data?.message || 'Gagal menambahkan')
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async () => {
    if (!editNama.trim()) return
    setBusy(true)
    try {
      await api.put(`${endpoint}/${editId}`, { nama: editNama })
      setEditId(null)
      flash('success', 'Berhasil diperbarui')
      fetchAll()
    } catch (err) {
      flash('error', err.response?.data?.message || 'Gagal mengubah')
    } finally {
      setBusy(false)
    }
  }

  const del = async (item) => {
    if (!window.confirm(`Hapus ${item.nama}?`)) return
    setBusy(true)
    try {
      await api.delete(`${endpoint}/${item.id}`)
      flash('success', 'Berhasil dihapus')
      fetchAll()
    } catch (err) {
      flash('error', err.response?.data?.message || 'Gagal menghapus')
    } finally {
      setBusy(false)
    }
  }

  return { items, loading, busy, newNama, setNewNama, editId, editNama, setEditId, setEditNama, add, saveEdit, del }
}

function KelasPanel({ user, onLogout }) {
  const [msg, setMsg] = useState(null)
  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500) }
  const c = useCrud('/kelas', 'kelas', flash)

  return (
    <div className="kelas-panel">
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <div className="kelas-add">
        <form onSubmit={c.add} className="kelas-add-form">
          <input type="text" className="form-control" placeholder="Tambah kelas, contoh: 8B atau 10A"
            value={c.newNama} onChange={(e) => c.setNewNama(e.target.value)} maxLength={10} />
          <button type="submit" className="btn btn-primary" disabled={c.busy}><Plus weight="bold" /> Tambah</button>
        </form>
      </div>
      <div className="card">
        {c.loading ? <div className="loading">Loading...</div> : (
          <table className="table">
            <thead><tr><th>KELAS</th><th className="th-actions">AKSI</th></tr></thead>
            <tbody>
              {c.items.map((k) => (
                <tr key={k.id}>
                  <td>
                    {c.editId === k.id ? (
                      <input type="text" className="form-control" value={c.editNama} onChange={(e) => c.setEditNama(e.target.value)} maxLength={10} autoFocus />
                    ) : (
                      <span className="kelas-name"><ListBullets weight="duotone" /> {k.nama}</span>
                    )}
                  </td>
                  <td className="th-actions">
                    {c.editId === k.id ? (
                      <div className="kelas-actions">
                        <button className="btn btn-sm btn-primary" onClick={c.saveEdit} disabled={c.busy} title="Simpan"><Check weight="bold" /></button>
                        <button className="btn btn-sm btn-secondary" onClick={() => c.setEditId(null)} disabled={c.busy} title="Batal"><X weight="bold" /></button>
                      </div>
                    ) : (
                      <div className="kelas-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => { c.setEditId(k.id); c.setEditNama(k.nama) }} title="Ubah"><PencilSimple weight="bold" /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => c.del(k)} disabled={c.busy} title="Hapus"><Trash weight="bold" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {c.items.length === 0 && <tr><td colSpan="2" className="empty">Belum ada kelas.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ShiftPanel({ user, onLogout }) {
  const [msg, setMsg] = useState(null)
  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500) }
  const c = useCrud('/shift', 'shift', flash)

  return (
    <div className="kelas-panel">
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <div className="kelas-add">
        <form onSubmit={c.add} className="kelas-add-form">
          <input type="text" className="form-control" placeholder="Tambah shift, contoh: pagi atau sore"
            value={c.newNama} onChange={(e) => c.setNewNama(e.target.value)} maxLength={20} />
          <button type="submit" className="btn btn-primary" disabled={c.busy}><Plus weight="bold" /> Tambah</button>
        </form>
      </div>
      <div className="card">
        {c.loading ? <div className="loading">Loading...</div> : (
          <table className="table">
            <thead><tr><th>SHIFT</th><th className="th-actions">AKSI</th></tr></thead>
            <tbody>
              {c.items.map((s) => (
                <tr key={s.id}>
                  <td>
                    {c.editId === s.id ? (
                      <input type="text" className="form-control" value={c.editNama} onChange={(e) => c.setEditNama(e.target.value)} maxLength={20} autoFocus />
                    ) : (
                      <span className="kelas-name"><ClockClockwise weight="duotone" /> {s.nama}</span>
                    )}
                  </td>
                  <td className="th-actions">
                    {c.editId === s.id ? (
                      <div className="kelas-actions">
                        <button className="btn btn-sm btn-primary" onClick={c.saveEdit} disabled={c.busy} title="Simpan"><Check weight="bold" /></button>
                        <button className="btn btn-sm btn-secondary" onClick={() => c.setEditId(null)} disabled={c.busy} title="Batal"><X weight="bold" /></button>
                      </div>
                    ) : (
                      <div className="kelas-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => { c.setEditId(s.id); c.setEditNama(s.nama) }} title="Ubah"><PencilSimple weight="bold" /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => c.del(s)} disabled={c.busy} title="Hapus"><Trash weight="bold" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {c.items.length === 0 && <tr><td colSpan="2" className="empty">Belum ada shift.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminKelas
