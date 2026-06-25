import React from 'react'
import { useNavigate } from 'react-router-dom'
import PixelSprite from './PixelSprite'

/*
  ButterflyRow
  ────────────
  One row in the main list. Looks like a classic Pokédex entry:
  [ #001 ] [ sprite ] [ Name          ]
                       [ scientific    ]
                       [ FAMILY  TAG  ]

  Props:
    butterfly — a single butterfly object from the database
*/

// Maps family name to a color for the family badge
const FAMILY_COLORS = {
  Papilionidae: '#c060c0',   // Purple — swallowtails
  Hesperiidae:  '#c08030',   // Amber — skippers
  Pieridae:     '#e0e050',   // Yellow — whites & sulphurs
  Riodinidae:   '#50c8c8',   // Teal — metalmarks
  Lycaenidae:   '#5080e0',   // Blue — blues & hairstreaks
  Nymphalidae:  '#e05050',   // Red — brush-foots
}

export default function ButterflyRow({ butterfly }) {
  const navigate = useNavigate()

  /*
    navigate(`/butterfly/${butterfly.id}`) — when the user taps a row,
    React Router changes the URL to /butterfly/42 (for example)
    and renders the DetailPage for that butterfly.
    The browser back button returns to the list automatically.
  */
  const handleTap = () => navigate(`/butterfly/${butterfly.id}`)

  const familyColor = FAMILY_COLORS[butterfly.family] || 'var(--color-blue)'
  const isPlaceholder = butterfly.data_quality === 'placeholder'

  return (
    <button
      onClick={handleTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        background: 'var(--color-bg-card)',
        border: 'none',
        borderBottom: '2px solid var(--color-bg)',
        padding: 'var(--space-3) var(--space-4)',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-pixel)',
        /* Subtle press effect on tap */
        transition: 'background 0.08s',
      }}
      /* Accessibility: tells screen readers this is a button leading to more info */
      aria-label={`View ${butterfly.common_name}, ${butterfly.scientific_name}`}
    >
      {/* ── ID number badge ── */}
      <span style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-dim)',
        minWidth: '36px',
        textAlign: 'right',
        flexShrink: 0,
        lineHeight: 1,
      }}>
        #{String(butterfly.id).padStart(3, '0')}
      </span>

      {/* ── Sprite / thumbnail ── */}
      <PixelSprite
        src={butterfly.images.thumbnail}
        alt={butterfly.scientific_name}
        size={52}
      />

      {/* ── Name block ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--text-sm)',
          lineHeight: 1.6,
          /*
            textOverflow: 'ellipsis' truncates long names with "..."
            instead of wrapping onto a second line.
            Requires overflow: hidden and whiteSpace: nowrap to work.
          */
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}>
          {butterfly.common_name}
        </div>

        <div style={{
          fontSize: 'var(--text-xs)',
          fontStyle: 'italic',
          color: 'var(--color-text-dim)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          marginTop: '2px',
        }}>
          {butterfly.scientific_name}
        </div>

        {/* ── Family badge ── */}
        <div style={{ marginTop: 'var(--space-1)', display: 'flex', gap: 'var(--space-1)' }}>
          <span style={{
            fontSize: '7px',
            color: familyColor,
            border: `1px solid ${familyColor}`,
            padding: '1px 4px',
            lineHeight: 1.6,
          }}>
            {butterfly.family.toUpperCase()}
          </span>

          {/* Endemic badge — only shown for confirmed Cuban endemics */}
          {butterfly.endemic_to_cuba && (
            <span style={{
              fontSize: '7px',
              color: 'var(--color-red)',
              border: '1px solid var(--color-red)',
              padding: '1px 4px',
              lineHeight: 1.6,
            }}>
              ENDEMIC
            </span>
          )}
        </div>
      </div>

      {/* ── Chevron arrow ── */}
      <span style={{
        color: 'var(--color-accent)',
        fontSize: 'var(--text-sm)',
        flexShrink: 0,
      }}>
        ▶
      </span>
    </button>
  )
}
