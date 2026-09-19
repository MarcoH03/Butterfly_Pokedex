import { useNavigate } from 'react-router-dom'
import Lamina from './Lamina'

/* ══════════════════════════════════════════════════════════════
   TarjetaEspecie — una celda de la cuadrícula principal.

   La foto ocupa toda la tarjeta y el nombre va encima, sobre un
   degradado, para que la mariposa sea lo que se ve y no el marco.
   En modo selección, tocar marca en vez de abrir la ficha.
   ══════════════════════════════════════════════════════════════ */

// Un color por familia, para orientarse de un vistazo en la cuadrícula.
export const COLOR_FAMILIA = {
  Papilionidae: '#8E6FB8',
  Hesperiidae:  '#B07B3F',
  Pieridae:     '#C9A227',
  Riodinidae:   '#4A9FB0',
  Lycaenidae:   '#5C7FC0',
  Nymphalidae:  '#C34733'
}

export default function TarjetaEspecie({
  especie, vista, modoSeleccion, marcada, onMarcar, avistamientos = 0
}) {
  const navegar = useNavigate()

  const src = vista === 'montados' ? especie.imagenes.montado : especie.imagenes.lamina
  const colorFam = COLOR_FAMILIA[especie.familia] || 'var(--atala)'

  const abrir = () => {
    if (modoSeleccion) onMarcar(especie.id)
    else navegar(`/especie/${especie.id}`)
  }

  return (
    <button
      onClick={abrir}
      aria-pressed={modoSeleccion ? marcada : undefined}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        background: 'var(--sombra-alt)',
        borderRadius: 'var(--r-panel)',
        overflow: 'hidden',
        // El borde marca la selección sin mover nada de sitio.
        boxShadow: marcada
          ? 'inset 0 0 0 2px var(--atala)'
          : 'inset 0 0 0 1px var(--linea)'
      }}
    >
      {/* Imagen. Los ejemplares montados se ven mejor completos
          que recortados, así que cambia la relación de aspecto. */}
      <Lamina
        src={src}
        alt={especie.nombre}
        relacion={vista === 'montados' ? '4 / 3' : '1'}
      />

      {/* Franja de la familia: dato, no adorno */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, left: 0,
          width: 3, height: 34, background: colorFam
        }}
      />

      {/* Conteo de avistamientos propios */}
      {avistamientos > 0 && (
        <span
          title={`${avistamientos} avistamiento${avistamientos === 1 ? '' : 's'}`}
          style={{
            position: 'absolute', top: 6, right: 6,
            minWidth: 20, padding: '1px 6px',
            fontSize: 'var(--t-11)', fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--sombra)', background: 'var(--polen)',
            borderRadius: 'var(--r-control)', textAlign: 'center'
          }}
        >
          {avistamientos}
        </span>
      )}

      {/* Marca de selección */}
      {modoSeleccion && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: 6, left: 8,
            width: 22, height: 22, borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            fontSize: 13, lineHeight: 1,
            color: marcada ? 'var(--sombra)' : 'var(--papel)',
            background: marcada ? 'var(--atala)' : 'rgba(18,25,23,.72)',
            boxShadow: marcada ? 'none' : 'inset 0 0 0 1px var(--papel-tenue)'
          }}
        >
          {marcada ? '✓' : ''}
        </span>
      )}

      {/* Pie: nombre sobre degradado */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '22px var(--e-3) var(--e-2)',
          background: 'linear-gradient(to top, rgba(12,17,16,.94) 28%, transparent)'
        }}
      >
        <div
          className="binomio truncar"
          style={{ fontSize: 'var(--t-13)', color: 'var(--papel)' }}
        >
          {especie.nombre}
        </div>
        <div
          className="truncar"
          style={{ fontSize: 'var(--t-11)', color: 'var(--papel-medio)' }}
        >
          {especie.nombres_alternos?.[0] || especie.subfamilia}
        </div>
      </div>
    </button>
  )
}
