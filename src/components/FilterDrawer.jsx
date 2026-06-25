import React from 'react'

/*
  FilterDrawer
  ────────────
  A slide-up panel (like a native iOS sheet) with filter controls.
  It renders on top of the list when the user taps the filter button.

  Props:
    isOpen        — boolean, whether the drawer is visible
    onClose       — function to call when user taps the backdrop or "CLOSE"
    filters       — current active filters object from useButterflies
    toggleFilter  — function(key, value) to toggle a filter on/off
    setFilters    — function to set filters directly (for the endemic toggle)
    clearAll      — function to reset all filters
    filterOptions — { families, subfamilies, colors, provinces }
    activeCount   — number of active filters (shown on the close button)
*/

// Color swatches for the color filter buttons
const COLOR_SWATCHES = {
  black:       '#1a1a1a',
  white:       '#f0f0f0',
  yellow:      '#f0c030',
  orange:      '#e07020',
  brown:       '#8b5e3c',
  blue:        '#4060c0',
  green:       '#30a040',
  red:         '#c03030',
  gray:        '#808080',
  iridescent:  'linear-gradient(135deg, #a0f0c0, #60a0f0, #c080f0)',
}

export default function FilterDrawer({
  isOpen, onClose, filters, toggleFilter, setFilters,
  clearAll, filterOptions, activeCount
}) {
  if (!isOpen) return null   // Don't render anything when closed

  return (
    <>
      {/*
        Backdrop — the semi-transparent overlay behind the drawer.
        Tapping it closes the drawer (same UX as native iOS sheets).
      */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
        }}
      />

      {/*
        The drawer panel itself — slides up from the bottom.
        position: fixed + bottom: 0 pins it to the screen bottom.
        z-index 201 puts it above the backdrop (200).
      */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          maxHeight: '80vh',      /* Never taller than 80% of screen */
          background: 'var(--color-bg-panel)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          /* Pixel border on top edge only */
          borderTop: '4px solid var(--color-accent)',
          boxShadow: '0 0 0 2px var(--color-bg), 0 0 0 6px var(--color-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* ── Drawer header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
          borderBottom: '2px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent)' }}>
            ▼ FILTERS
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn-pixel" onClick={clearAll} style={{ fontSize: '7px' }}>
              CLEAR ALL
            </button>
            <button className="btn-pixel active" onClick={onClose} style={{ fontSize: '7px' }}>
              CLOSE {activeCount > 0 ? `(${activeCount})` : ''}
            </button>
          </div>
        </div>

        {/* ── Scrollable filter content ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 'var(--space-4)' }}>

          {/* ── FAMILY ── */}
          <FilterSection label="FAMILY">
            <ChipGroup
              options={filterOptions.families}
              active={filters.families}
              onToggle={v => toggleFilter('families', v)}
            />
          </FilterSection>

          {/* ── SUBFAMILY (entomological Group) ── */}
          <FilterSection label="SUBFAMILY / GROUP">
            <ChipGroup
              options={filterOptions.subfamilies}
              active={filters.subfamilies}
              onToggle={v => toggleFilter('subfamilies', v)}
            />
          </FilterSection>

          {/* ── COLOR ── */}
          <FilterSection label="COLOR">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {filterOptions.colors.map(color => {
                const isActive = filters.colors.includes(color)
                return (
                  <button
                    key={color}
                    onClick={() => toggleFilter('colors', color)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '7px',
                      color: isActive ? 'var(--color-bg)' : 'var(--color-text)',
                      background: isActive ? 'var(--color-accent)' : 'var(--color-bg-card)',
                      border: isActive
                        ? '2px solid var(--color-accent)'
                        : '2px solid var(--color-border)',
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Color swatch dot */}
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      background: COLOR_SWATCHES[color] || color,
                      flexShrink: 0,
                      border: '1px solid rgba(255,255,255,0.3)',
                    }} />
                    {color.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* ── PROVINCE / REGION ── */}
          <FilterSection label="PROVINCE / REGION">
            <ChipGroup
              options={filterOptions.provinces}
              active={filters.provinces}
              onToggle={v => toggleFilter('provinces', v)}
            />
          </FilterSection>

          {/* ── ENDEMIC TOGGLE ── */}
          <FilterSection label="ENDEMIC SPECIES">
            <button
              className={`btn-pixel ${filters.endemicOnly ? 'active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, endemicOnly: !f.endemicOnly }))}
              style={{ fontSize: '7px' }}
            >
              {filters.endemicOnly ? '▶ ENDEMIC ONLY' : '○ SHOW ALL'}
            </button>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-dim)',
              marginTop: 'var(--space-2)',
              lineHeight: 1.8,
            }}>
              Filter to species found<br />only in Cuba
            </p>
          </FilterSection>

        </div>
      </div>
    </>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

/*
  FilterSection — a labeled group of filter controls.
  Keeps spacing and typography consistent across all sections.
*/
function FilterSection({ label, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{
        fontSize: '7px',
        color: 'var(--color-accent)',
        marginBottom: 'var(--space-3)',
        paddingBottom: 'var(--space-1)',
        borderBottom: '1px solid var(--color-border)',
        letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

/*
  ChipGroup — renders a set of toggleable pill buttons.
  Used for Family, Subfamily, and Province filters.
*/
function ChipGroup({ options, active, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
      {options.map(option => (
        <button
          key={option}
          onClick={() => onToggle(option)}
          className={`btn-pixel ${active.includes(option) ? 'active' : ''}`}
          style={{ fontSize: '7px' }}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
