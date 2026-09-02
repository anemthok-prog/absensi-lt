import React, { useState, useEffect, useMemo } from 'react'
import { CalendarBlank, MagnifyingGlass, TreeStructure } from '@phosphor-icons/react'
import api from '../api'
import Layout from '../components/Layout'
import './Jadwal.css'

const HARI_ORDER = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const SLOT_ORDER = ['13.00 - 14.20', '14.00 - 15.20', '14.10 - 15.30', '18.30 - 19.50']

function Jadwal({ user, onLogout, role }) {
  const isAdmin = role === 'admin'
  const [tab, setTab] = useState(isAdmin ? 'guru' : 'grid')
  const [guruMap, setGuruMap] = useState([])
  const [mine, setMine] = useState([])
  const [all, setAll] = useState([])
  const [showAll, setShowAll] = useState(isAdmin) // admin lihat semua, guru cuma punya sendiri
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filterLayanan, setFilterLayanan] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [gm, my, al] = await Promise.all([
          api.get('/jadwal/guru-map'),
          api.get('/jadwal/saya'),
          isAdmin ? api.get('/jadwal') : Promise.resolve({ data: [] }),
        ])
        setGuruMap(gm.data)
        setMine(my.data)
        setAll(al.data)
      } catch (err) {
        console.error('Error ambil jadwal:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  const types = useMemo(
    () => [...new Set(guruMap.map((g) => g.jenis_layanan).filter(Boolean))].sort(),
    [guruMap]
  )
  const filteredGuru = useMemo(() => {
    return guruMap.filter((g) => {
      const matchQ = !q || g.nama_guru.toLowerCase().includes(q.toLowerCase()) ||
        g.kode.toLowerCase().includes(q.toLowerCase()) ||
        (g.jenis_layanan || '').toLowerCase().includes(q.toLowerCase())
      const matchT = !filterLayanan || g.jenis_layanan === filterLayanan
      return matchQ && matchT
    })
  }, [guruMap, q, filterLayanan])

  // Matriks jadwal mingguan: hari x slot -> daftar {kelas, jenis}
  const matrix = useMemo(() => {
    const source = showAll ? all : mine
    const m = {}
    for (const r of source) {
      const key = `${r.hari}|${r.jam}`
      ;(m[key] = m[key] || []).push({
        kelas: r.kelas,
        jenis: r.jenis_layanan || r.keterangan || '',
        guru: r.nama_guru || '',
      })
    }
    return m
  }, [mine, all, showAll])

  const buildCell = (hari, slot) => {
    const items = matrix[`${hari}|${slot}`] || []
    if (items.length === 0) return <span className="jw-empty">–</span>
    return (
      <div className="jw-cells">
        {items.map((it, i) => (
          <div key={i} className="jw-cell">
            <strong>{it.kelas}</strong>
            {it.jenis && <span className="jw-sub">{it.jenis}</span>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout} role={role} active="jadwal">
      <div className="page-header">
        <h1>Jadwal</h1>
      </div>

      {isAdmin && (
        <div className="jadwal-tabs">
          <button className={tab === 'guru' ? 'jadwal-tab active' : 'jadwal-tab'} onClick={() => setTab('guru')}>
            <TreeStructure weight="duotone" /> Guru & Jenis Layanan
          </button>
          <button className={tab === 'grid' ? 'jadwal-tab active' : 'jadwal-tab'} onClick={() => setTab('grid')}>
            <CalendarBlank weight="duotone" /> Jadwal Kelas
          </button>
        </div>
      )}

      {tab === 'guru' && isAdmin && (
        <div className="card">
          <div className="jadwal-filter">
            <div className="jadwal-search">
              <MagnifyingGlass weight="duotone" />
              <input type="text" placeholder="Cari guru / kode / jenis layanan…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="filter-select" value={filterLayanan} onChange={(e) => setFilterLayanan(e.target.value)}>
              <option value="">Semua Jenis Layanan</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <table className="table">
              <thead>
                <tr><th>Kode</th><th>Guru</th><th>Jenis Layanan</th></tr>
              </thead>
              <tbody>
                {filteredGuru.map((g) => (
                  <tr key={g.kode}>
                    <td><strong className="jadwal-kode">{g.kode}</strong></td>
                    <td>{g.nama_guru}</td>
                    <td><span className="jadwal-type">{g.jenis_layanan || '-'}</span></td>
                  </tr>
                ))}
                {filteredGuru.length === 0 && (
                  <tr><td colSpan="3" className="empty">Tidak ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'grid' && (
        <div className="card">
          <h2 className="jw-title">
            {showAll ? 'Jadwal Mingguan (Semua Kelas)' : 'Jadwal Mingguan Saya'}
          </h2>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="jw-scroll">
              <table className="jw-table">
                <thead>
                  <tr>
                    <th className="jw-slot-head">Jam \ Hari</th>
                    {HARI_ORDER.map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SLOT_ORDER.map((slot) => (
                    <tr key={slot}>
                      <td className="jw-slot">{slot}</td>
                      {HARI_ORDER.map((hari) => (
                        <td key={hari}>{buildCell(hari, slot)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

export default Jadwal
