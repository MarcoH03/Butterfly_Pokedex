import React from 'react'

/*
  FilterDrawer — DS-style bottom sheet.
  Dark navy background to match the game UI, green accents.
*/
const COLOR_SWATCHES = {
  black: '#1a1a1a', white: '#f0f0f0', yellow: '#f0c030',
  orange: '#e07020', brown: '#8b5e3c', blue: '#4060c0',
  green: '#30a040', red: '#c03030', gray: '#808080',
  iridescent: 'linear-gradient(135deg,#a0f0c0,#60a0f0,#c080f0)',
}

export default function FilterDrawer({
  isOpen, onClose, filters, toggleFilter, setFilters,
  clearAll, filterOptions, activeCount
}) {
  if (!isOpen) return null

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, maxHeight: '78vh',
        background: 'var(--navy)', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        borderTop: '4px solid var(--green-tab)',
        boxShadow: '0 -2px 0 var(--green-dark)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderBottom: '2px solid var(--navy-light)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 'var(--t-xs)', color: 'var(--green-hi)' }}>▼ FILTROS</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ds-btn-red" onClick={clearAll} style={{ fontSize: 'var(--t-xxs)' }}>
              LIMPIAR
            </button>
            <button className="ds-tab active" onClick={onClose} style={{ fontSize: 'var(--t-xxs)' }}>
              CERRAR {activeCount > 0 ? `(${activeCount})` : ''}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 12px' }}>

          <FilterSection label="FAMILIA">
            <ChipGroup options={filterOptions.families} active={filters.families}
              onToggle={v => toggleFilter('families', v)} />
          </FilterSection>

          <FilterSection label="SUBFAMILIA / GRUPO">
            <ChipGroup options={filterOptions.subfamilies} active={filters.subfamilies}
              onToggle={v => toggleFilter('subfamilies', v)} />
          </FilterSection>

          <FilterSection label="COLOR">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {filterOptions.colors.map(color => {
                const active = filters.colors.includes(color)
                return (
                  <button key={color} onClick={() => toggleFilter('colors', color)} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontFamily: 'var(--font)', fontSize: 'var(--t-xxs)',
                    color: active ? '#fff' : 'var(--text-light)',
                    background: active ? 'var(--green-dark)' : 'var(--navy-mid)',
                    border: active ? '2px solid var(--green-hi)' : '2px solid var(--navy-light)',
                    padding: '4px 7px', cursor: 'pointer',
                  }}>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8,
                      background: COLOR_SWATCHES[color] || color,
                      border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
                    }} />
                    {color.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          <FilterSection label="PROVINCIA / REGIÓN">
            <ChipGroup options={filterOptions.provinces} active={filters.provinces}
              onToggle={v => toggleFilter('provinces', v)} />
          </FilterSection>

          <FilterSection label="ENDÉMICA">
            <button
              className={filters.endemicOnly ? 'ds-tab active' : 'ds-btn-red'}
              onClick={() => setFilters(f => ({ ...f, endemicOnly: !f.endemicOnly }))}
              style={{ fontSize: 'var(--t-xxs)' }}
            >
              {filters.endemicOnly ? '► SOLO ENDÉMICAS' : '○ TODAS'}
            </button>
          </FilterSection>

        </div>
      </div>
    </>
  )
}

function FilterSection({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 'var(--t-xxs)', color: 'var(--green-hi)',
        borderBottom: '1px solid var(--navy-light)',
        paddingBottom: 4, marginBottom: 8,
      }}>{label}</div>
      {children}
    </div>
  )
}

function ChipGroup({ options, active, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onToggle(opt)} style={{
          fontFamily: 'var(--font)', fontSize: 'var(--t-xxs)',
          color: active.includes(opt) ? '#fff' : 'var(--text-light)',
          background: active.includes(opt) ? 'var(--green-dark)' : 'var(--navy-mid)',
          border: active.includes(opt) ? '2px solid var(--green-hi)' : '2px solid var(--navy-light)',
          padding: '4px 7px', cursor: 'pointer',
        }}>{opt}</button>
      ))}
    </div>
  )
}
