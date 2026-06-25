import { useState, useMemo } from 'react'
import db from '../data/butterflies_cuba.json'

/*
  useButterflies — custom React hook
  ────────────────────────────────────
  A "hook" is a function that packages reusable stateful logic.
  This one owns all the filtering state so the UI components
  don't need to know anything about how the data works.

  It returns:
    butterflies   — the filtered list to display
    searchQuery   — current text in the search bar
    setSearchQuery
    filters       — { families, subfamilies, colors, provinces }
    setFilters
    filterOptions — all unique values available for each filter
    totalCount    — total unfiltered species count
*/
export function useButterflies() {
  const allButterflies = db.butterflies

  // ── Filter state ──────────────────────────────────────────────
  // Each filter is an array of active selections (empty = no filter).
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    families:    [],   // e.g. ['Papilionidae', 'Nymphalidae']
    subfamilies: [],   // e.g. ['Danainae']
    colors:      [],   // e.g. ['orange', 'black']
    provinces:   [],   // e.g. ['Holguín', 'Granma']
    endemicOnly: false,
  })

  // ── Build filter option lists from the data ───────────────────
  /*
    useMemo caches this computation — it only re-runs if allButterflies changes
    (which it never does at runtime, so this runs exactly once).
    Without useMemo, React would recompute these sorted lists on every keystroke.
  */
  const filterOptions = useMemo(() => ({
    families:    [...new Set(allButterflies.map(b => b.family))].sort(),
    subfamilies: [...new Set(allButterflies.map(b => b.subfamily))].sort(),
    colors:      db.metadata.color_tags,
    provinces:   db.metadata.provinces,
  }), [allButterflies])

  // ── Apply all active filters ──────────────────────────────────
  /*
    useMemo again — only re-runs when the search query or filters change.
    The filtering pipeline: each .filter() call narrows the list further.
    If a filter array is empty, that filter is skipped entirely.
  */
  const butterflies = useMemo(() => {
    let result = allButterflies

    // 1. Text search — matches scientific name or common name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b =>
        b.scientific_name.toLowerCase().includes(q) ||
        b.common_name.toLowerCase().includes(q)
      )
    }

    // 2. Family filter
    if (filters.families.length > 0) {
      result = result.filter(b => filters.families.includes(b.family))
    }

    // 3. Subfamily filter
    if (filters.subfamilies.length > 0) {
      result = result.filter(b => filters.subfamilies.includes(b.subfamily))
    }

    // 4. Color filter — butterfly must have ALL selected colors
    //    (change .every to .some if you want "any of these colors" logic instead)
    if (filters.colors.length > 0) {
      result = result.filter(b =>
        filters.colors.every(c => b.colors.includes(c))
      )
    }

    // 5. Province filter — butterfly must be found in ANY selected province
    if (filters.provinces.length > 0) {
      result = result.filter(b =>
        filters.provinces.some(p => b.distribution.provinces.includes(p))
      )
    }

    // 6. Endemic-only toggle
    if (filters.endemicOnly) {
      result = result.filter(b => b.endemic_to_cuba)
    }

    return result
  }, [allButterflies, searchQuery, filters])

  // ── Helper: toggle a value in a filter array ──────────────────
  /*
    Instead of writing toggle logic in every UI component,
    we expose this helper. It adds the value if absent, removes if present.
  */
  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const current = prev[key]
      const updated = current.includes(value)
        ? current.filter(v => v !== value)   // remove
        : [...current, value]                // add
      return { ...prev, [key]: updated }
    })
  }

  const clearAllFilters = () => {
    setFilters({ families: [], subfamilies: [], colors: [], provinces: [], endemicOnly: false })
    setSearchQuery('')
  }

  const activeFilterCount =
    filters.families.length +
    filters.subfamilies.length +
    filters.colors.length +
    filters.provinces.length +
    (filters.endemicOnly ? 1 : 0)

  return {
    butterflies,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    toggleFilter,
    clearAllFilters,
    filterOptions,
    totalCount: allButterflies.length,
    activeFilterCount,
  }
}
