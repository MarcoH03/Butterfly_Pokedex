import React, { useState } from 'react'
import ButterflyRow from '../components/ButterflyRow'
import FilterDrawer from '../components/FilterDrawer'
import { useButterflies } from '../hooks/useButterflies'

/*
  ListPage
  ────────
  The home screen of the app. Contains:
    1. A search bar
    2. A filter button that opens FilterDrawer
    3. A result count line
    4. The scrollable butterfly list

  All data/filter logic lives in useButterflies() — this page
  just calls that hook and connects its values to the UI.
*/
export default function ListPage() {
  const {
    butterflies,
    searchQuery, setSearchQuery,
    filters, setFilters, toggleFilter, clearAllFilters,
    filterOptions,
    totalCount,
    activeFilterCount,
  } = useButterflies()

  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Search + Filter bar ── */}
      <div style={{
        flexShrink: 0,
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-bg-panel)',
        borderBottom: '2px solid var(--color-border)',
        display: 'flex',
        gap: 'var(--space-2)',
        alignItems: 'center',
      }}>

        {/*
          Search input — controlled component.
          "Controlled" means React owns the value: every keystroke calls
          setSearchQuery, which updates state, which re-renders the input
          with the new value. The filter in useButterflies re-runs instantly.
        */}
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{
            position: 'absolute',
            left: 'var(--space-2)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-dim)',
            fontSize: 'var(--text-sm)',
            pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            style={{
              width: '100%',
              background: 'var(--color-bg)',
              border: '2px solid var(--color-border)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-pixel)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-6)',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter button — badge shows active filter count */}
        <button
          className="btn-pixel pixel-border"
          onClick={() => setFilterOpen(true)}
          style={{
            position: 'relative',
            fontSize: '7px',
            flexShrink: 0,
            background: activeFilterCount > 0
              ? 'var(--color-accent-dim)'
              : 'var(--color-bg-card)',
          }}
        >
          {/* Filter icon (using text symbol — no image needed) */}
          ▼ FILTER
          {/* Red dot badge appears when filters are active */}
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: 'var(--color-red)',
              color: 'var(--color-text)',
              fontSize: '6px',
              width: 14,
              height: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 0,  /* Square, not round — stays pixel art */
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Result count ── */}
      <div style={{
        flexShrink: 0,
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-dim)' }}>
          {butterflies.length === totalCount
            ? `${totalCount} SPECIES`
            : `${butterflies.length} / ${totalCount} SPECIES`
          }
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '7px',
              cursor: 'pointer',
            }}
          >
            ✕ CLEAR
          </button>
        )}
      </div>

      {/* ── Butterfly list ── */}
      {/*
        This div is the actual scrollable region.
        flex: 1 makes it fill all remaining vertical space.
        overflow-y: auto enables scrolling within this box only —
        the header and search bar stay fixed above it.
      */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {butterflies.length === 0 ? (
          /* Empty state — shown when search/filters match nothing */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-8)',
            gap: 'var(--space-4)',
            color: 'var(--color-text-dim)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--text-xl)' }}>?</div>
            <p style={{ fontSize: 'var(--text-xs)', lineHeight: 2 }}>
              NO SPECIES FOUND<br />
              <span style={{ fontSize: '7px' }}>Try different filters</span>
            </p>
            <button className="btn-pixel pixel-border" onClick={clearAllFilters}>
              RESET
            </button>
          </div>
        ) : (
          /*
            The list itself. We use a plain mapped array rather than a
            virtualised list for now — 207 rows is fast enough for React
            to handle without virtualisation.
            (If you add thousands of entries later, consider react-window.)
          */
          butterflies.map(butterfly => (
            <ButterflyRow key={butterfly.id} butterfly={butterfly} />
          ))
        )}
      </div>

      {/* Filter drawer — rendered here so it sits above the list */}
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
