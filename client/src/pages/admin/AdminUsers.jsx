import React, { useState, useEffect } from 'react'
import {
  PencilSimple,
  Key,
  Trash,
  Prohibit,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import api from '../../api'
import Layout from '../../components/Layout'

import './AdminUsers.css'

function AdminUsers({ user, onLogout }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetUserId, setResetUserId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const emptyForm = { username: '', email: '', password: '', full_name: '', nip: '', kelas: '', jabatan: '', no_hp: '', role: 'guru' }
  const [form, setForm] = useState(emptyForm)
  const [jenisLayanan, setJenisLayanan] = useState([])

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, statusFilter])

  // Ambil daftar jenis layanan dari data jadwal (guru_map) utk dropdown form
  useEffect(() => {
    api.get('/jadwal/guru-map')
      .then((res) => setJenisLayanan([...new Set((res.data || []).map((g) => g.jenis_layanan).filter(Boolean))].sort()))
      .catch(() => setJenisLayanan([]))
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = [`page=${page}`, 'limit=20']
      if (roleFilter) params.push(`role=${roleFilter}`)
      if (statusFilter) params.push(`status=${statusFilter}`)
      const response = await api.get(`/admin/users?${params.join('&')}`)
      setUsers(response.data.users)
    } catch (err) {
      console.error('Error fetching users:', err)
      setMessage(err.response?.data?.message || 'Error loading users')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditUser(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({
      username: u.username, email: u.email, password: '',
      full_name: u.full_name || '', nip: u.nip || '',
      kelas: u.kelas || '', jabatan: u.jabatan || '', no_hp: u.no_hp || '',
      role: u.role || 'guru',
    })
    setShowForm(true)
  }

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      if (editUser) {
        await api.put(`/admin/users/${editUser.id}`, {
          username: form.username,
          email: form.email,
          full_name: form.full_name,
          kelas: form.kelas,
          jabatan: form.jabatan,
          no_hp: form.no_hp,
          role: form.role,
        })
        setMessage('Data guru berhasil diperbarui')
      } else {
        await api.post('/admin/users', form)
        setMessage(form.role === 'admin' ? 'Admin berhasil ditambahkan' : 'Guru berhasil ditambahkan')
      }
      setMessageType('success')
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menyimpan data guru')
      setMessageType('error')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage('Password tidak boleh kosong')
      setMessageType('error')
      return
    }
    if (newPassword.length < 8) {
      setMessage('Password minimal 8 karakter')
      setMessageType('error')
      return
    }
    try {
      await api.post(`/admin/users/${resetUserId}/reset-password`, { newPassword })
      setMessage('Password berhasil direset')
      setMessageType('success')
      setShowResetForm(false)
      setNewPassword('')
      setResetUserId(null)
      fetchUsers()
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Gagal mereset password'
      )
      setMessageType('error')
    }
  }

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menonaktifkan pengguna ini?')) return
    try {
      await api.post(`/admin/users/${userId}/deactivate`)
      setMessage('Pengguna berhasil dinonaktifkan')
      setMessageType('success')
      fetchUsers()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menonaktifkan pengguna')
      setMessageType('error')
    }
  }

  const handleActivate = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/activate`)
      setMessage('Pengguna berhasil diaktifkan')
      setMessageType('success')
      fetchUsers()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal mengaktifkan pengguna')
      setMessageType('error')
    }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Hapus permanen ${u.full_name || u.username}? Data absensinya ikut terhapus.`)) return
    try {
      await api.delete(`/admin/users/${u.id}`)
      setMessage('Pengguna berhasil dihapus')
      setMessageType('success')
      fetchUsers()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menghapus pengguna')
      setMessageType('error')
    }
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout user={user} onLogout={onLogout} role="admin" active="users">
      <div className="page-header">
        <h1>Manajemen Guru</h1>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="search-section">
          <input
            type="text"
            placeholder="Cari nama, username, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select className="filter-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Role</option>
            <option value="guru">Guru</option>
            <option value="admin">Admin</option>
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <button onClick={openCreate} className="btn btn-primary">
            + Tambah Guru
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Memuat data...</p>
        ) : filteredUsers.length > 0 ? (
          <div className="users-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>NIP</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.nip || '-'}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === 'admin' ? 'Admin' : 'Guru'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${u.status}`}>
                        {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openEdit(u)}
                          className="btn-action btn-edit"
                          title="Ubah Data"
                        >
                          <PencilSimple weight="duotone" />
                        </button>
                        <button
                          onClick={() => {
                            setResetUserId(u.id)
                            setShowResetForm(true)
                          }}
                          className="btn-action btn-edit"
                          title="Atur Ulang Password"
                        >
                          <Key weight="duotone" />
                        </button>
                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="btn-action btn-warn"
                            title="Nonaktifkan"
                            disabled={u.id === user?.id}
                          >
                            <Prohibit weight="duotone" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(u.id)}
                            className="btn-action btn-edit"
                            title="Aktifkan"
                          >
                            <ArrowClockwise weight="duotone" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn-action btn-delete"
                          title="Hapus Permanen"
                          disabled={u.id === user?.id}
                        >
                          <Trash weight="duotone" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Tidak ada data pengguna</p>
        )}

        <div className="pagination" style={{ marginTop: '20px' }}>
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
            disabled={filteredUsers.length < 20}
          >
            Berikutnya <CaretRight weight="bold" />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editUser ? 'Ubah Data Guru' : 'Tambah Guru'}</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Username</label>
                  <input name="username" value={form.username} onChange={handleFormChange} required minLength={3} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleFormChange} required />
                </div>
                <div className="form-group full">
                  <label>Nama Lengkap</label>
                  <input name="full_name" value={form.full_name} onChange={handleFormChange} required />
                </div>
                {!editUser && (
                  <div className="form-group full">
                    <label>Password Awal (min. 8 karakter)</label>
                    <input name="password" type="password" value={form.password} onChange={handleFormChange} required minLength={8} />
                  </div>
                )}
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={form.role} onChange={handleFormChange}>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>NIP</label>
                  <input name="nip" value={form.nip} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Jenis Layanan</label>
                  <select name="jabatan" value={form.jabatan} onChange={handleFormChange}>
                    <option value="">— Pilih Jenis Layanan —</option>
                    {jenisLayanan.map((jl) => <option key={jl} value={jl}>{jl}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>No. HP</label>
                  <input name="no_hp" value={form.no_hp} onChange={handleFormChange} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {editUser ? 'Simpan Perubahan' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetForm && (
        <div className="modal-overlay" onClick={() => setShowResetForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Atur Ulang Password</h2>
            <div className="form-group">
              <label>Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru (min. 8 karakter)"
                minLength={8}
                required
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => handleResetPassword(resetUserId)} className="btn btn-primary">
                Simpan
              </button>
              <button
                onClick={() => {
                  setShowResetForm(false)
                  setNewPassword('')
                }}
                className="btn btn-secondary"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default AdminUsers