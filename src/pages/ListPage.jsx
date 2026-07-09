import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PixelSprite from '../components/PixelSprite'
import FilterDrawer from '../components/FilterDrawer'
import { useButterflies } from '../hooks/useButterflies'

/*
  ListPage — replicates DS Pokédex list screen (image 1):

  ┌─────────────────────────────────────────┐
  │  [LEFT PANEL — navy]  [RIGHT — cream]   │
  │                                         │
  │  OBSERVADOS         Nº001 Battus...     │
  │  [207]              Nº002 Heraclides... │
  │                   ► Nº003 Selected  ◄   │
  │  REGISTRADOS        Nº004 ...           │
  │  [207]              ...                 │
  │                                         │
  │  [🔍 BUSCAR]                            │
  │  [▼ FILTROS]    [FAMILY TAG]            │
  └─────────────────────────────────────────┘

  Tapping a row previews the sprite in the left panel.
  Tapping again (or pressing the arrow) navigates to detail.
*/

const FAMILY_COLORS = {
  Papilionidae: '#9040b0',
  Hesperiidae:  '#b06010',
  Pieridae:     '#909010',
  Riodinidae:   '#10a0a0',
  Lycaenidae:   '#3060c0',
  Nymphalidae:  '#c03030',
}

export default function ListPage() {
  const {
    butterflies, searchQuery, setSearchQuery,
    filters, setFilters, toggleFilter, clearAllFilters,
    filterOptions, totalCount, activeFilterCount,
  } = useButterflies()

  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(butterflies[0]?.id ?? 1)
  const [filterOpen, setFilterOpen] = useState(false)

  const selected = butterflies.find(b => b.id === selectedId) ?? butterflies[0]

  const handleRowTap = (butterfly) => {
    if (selectedId === butterfly.id) {
      // Second tap → go to detail
      navigate(`/butterfly/${butterfly.id}`)
    } else {
      // First tap → preview in left panel
      setSelectedId(butterfly.id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* ── Search bar ── */}
      <div style={{
        flexShrink: 0,
        background: 'var(--navy-mid)',
        borderBottom: '2px solid var(--navy-light)',
        padding: '6px 10px',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 'var(--t-sm)', color: 'var(--green-hi)' }}>🔍</span>
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="BUSCAR..."
          style={{
            flex: 1,
            background: 'var(--navy)',
            border: '2px solid var(--navy-light)',
            color: 'var(--text-light)',
            fontFamily: 'var(--font)',
            fontSize: 'var(--t-xxs)',
            padding: '5px 8px',
            outline: 'none',
            boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.5)',
          }}
        />
        <button
          className="ds-btn-red"
          onClick={() => setFilterOpen(true)}
          style={{ position: 'relative', whiteSpace: 'nowrap' }}
        >
          FILTROS{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      {/* ── Main two-column body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ══ LEFT PANEL (navy) — sprite preview + counters ══ */}
        <div style={{
          width: 130,
          flexShrink: 0,
          background: 'var(--navy)',
          borderRight: '3px solid var(--navy-light)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 8px',
          gap: 8,
        }}>

          {/* Stat boxes — replicates AVISTADOS / CAPTURADOS from image 1 */}
          <StatBox label="OBSERVADOS" value={totalCount} />
          <StatBox label="REGISTRADOS"
            value={butterflies.filter(b => b.data_quality !== 'placeholder').length} />

          {/* Sprite preview of selected butterfly */}
          <div style={{ marginTop: 4 }}>
            <PixelSprite
              src={selected?.images?.thumbnail}
              alt={selected?.scientific_name ?? ''}
              size={96}
              showScanlines={true}
            />
          </div>

          {/* Family tag — the coloured type badge at bottom of image 1 */}
          {selected && (
            <div style={{
              fontSize: 'var(--t-xxs)',
              color: '#fff',
              background: FAMILY_COLORS[selected.family] ?? 'var(--blue-accent)',
              padding: '3px 6px',
              textAlign: 'center',
              boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)',
              width: '100%',
            }}>
              {selected.family.toUpperCase().slice(0, 11)}
            </div>
          )}

          {/* VER button — navigates to detail, like the Z●VER in image 1 */}
          {selected && (
            <button
              className="ds-btn-red"
              onClick={() => navigate(`/butterfly/${selected.id}`)}
              style={{ width: '100%', marginTop: 4, fontSize: 'var(--t-xxs)' }}
            >
              ► VER
            </button>
          )}

          {/* Result count */}
          <div style={{
            fontSize: 'var(--t-xxs)',
            color: 'var(--text-dim)',
            textAlign: 'center',
            lineHeight: 1.8,
          }}>
            {butterflies.length < totalCount
              ? `${butterflies.length}/${totalCount}`
              : `${totalCount} spp.`
            }
          </div>
        </div>

        {/* ══ RIGHT PANEL (cream) — species list ══ */}
        <div className="cream-panel ds-panel-cream"
          style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {butterflies.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 12,
              color: 'var(--text-dark)', fontSize: 'var(--t-xs)',
            }}>
              <div style={{ fontSize: 24 }}>?</div>
              <p style={{ fontSize: 'var(--t-xxs)', textAlign: 'center', lineHeight: 2 }}>
                NO SE ENCONTRARON<br />ESPECIES
              </p>
              <button className="ds-btn-red" onClick={clearAllFilters}
                style={{ fontSize: 'var(--t-xxs)' }}>
                LIMPIAR
              </button>
            </div>
          ) : (
            butterflies.map(b => (
              <ListRow
                key={b.id}
                butterfly={b}
                isSelected={b.id === selectedId}
                onTap={() => handleRowTap(b)}
              />
            ))
          )}
        </div>
      </div>

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        toggleFilter={toggleFilter}
        setFilters={setFilters}
        clearAll={clearAllFilters}
        filterOptions={filterOptions}
        activeCount={activeFilterCount}
      />
    </div>
  )
}

