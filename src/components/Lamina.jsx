import { useState, useEffect, memo } from 'react'

/* ══════════════════════════════════════════════════════════════
   Lamina — una imagen que sabe fallar con dignidad.

   Mientras no tengas las fotos, en vez de un icono roto aparece
   una silueta de alas dibujada en SVG. Se ve intencional, no
   averiada.
   ══════════════════════════════════════════════════════════════ */

function Lamina({ src, alt, relacion = '1', radio = 0 }) {
  const [falló, setFalló] = useState(false)

  // Si cambia la fuente (p.ej. al pasar de lámina a montado),
  // hay que volver a intentarlo.
  useEffect(() => { setFalló(false) }, [src])

  const marco = {
    position: 'relative',
    width: '100%',
    aspectRatio: relacion,
    background: 'var(--sombra-alt)',
    borderRadius: radio,
    overflow: 'hidden'
  }

  if (!src || falló) {
    return (
      <div style={marco} role="img" aria-label={`Sin imagen de ${alt}`}>
        {SILUETA}
      </div>
    )
  }

  return (
    <div style={marco}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFalló(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}

/* Silueta de mariposa, centrada y muy tenue.

   Cuatro trazos en vez de once: con 207 tarjetas en la cuadrícula,
   cada nodo del SVG se multiplica por 207. Se define una sola vez
   fuera del componente para que React no la reconstruya en cada
   render. */
const SILUETA = (
  <svg
    viewBox="0 0 48 48"
    aria-hidden="true"
    style={{
      position: 'absolute',
      inset: 0,
      margin: 'auto',
      width: '40%',
      height: '40%',
      opacity: 0.16
    }}
  >
    <g fill="none" stroke="var(--papel)" strokeWidth="1.5" strokeLinejoin="round">
      {/* alas izquierdas */}
      <path d="M23 22 C15 8, 5 9, 5 17 C5 24, 14 25, 23 24 Z M23 25 C16 27, 8 30, 10 36 C12 41, 20 34, 23 29 Z" />
      {/* alas derechas */}
      <path d="M25 22 C33 8, 43 9, 43 17 C43 24, 34 25, 25 24 Z M25 25 C32 27, 40 30, 38 36 C36 41, 28 34, 25 29 Z" />
      {/* cuerpo */}
      <path d="M24 18 L24 34" />
      {/* antenas */}
      <path d="M24 18 C22 14, 20 12, 18 11 M24 18 C26 14, 28 12, 30 11" />
    </g>
  </svg>
)

export default memo(Lamina)
