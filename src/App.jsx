import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ListPage from './pages/ListPage'
import DetailPage from './pages/DetailPage'

/*
  App
  ───
  The root component. It renders the persistent app shell
  (the header with the scanline effect) and then delegates
  to the correct page based on the current URL.

  Routes work like a switch statement:
    /            → ListPage   (the butterfly list)
    /butterfly/42 → DetailPage (detail for butterfly #42)
*/

export default function App() {
  return (
    <div className="app-shell">

      {/* ── App header — always visible ── */}
      <header className="app-header scanlines">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: pixel butterfly logo mark */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            {/*
              The three-dot cluster mimics the GBA/DS power LED indicators.
              Pure CSS — no images.
            */}
            <div style={{ display: 'flex', gap: 3 }}>
              <span style={{ display: 'block', width: 6, height: 6, background: 'var(--color-red)' }} />
              <span style={{ display: 'block', width: 6, height: 6, background: 'var(--color-yellow)' }} />
              <span style={{ display: 'block', width: 6, height: 6, background: 'var(--color-accent)' }} />
            </div>
            <span style={{
              fontSize: 'var(--text-md)',
              color: 'var(--color-accent)',
              letterSpacing: '0.02em',
            }}>
              MARIPOSAS
            </span>
          </div>

          {/* Right: subtitle */}
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-dim)',
          }}>
            DE CUBA
          </span>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/butterfly/:id" element={<DetailPage />} />
        </Routes>
      </main>

    </div>
  )
}