/* ── StatBox — replicates AVISTADOS [526] boxes from image 1 ── */
function StatBox({ label, value }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        fontSize: 'var(--t-xxs)',
        color: 'var(--text-light)',
        background: 'var(--navy-light)',
        padding: '2px 5px',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.1)',
        letterSpacing: '0.02em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--t-md)',
        color: 'var(--green-hi)',
        background: 'var(--navy)',
        border: '2px solid var(--navy-light)',
        padding: '3px 6px',
        textAlign: 'right',
        boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5)',
        letterSpacing: '0.05em',
      }}>
        {String(value).padStart(3, '0')}
      </div>
    </div>
  )
}

/* ── ListRow — one entry in the cream panel, matches image 1 list ── */
function ListRow({ butterfly, isSelected, onTap }) {
  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        background: isSelected ? 'var(--green-hi)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--cream-dark)',
        padding: '7px 8px 7px 10px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font)',
        color: isSelected ? '#fff' : 'var(--text-dark)',
        gap: 0,
      }}
    >
      {/* Selected indicator triangle — like the ► in image 1 */}
      <span style={{
        width: 10,
        fontSize: 'var(--t-xxs)',
        color: isSelected ? '#fff' : 'transparent',
        flexShrink: 0,
      }}>►</span>

      {/* Nº number */}
      <span style={{
        fontSize: 'var(--t-xs)',
        color: isSelected ? '#fff' : '#606060',
        marginRight: 6,
        flexShrink: 0,
        fontStyle: 'normal',
        minWidth: 38,
      }}>
        Nº{String(butterfly.id).padStart(3, '0')}
      </span>

      {/* Name */}
      <span style={{
        fontSize: 'var(--t-xs)',
        flex: 1,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        lineHeight: 1,
      }}>
        {/* Show shortened scientific name — genus + first epithet */}
        {butterfly.scientific_name.split(' ').slice(0, 2).join(' ')}
      </span>
    </button>
  )
}
