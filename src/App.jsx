import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ListPage from './pages/ListPage'
import DetailPage from './pages/DetailPage'

/*
  App — root shell
  The header mimics the "POKÉDEX" title banner from image 1:
  dark background, pixel font title, green accent line underneath.
*/
export default function App() {
  return (
    <div className="app-shell">

      {/* ── Header — replicates the POKÉDEX banner ── */}
      <header style={{
        flexShrink: 0,
        background: 'var(--navy)',
        borderBottom: '3px solid var(--green-tab)',
        padding: '10px 14px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 0 var(--green-dark)',
      }}>
        {/* Three LED dots — GBA/DS hardware detail */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ width: 7, height: 7, background: 'var(--red-btn)', display: 'block',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.4)' }} />
          <span style={{ width: 7, height: 7, background: 'var(--yellow)', display: 'block',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.4)' }} />
          <span style={{ width: 7, height: 7, background: 'var(--green-tab)', display: 'block',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.4)' }} />
          <span style={{
            fontSize: 'var(--t-lg)',
            color: 'var(--text-light)',
            marginLeft: 8,
            letterSpacing: '0.05em',
          }}>MARIPOSADEX</span>
        </div>
        <span style={{ fontSize: 'var(--t-xxs)', color: 'var(--text-dim)' }}>CUBA</span>
      </header>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/butterfly/:id" element={<DetailPage />} />
        </Routes>
      </main>
    </div>
  )
}
