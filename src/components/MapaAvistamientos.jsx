import catalogo from '../data/zonas.json'
import { aRuta, aX, aY, ANCHO_MAPA, ALTO_MAPA, metrosAGradosLat, MAPA } from '../lib/geometria'

/* ══════════════════════════════════════════════════════════════
   MapaAvistamientos — dónde has visto esta especie.

   Sombrea las provincias con avistamientos, con más intensidad
   donde has visto más, y pone el número debajo del nombre. Encima
   marca los puntos GPS exactos.

   Nota de escala: un disco de 500 m en un mapa de toda Cuba mide
   menos de un píxel. Por eso los puntos se dibujan con un radio
   mínimo visible: son marcas de posición, no la extensión real.
   ══════════════════════════════════════════════════════════════ */

const { contorno, provincias: PROVINCIAS, latitud_division: LAT_DIV } = catalogo
const RADIO_MINIMO = 3.5   // unidades de mapa, para que el punto se vea

export default function MapaAvistamientos({ avistamientos = [], conteoPorProvincia = {} }) {
  const maximo = Math.max(1, ...Object.values(conteoPorProvincia))
  const conPunto = avistamientos.filter(a => a.lat != null && a.lon != null)

  if (avistamientos.length === 0) return null

  const radioReal = metrosAGradosLat(500) * MAPA.k

  return (
    <div>
      <div
        style={{
          background: '#0E1513',
          borderRadius: 'var(--r-panel)',
          boxShadow: 'inset 0 0 0 1px var(--linea)',
          overflow: 'hidden'
        }}
      >
        <svg
          viewBox={`0 0 ${ANCHO_MAPA.toFixed(0)} ${ALTO_MAPA.toFixed(0)}`}
          role="img"
          aria-label="Mapa de tus avistamientos"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        >
          <defs>
            <clipPath id="recorte-avist">
              <path d={aRuta(contorno.cuba)} />
              <path d={aRuta(contorno.isla_juventud)} />
            </clipPath>
          </defs>

          <path d={aRuta(contorno.cuba)} fill="#1E2C29" stroke="#384944" strokeWidth="1.5" />
          <path d={aRuta(contorno.isla_juventud)} fill="#1E2C29" stroke="#384944" strokeWidth="1.5" />

          {/* Provincias sombreadas según el número de avistamientos */}
          {PROVINCIAS.map(p => {
            const n = conteoPorProvincia[p.nombre] || 0
            if (n === 0) return null

            // Intensidad proporcional, con un suelo para que se vea con 1.
            const alfa = 0.25 + 0.55 * (n / maximo)

            if (p.contorno) {
              return (
                <path
                  key={p.nombre}
                  d={aRuta(contorno[p.contorno])}
                  fill={`rgba(217,162,39,${alfa.toFixed(2)})`}
                />
              )
            }

            const x0 = aX(p.lon0)
            const x1 = aX(p.lon1)
            const yArriba = p.mitad === 'sur' ? aY(LAT_DIV) : 0
            const yAbajo = p.mitad === 'norte' ? aY(LAT_DIV) : ALTO_MAPA

            return (
              <rect
                key={p.nombre}
                x={Math.min(x0, x1)}
                y={yArriba}
                width={Math.abs(x1 - x0)}
                height={yAbajo - yArriba}
                fill={`rgba(217,162,39,${alfa.toFixed(2)})`}
                clipPath="url(#recorte-avist)"
              />
            )
          })}

          {/* Puntos GPS exactos */}
          {conPunto.map(a => (
            <g key={a.id}>
              {/* Halo de 500 m, con un suelo visible: a esta escala el
                  tamaño real es menor que un píxel. */}
              <circle
                cx={aX(a.lon)} cy={aY(a.lat)}
                r={Math.max(RADIO_MINIMO, radioReal)}
                fill="rgba(63,168,155,.3)"
              />
              <circle
                cx={aX(a.lon)} cy={aY(a.lat)} r="2.4"
                fill={a.capturada ? 'var(--grana)' : 'var(--atala)'}
                stroke="#07100E" strokeWidth=".8"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Nombre de la provincia con el número debajo */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 'var(--e-2)',
          marginTop: 'var(--e-3)'
        }}
      >
        {Object.entries(conteoPorProvincia)
          .sort((a, b) => b[1] - a[1])
          .map(([nombre, n]) => (
            <div
              key={nombre}
              style={{
                padding: '6px 11px',
                background: 'var(--sombra-alt)',
                borderRadius: 'var(--r-panel)',
                boxShadow: 'inset 0 0 0 1px var(--linea)',
                textAlign: 'center',
                minWidth: 76
              }}
            >
              <div style={{ fontSize: 'var(--t-12)', lineHeight: 1.3 }}>{nombre}</div>
              <div
                style={{
                  fontSize: 'var(--t-17)', fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--polen)', lineHeight: 1.2
                }}
              >
                {n}
              </div>
            </div>
          ))}
      </div>

      {/* Leyenda */}
      <div
        className="fila"
        style={{ gap: 'var(--e-4)', marginTop: 'var(--e-3)', flexWrap: 'wrap' }}
      >
        <span className="fila" style={{ gap: 5, fontSize: 'var(--t-11)', color: 'var(--papel-tenue)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--atala)' }} />
          observada
        </span>
        <span className="fila" style={{ gap: 5, fontSize: 'var(--t-11)', color: 'var(--papel-tenue)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--grana)' }} />
          capturada
        </span>
      </div>
    </div>
  )
}
