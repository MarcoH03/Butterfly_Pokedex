import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PixelSprite from '../components/PixelSprite'
import db from '../data/butterflies_cuba.json'

/*
  DetailPage
  ──────────
  Shows full information for one butterfly.
  Three tabs: INFO | LIFECYCLE | MAP

  useParams() reads the :id from the URL — if the URL is
  /butterfly/42, then params.id is "42".
*/

const TABS = ['INFO', 'LIFE CYCLE', 'MAP']

export default function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  // Find the butterfly in the database by its numeric id
  const butterfly = db.butterflies.find(b => b.id === parseInt(id))

  // If the URL has an invalid id, show an error screen
  if (!butterfly) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-red)', fontSize: 'var(--text-sm)' }}>
          SPECIES NOT FOUND
        </p>
        <button className="btn-pixel pixel-border" onClick={() => navigate('/')}>
          ◀ BACK
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Detail header ── */}
      <div
        className="scanlines"
        style={{
          flexShrink: 0,
          background: 'var(--color-bg-panel)',
          borderBottom: '2px solid var(--color-border)',
          padding: 'var(--space-3) var(--space-4)',
        }}
      >
        {/* Back button + ID */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
        }}>
          <button
            onClick={() => navigate(-1)}   // -1 = go back in history
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-pixel)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ◀ BACK
          </button>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>
            #{String(butterfly.id).padStart(3, '0')}
          </span>
        </div>

        {/* Hero area: large sprite + name block */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          <PixelSprite
            src={butterfly.images.adult[0]}
            alt={butterfly.scientific_name}
            size={80}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 1.6,
              marginBottom: 'var(--space-1)',
            }}>
              {butterfly.common_name}
            </div>
            <div style={{
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
              color: 'var(--color-text-dim)',
              marginBottom: 'var(--space-2)',
            }}>
              {butterfly.scientific_name}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              <Tag color="var(--color-blue)">{butterfly.family}</Tag>
              <Tag color="var(--color-accent-dim)">{butterfly.subfamily}</Tag>
              {butterfly.endemic_to_cuba && (
                <Tag color="var(--color-red)">ENDEMIC</Tag>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab selector ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        background: 'var(--color-bg)',
        borderBottom: '2px solid var(--color-border)',
      }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              fontFamily: 'var(--font-pixel)',
              fontSize: '7px',
              color: activeTab === i ? 'var(--color-bg)' : 'var(--color-text-dim)',
              background: activeTab === i ? 'var(--color-accent)' : 'transparent',
              border: 'none',
              padding: 'var(--space-3) var(--space-1)',
              cursor: 'pointer',
              borderRight: i < TABS.length - 1 ? '2px solid var(--color-border)' : 'none',
              lineHeight: 1.4,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {activeTab === 0 && <InfoTab butterfly={butterfly} />}
        {activeTab === 1 && <LifecycleTab butterfly={butterfly} />}
        {activeTab === 2 && <MapTab butterfly={butterfly} />}
      </div>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — INFO
   ═══════════════════════════════════════════════════════════════ */
function InfoTab({ butterfly }) {
  return (
    <div style={{ padding: 'var(--space-4)' }}>

      <StatRow label="WINGSPAN">
        {butterfly.wingspan_mm.min === 0
          ? '— mm'
          : `${butterfly.wingspan_mm.min}–${butterfly.wingspan_mm.max} mm`
        }
      </StatRow>

      <StatRow label="CONSERVATION">
        <span style={{ color: statusColor(butterfly.conservation_status) }}>
          {butterfly.conservation_status}
        </span>
      </StatRow>

      <StatRow label="HABITAT">
        {butterfly.habitat.join(', ') || '—'}
      </StatRow>

      <StatRow label="FLIGHT SEASON">
        {butterfly.flight_season.note}
      </StatRow>

      <StatRow label="COLORS">
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
          {butterfly.colors.map(c => (
            <span key={c} style={{
              fontSize: '7px',
              border: '1px solid var(--color-border)',
              padding: '2px 4px',
              color: 'var(--color-text-dim)',
            }}>{c}</span>
          ))}
        </div>
      </StatRow>

      <Section label="DESCRIPTION">
        <p style={{ fontSize: 'var(--text-xs)', lineHeight: 2, color: 'var(--color-text-dim)' }}>
          {butterfly.upperside_description}
        </p>
      </Section>

      <Section label="UNDERSIDE">
        <p style={{ fontSize: 'var(--text-xs)', lineHeight: 2, color: 'var(--color-text-dim)' }}>
          {butterfly.underside_description}
        </p>
      </Section>

      <Section label="DISTINGUISHING FEATURES">
        <p style={{ fontSize: 'var(--text-xs)', lineHeight: 2, color: 'var(--color-text-dim)' }}>
          {butterfly.distinguishing_features}
        </p>
      </Section>

      <Section label="BEHAVIOR">
        <p style={{ fontSize: 'var(--text-xs)', lineHeight: 2, color: 'var(--color-text-dim)' }}>
          {butterfly.behavior}
        </p>
      </Section>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — LIFECYCLE
   ═══════════════════════════════════════════════════════════════ */
function LifecycleTab({ butterfly }) {
  const { lifecycle, images } = butterfly

  return (
    <div style={{ padding: 'var(--space-4)' }}>

      {/* Stage flow diagram */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-1)',
        marginBottom: 'var(--space-6)',
        padding: 'var(--space-3)',
        background: 'var(--color-bg-card)',
        border: '2px solid var(--color-border)',
      }}>
        {['EGG', '▶', 'LARVA', '▶', 'PUPA', '▶', 'ADULT'].map((s, i) => (
          <span key={i} style={{
            fontSize: '7px',
            color: s === '▶' ? 'var(--color-accent)' : 'var(--color-text)',
          }}>{s}</span>
        ))}
      </div>

      {/* Caterpillar */}
      <LifecycleStage
        label="LARVA (CATERPILLAR)"
        imageSrc={images.caterpillar}
        imageAlt={`${butterfly.scientific_name} caterpillar`}
        description={lifecycle.caterpillar_description}
        accentColor="var(--color-yellow)"
      />

      {/* Chrysalis */}
      <LifecycleStage
        label="PUPA (CHRYSALIS)"
        imageSrc={images.chrysalis}
        imageAlt={`${butterfly.scientific_name} chrysalis`}
        description={lifecycle.chrysalis_description}
        accentColor="var(--color-blue)"
      />

      {/* Host plants */}
      <Section label="HOST PLANTS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {lifecycle.host_plants.map((plant, i) => (
            <div key={i} style={{
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
              color: 'var(--color-accent)',
              padding: 'var(--space-1) var(--space-2)',
              borderLeft: '2px solid var(--color-accent)',
            }}>
              {plant}
            </div>
          ))}
        </div>
        {images.host_plant && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <PixelSprite
              src={images.host_plant}
              alt="Host plant"
              size={80}
            />
          </div>
        )}
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-dim)',
          lineHeight: 2,
          marginTop: 'var(--space-2)',
        }}>
          {lifecycle.host_plant_notes}
        </p>
      </Section>

      {/* Egg */}
      <Section label="EGG">
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)', lineHeight: 2 }}>
          {lifecycle.egg_description}
        </p>
      </Section>

    </div>
  )
}

