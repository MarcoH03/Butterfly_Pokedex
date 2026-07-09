import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PixelSprite from '../components/PixelSprite'
import db from '../data/butterflies_cuba.json'

/*
  DetailPage — replicates the DS Pokédex detail screen (image 2):

  ┌─────────────────────────────────────────────────────┐
  │ [INFO.] [ÁREA] [EVOL.] [AT.] [STATS]   [sprite]   │  ← green tab bar
  │ ◄ BACK   Nº001                                      │  ← nav row
  ├──────────────────────────────────────────────────────┤
  │ [sprite]    Nº027 Name                              │
  │             Species descriptor                      │
  │             Alt.    1.5 m                           │
  │             Weight  x g                [type badge] │
  ├──────────────────────────────────────────────────────┤
  │ Pág. 1                                              │
  │ Description text in larger, readable font...        │
  └─────────────────────────────────────────────────────┘
*/

const TABS = ['INFO.', 'MAPA', 'CICLO', 'FOTOS']

const FAMILY_COLORS = {
  Papilionidae: '#9040b0',
  Hesperiidae:  '#b06010',
  Pieridae:     '#909010',
  Riodinidae:   '#10a0a0',
  Lycaenidae:   '#3060c0',
  Nymphalidae:  '#c03030',
}

export default function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const butterfly = db.butterflies.find(b => b.id === parseInt(id))

  if (!butterfly) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--red-btn)', fontSize: 'var(--t-sm)', marginBottom: 16 }}>
          ESPECIE NO ENCONTRADA
        </p>
        <button className="ds-btn-red" onClick={() => navigate('/')}>◄ VOLVER</button>
      </div>
    )
  }

  const familyColor = FAMILY_COLORS[butterfly.family] ?? 'var(--blue-accent)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ══ TAB BAR — green tabs from image 2 ══ */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        background: 'var(--navy)',
        padding: '6px 6px 0',
        gap: 3,
        alignItems: 'flex-end',
        borderBottom: '2px solid var(--green-dark)',
      }}>
        {/* Back button — styled like a small red button */}
        <button
          className="ds-btn-red"
          onClick={() => navigate(-1)}
          style={{ fontSize: 'var(--t-xxs)', marginRight: 4, marginBottom: 2, alignSelf: 'center' }}
        >
          ◄
        </button>

        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`ds-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
            style={{ flex: 1 }}
          >
            {tab}
          </button>
        ))}

        {/* Mini sprite in top-right corner — like image 2 */}
        <div style={{ marginLeft: 4, marginBottom: 2 }}>
          <PixelSprite
            src={butterfly.images.thumbnail}
            alt=""
            size={28}
            showScanlines={false}
          />
        </div>
      </div>

      {/* ══ HEADER CARD — sprite + name/stats ══ */}
      {/*
        This replicates the grey info card in image 2:
        left half = sprite, right half = name + Alt + Peso + type badge
      */}
      <div style={{
        flexShrink: 0,
        background: 'var(--white-panel)',
        borderBottom: '3px solid #c0c0c0',
        display: 'flex',
        gap: 0,
        minHeight: 110,
      }}>
        {/* Sprite box — the big grey left cell */}
        <div style={{
          width: 110,
          flexShrink: 0,
          background: '#d0d0d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '2px solid #b0b0b8',
        }}>
          <PixelSprite
            src={butterfly.images.adult?.[0]}
            alt={butterfly.scientific_name}
            size={96}
            showScanlines={true}
          />
        </div>

        {/* Info column */}
        <div style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Nº + Name — "Nº027 Greninja" style */}
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--text-dark)', lineHeight: 1.4 }}>
            <span style={{ color: '#808080' }}>Nº{String(butterfly.id).padStart(3, '0')} </span>
            {butterfly.scientific_name.split(' ').slice(0, 2).join(' ')}
          </div>

          {/* Descriptor line — common name */}
          <div style={{
            fontSize: 'var(--t-xxs)',
            color: '#505050',
            fontStyle: 'italic',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {butterfly.common_name}
          </div>

          {/* Stat rows — "Alt." and "Peso" from image 2 */}
          <div style={{ display: 'flex', gap: 8, fontSize: 'var(--t-xxs)', color: 'var(--text-dark)', marginTop: 2 }}>
            <div style={{ flex: 1 }}>
              <InfoRow label="Enverg." value={
                butterfly.wingspan_mm.min === 0
                  ? '— mm'
                  : `${butterfly.wingspan_mm.min}–${butterfly.wingspan_mm.max} mm`
              } />
              <InfoRow label="Estado" value={butterfly.conservation_status} small />
            </div>
            {/* Type badge — round like in image 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', justifyContent: 'center' }}>
              <TypeBadge color={familyColor} label={butterfly.family.slice(0,5).toUpperCase()} />
              {butterfly.endemic_to_cuba && (
                <TypeBadge color="var(--red-btn)" label="END." />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ TAB CONTENT — white description box ══ */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {activeTab === 0 && <InfoTab butterfly={butterfly} />}
        {activeTab === 1 && <MapTab butterfly={butterfly} />}
        {activeTab === 2 && <CycleTab butterfly={butterfly} />}
        {activeTab === 3 && <PhotosTab butterfly={butterfly} />}
      </div>
    </div>
  )
}

/* ── InfoRow — "Alt.  1,5 m" style stat row ── */
function InfoRow({ label, value, small }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6,
      fontSize: small ? 'var(--t-xxs)' : 'var(--t-xxs)',
      borderBottom: '1px solid #d0d0d0', padding: '2px 0',
    }}>
      <span style={{ color: '#808080' }}>{label}</span>
      <span style={{ color: 'var(--text-dark)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

/* ── TypeBadge — circular type badge from image 2 ── */
function TypeBadge({ color, label }) {
  return (
    <div style={{
      background: color,
      color: '#fff',
      fontSize: '6px',
      padding: '3px 6px',
      borderRadius: 2,
      boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.2)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </div>
  )
}

/* ═══ TAB 1 — INFO ═══════════════════════════════════════════════
   Replicates the white "Pág. 1" description box from image 2
   ═══════════════════════════════════════════════════════════════ */
function InfoTab({ butterfly }) {
  return (
    <div>
      {/* Description box — white panel with "Pág. 1" label */}
      <div className="white-panel" style={{ padding: '10px 12px', borderBottom: '2px solid #c8c8c8' }}>
        <div style={{ fontSize: 'var(--t-xxs)', color: '#808080', marginBottom: 6 }}>Pág. 1</div>
        <p style={{
          fontSize: 'var(--t-xs)',
          color: 'var(--text-dark)',
          lineHeight: 2.2,
          fontFamily: 'var(--font)',
        }}>
          {butterfly.upperside_description}
        </p>
      </div>

      {/* Page 2 — underside */}
      <div className="white-panel" style={{ padding: '10px 12px', borderBottom: '2px solid #c8c8c8' }}>
        <div style={{ fontSize: 'var(--t-xxs)', color: '#808080', marginBottom: 6 }}>Pág. 2</div>
        <p style={{ fontSize: 'var(--t-xs)', color: 'var(--text-dark)', lineHeight: 2.2, fontFamily: 'var(--font)' }}>
          {butterfly.underside_description}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ background: 'var(--navy-mid)', padding: '10px 12px' }}>
        <SectionLabel>DATOS</SectionLabel>
        <DarkStatRow label="FAMILIA" value={butterfly.family} />
        <DarkStatRow label="SUBFAMILIA" value={butterfly.subfamily} />
        <DarkStatRow label="HÁBITAT" value={butterfly.habitat.join(', ') || '—'} />
        <DarkStatRow label="TEMPORADA" value={butterfly.flight_season.note} />
        <DarkStatRow label="COMPORTAMIENTO" value={butterfly.behavior} />
        <DarkStatRow label="RASGOS" value={butterfly.distinguishing_features} />
      </div>
    </div>
  )
}

/* ═══ TAB 2 — MAP ════════════════════════════════════════════════ */
function MapTab({ butterfly }) {
  return (
    <div>
      {/* Placeholder — Leaflet integration in next phase */}
      <div style={{
        margin: 12,
        background: 'var(--navy-mid)',
        border: '2px solid var(--navy-light)',
        aspectRatio: '16/9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: 'var(--text-dim)',
        fontSize: 'var(--t-xs)',
      }}>
        <div style={{ fontSize: 28 }}>🗺</div>
        <div style={{ fontSize: 'var(--t-xxs)', textAlign: 'center', lineHeight: 2 }}>
          MAPA DE CUBA<br />
          <span style={{ color: 'var(--text-dim)' }}>Próxima fase</span>
        </div>
      </div>

      <div style={{ background: 'var(--navy-mid)', padding: '10px 12px' }}>
        <SectionLabel>PROVINCIAS</SectionLabel>
        {butterfly.distribution.provinces.length === 0 ? (
          <p style={{ fontSize: 'var(--t-xxs)', color: 'var(--text-dim)', lineHeight: 2 }}>
            Datos pendientes
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {butterfly.distribution.provinces.map(p => (
              <span key={p} style={{
                fontSize: 'var(--t-xxs)', color: 'var(--green-hi)',
                border: '1px solid var(--green-dark)', padding: '2px 5px',
              }}>{p}</span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <DarkStatRow label="NOTAS" value={butterfly.distribution.distribution_notes} />
        </div>
      </div>
    </div>
  )
}

/* ═══ TAB 3 — LIFE CYCLE ═════════════════════════════════════════ */
function CycleTab({ butterfly }) {
  const { lifecycle, images } = butterfly
  return (
    <div>
      {/* Stage diagram */}
      <div style={{
        background: 'var(--navy-mid)', borderBottom: '2px solid var(--navy-light)',
        padding: '8px 12px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 4,
      }}>
        {['HUEVO','►','LARVA','►','PUPA','►','ADULTO'].map((s, i) => (
          <span key={i} style={{
            fontSize: '6px',
            color: s === '►' ? 'var(--green-hi)' : 'var(--text-light)',
          }}>{s}</span>
        ))}
      </div>

      {/* Caterpillar */}
      <CycleStage
        label="LARVA (ORUGA)"
        imageSrc={images.caterpillar}
        imageAlt="oruga"
        description={lifecycle.caterpillar_description}
        accentColor="var(--yellow)"
      />

      {/* Chrysalis */}
      <CycleStage
        label="PUPA (CRISÁLIDA)"
        imageSrc={images.chrysalis}
        imageAlt="crisálida"
        description={lifecycle.chrysalis_description}
        accentColor="var(--blue-accent)"
      />

      {/* Host plants */}
      <div style={{ background: 'var(--navy-mid)', padding: '10px 12px' }}>
        <SectionLabel>PLANTAS HUÉSPED</SectionLabel>
        {lifecycle.host_plants.map((plant, i) => (
          <div key={i} style={{
            fontSize: 'var(--t-xxs)', fontStyle: 'italic',
            color: 'var(--green-hi)', borderLeft: '2px solid var(--green-hi)',
            padding: '3px 8px', marginBottom: 4,
          }}>{plant}</div>
        ))}
        <p style={{ fontSize: 'var(--t-xxs)', color: 'var(--text-dim)', lineHeight: 2, marginTop: 6 }}>
          {lifecycle.host_plant_notes}
        </p>
      </div>

      {/* Egg */}
      <div style={{ background: 'var(--navy)', padding: '10px 12px' }}>
        <SectionLabel>HUEVO</SectionLabel>
        <p style={{ fontSize: 'var(--t-xxs)', color: 'var(--text-dim)', lineHeight: 2 }}>
          {lifecycle.egg_description}
        </p>
      </div>
    </div>
  )
}

function CycleStage({ label, imageSrc, imageAlt, description, accentColor }) {
  return (
    <div style={{
      background: 'var(--navy)', borderBottom: '2px solid var(--navy-light)',
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 'var(--t-xxs)', color: accentColor, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <PixelSprite src={imageSrc} alt={imageAlt} size={64} />
        <p style={{ fontSize: 'var(--t-xxs)', color: 'var(--text-dim)', lineHeight: 2, flex: 1 }}>
          {description}
        </p>
      </div>
    </div>
  )
}

/* ═══ TAB 4 — PHOTOS ════════════════════════════════════════════ */
function PhotosTab({ butterfly }) {
  return (
    <div style={{ padding: 12 }}>
      <SectionLabel>GALERÍA</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {butterfly.images.adult.map((src, i) => (
          <PixelSprite key={i} src={src} alt={`foto ${i+1}`} size={100} />
        ))}
        <PixelSprite src={butterfly.images.caterpillar} alt="oruga" size={100} />
        <PixelSprite src={butterfly.images.chrysalis} alt="crisálida" size={100} />
        <PixelSprite src={butterfly.images.host_plant} alt="planta huésped" size={100} />
      </div>
      <p style={{
        fontSize: 'var(--t-xxs)', color: 'var(--text-dim)',
        lineHeight: 2, marginTop: 12,
      }}>
        Añade imágenes a public/img/ siguiendo la convención de nombres del JSON.
      </p>
    </div>
  )
}

/* ── Shared sub-components ── */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 'var(--t-xxs)', color: 'var(--green-hi)',
      borderBottom: '1px solid var(--navy-light)',
      paddingBottom: 4, marginBottom: 8, letterSpacing: '0.05em',
    }}>{children}</div>
  )
}

function DarkStatRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '5px 0', borderBottom: '1px solid var(--navy-light)',
    }}>
      <span style={{ fontSize: 'var(--t-xxs)', color: 'var(--text-dim)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 'var(--t-xxs)', color: 'var(--text-light)', textAlign: 'right', lineHeight: 1.8 }}>{value}</span>
    </div>
  )
}