function LifecycleStage({ label, imageSrc, imageAlt, description, accentColor }) {
  return (
    <div style={{
      marginBottom: 'var(--space-6)',
      padding: 'var(--space-3)',
      background: 'var(--color-bg-card)',
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <div style={{ fontSize: '7px', color: accentColor, marginBottom: 'var(--space-3)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        <PixelSprite src={imageSrc} alt={imageAlt} size={64} />
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-dim)',
          lineHeight: 2,
          flex: 1,
        }}>
          {description}
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — MAP
   This is a placeholder — Leaflet.js map integration comes next.
   ═══════════════════════════════════════════════════════════════ */
function MapTab({ butterfly }) {
  const { distribution } = butterfly

  return (
    <div style={{ padding: 'var(--space-4)' }}>

      {/* Map placeholder — will be replaced with Leaflet in the next phase */}
      <div className="pixel-border" style={{
        width: '100%',
        aspectRatio: '16/9',
        background: 'var(--color-bg-card)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
        color: 'var(--color-text-dim)',
        fontSize: 'var(--text-xs)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 'var(--text-xl)' }}>🗺</div>
        <div>MAP — NEXT PHASE</div>
        <div style={{ fontSize: '7px' }}>Leaflet.js + Cuba GeoJSON</div>
      </div>

      {/* Province list — active even before the map is wired up */}
      <Section label="FOUND IN PROVINCES">
        {distribution.provinces.length === 0 ? (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>
            Distribution data pending
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {distribution.provinces.map(p => (
              <Tag key={p} color="var(--color-accent)">{p}</Tag>
            ))}
          </div>
        )}
      </Section>

      <Section label="DISTRIBUTION NOTES">
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)', lineHeight: 2 }}>
          {distribution.distribution_notes}
        </p>
      </Section>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════════════════════ */

function StatRow({ label, children }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 'var(--space-2) 0',
      borderBottom: '1px solid var(--color-border)',
      gap: 'var(--space-4)',
    }}>
      <span style={{ fontSize: '7px', color: 'var(--color-text-dim)', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', textAlign: 'right' }}>
        {children}
      </span>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginTop: 'var(--space-5)' }}>
      <div style={{
        fontSize: '7px',
        color: 'var(--color-accent)',
        marginBottom: 'var(--space-3)',
        paddingBottom: 'var(--space-1)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Tag({ color, children }) {
  return (
    <span style={{
      fontSize: '7px',
      color,
      border: `1px solid ${color}`,
      padding: '2px 5px',
      lineHeight: 1.6,
    }}>
      {children}
    </span>
  )
}

function statusColor(status) {
  const map = {
    'Least Concern':   'var(--color-accent)',
    'Near Threatened': 'var(--color-yellow)',
    'Vulnerable':      '#e08020',
    'Endangered':      'var(--color-red)',
    'Data Deficient':  'var(--color-text-dim)',
  }
  return map[status] || 'var(--color-text)'
}
