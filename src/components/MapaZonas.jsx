import { useState, useRef, useCallback } from 'react'
import catalogo from '../data/zonas.json'
import { todasLasZonas } from '../lib/zonas'
import {
  aRuta, aX, aY, aLon, aLat,
  ANCHO_MAPA, ALTO_MAPA,
  trazoAlcanzaZona, trazoAlcanzaDiscos, metrosAGradosLat, MAPA
} from '../lib/geometria'

/* ══════════════════════════════════════════════════════════════
   MapaZonas — filtro geográfico con dos modos.

   «Trazo»: pasas el dedo como un plumón. Cualquier zona que el
   trazo roce, aunque sea en parte, entra. Es lo que permite
   seleccionar áreas que no respetan los límites provinciales.

   «Provincias»: un toque por provincia, para cuando la pregunta
   sí es administrativa.

   Vista fija: se ve toda Cuba de una vez. Un disco de 500 m es
   más pequeño que un píxel a esta escala, así que se pinta con un
   radio mínimo visible — las marcas son posiciones, no
   extensiones reales.
   ══════════════════════════════════════════════════════════════ */

const { contorno, provincias: PROVINCIAS, latitud_division: LAT_DIV } = catalogo

// Radio mínimo con el que se pinta un disco, en unidades de mapa.
const RADIO_MINIMO = 3.5

// Cuánto tiene que avanzar el dedo para guardar otro punto del trazo.
const AVANCE_MINIMO = 0.015

/** Radio en unidades de mapa de un disco de `metros`. */
function radioMapa(metros) {
  return metrosAGradosLat(metros) * MAPA.k
}

export default function MapaZonas({
  modo = 'trazo',
  onCambiarModo,
  zonasElegidas = [],
  onZonasElegidas,
  provinciasElegidas = [],
  onProvinciasElegidas,
  // Para la ficha: muestra las zonas resaltadas y no deja tocar nada
  soloLectura = false
}) {
  const svgRef = useRef(null)
  const dibujando = useRef(false)
  const [trazo, setTrazo] = useState([])
  const [grosor, setGrosor] = useState(18)

  const dibujable = !soloLectura && modo === 'trazo'
  const radio = grosor / 2 / MAPA.k

  /* El dedo, en coordenadas geográficas. Hay que pasar de píxeles
     de pantalla al sistema del viewBox. */
  const aGeo = useCallback(ev => {
    const caja = svgRef.current.getBoundingClientRect()
    const x = (ev.clientX - caja.left) * (ANCHO_MAPA / caja.width)
    const y = (ev.clientY - caja.top) * (ALTO_MAPA / caja.height)
    return [aLon(x), aLat(y)]
  }, [])

  /* Una zona puede ser un polígono (las de semilla) o una unión de
     discos de 500 m (las que nacen en el campo). Se prueban las dos. */
  const recalcular = useCallback(puntos => {
    const alcanzadas = todasLasZonas()
      .filter(z =>
        (z.discos?.length && trazoAlcanzaDiscos(puntos, z.discos, radio)) ||
        (z.poligono?.length && trazoAlcanzaZona(puntos, z.poligono, radio)))
      .map(z => z.id)
    onZonasElegidas?.(alcanzadas)
  }, [onZonasElegidas, radio])

  const alBajar = ev => {
    if (!dibujable) return
    ev.preventDefault()
    dibujando.current = true
    svgRef.current.setPointerCapture(ev.pointerId)
    const punto = aGeo(ev)
    setTrazo([punto])
    recalcular([punto])
  }

  const alMover = ev => {
    if (!dibujando.current) return
    const punto = aGeo(ev)
    setTrazo(previos => {
      const ultimo = previos[previos.length - 1]
      if (ultimo && Math.hypot(punto[0] - ultimo[0], punto[1] - ultimo[1]) < AVANCE_MINIMO) {
        return previos
      }
      const nuevos = [...previos, punto]
      recalcular(nuevos)
      return nuevos
    })
  }

  const alSoltar = () => { dibujando.current = false }

  const limpiarTrazo = () => {
    setTrazo([])
    onZonasElegidas?.([])
  }

  const alternarProvincia = nombre => {
    if (soloLectura) return
    onProvinciasElegidas?.(
      provinciasElegidas.includes(nombre)
        ? provinciasElegidas.filter(p => p !== nombre)
        : [...provinciasElegidas, nombre]
    )
  }

  const zonas = todasLasZonas()

  return (
    <div>
      {/* Conmutador de modo */}
      {!soloLectura && (
        <div
          style={{
            display: 'flex', padding: 2, marginBottom: 'var(--e-3)',
            background: 'var(--sombra-alt)', borderRadius: 'var(--r-control)',
            boxShadow: 'inset 0 0 0 1px var(--linea)'
          }}
        >
          {[['trazo', 'Trazo'], ['provincias', 'Provincias']].map(([valor, texto]) => (
            <button
              key={valor}
              onClick={() => onCambiarModo?.(valor)}
              aria-pressed={modo === valor}
              style={{
                flex: 1, padding: '7px 13px', fontSize: 'var(--t-12)',
                fontWeight: modo === valor ? 600 : 400,
                borderRadius: 'var(--r-control)',
                color: modo === valor ? 'var(--papel)' : 'var(--papel-medio)',
                background: modo === valor ? 'var(--segmento-activo)' : 'transparent',
                boxShadow: modo === valor ? 'var(--sombra-segmento)' : 'none'
              }}
            >
              {texto}
            </button>
          ))}
        </div>
      )}

      {/* Mapa */}
      <div
        style={{
          background: '#0E1513',
          borderRadius: 'var(--r-panel)',
          boxShadow: 'inset 0 0 0 1px var(--linea)',
          overflow: 'hidden'
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${ANCHO_MAPA.toFixed(0)} ${ALTO_MAPA.toFixed(0)}`}
          role="img"
          aria-label="Mapa de Cuba"
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          style={{
            display: 'block', width: '100%', height: 'auto',
            touchAction: 'none',
            cursor: dibujable ? 'crosshair' : 'default'
          }}
        >
          <defs>
            <clipPath id="recorte-cuba">
              <path d={aRuta(contorno.cuba)} />
              <path d={aRuta(contorno.isla_juventud)} />
            </clipPath>
          </defs>

          {/* Tierra */}
          <path d={aRuta(contorno.cuba)} fill="#243430" stroke="#3A4C47" strokeWidth="1.5" />
          <path d={aRuta(contorno.isla_juventud)} fill="#243430" stroke="#3A4C47" strokeWidth="1.5" />

          {modo === 'provincias' ? (
            /* Bandas de provincia, recortadas al contorno.
               Provisional: con polígonos reales esto es un <path> por
               provincia. Ver GUIA-DATOS.md. */
            PROVINCIAS.map(p => {
              const activa = provinciasElegidas.includes(p.nombre)
              const comun = {
                fill: activa ? 'rgba(63,168,155,.42)' : 'transparent',
                stroke: 'rgba(236,232,220,.13)',
                strokeWidth: 1,
                style: { cursor: 'pointer' }
              }

              if (p.contorno) {
                return (
                  <path
                    key={p.nombre}
                    d={aRuta(contorno[p.contorno])}
                    onClick={() => alternarProvincia(p.nombre)}
                    {...comun}
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
                  x={Math.min(x0, x1)} y={yArriba}
                  width={Math.abs(x1 - x0)} height={yAbajo - yArriba}
                  clipPath="url(#recorte-cuba)"
                  onClick={() => alternarProvincia(p.nombre)}
                  {...comun}
                />
              )
            })
          ) : (
            /* Zonas: polígonos y discos */
            zonas.map(z => {
              const tocada = zonasElegidas.includes(z.id)
              const relleno = tocada ? 'rgba(63,168,155,.5)' : 'rgba(217,162,39,.16)'
              const borde = tocada ? 'var(--atala)' : 'rgba(217,162,39,.5)'
              const grueso = tocada ? 2 : 1.2

              return (
                <g key={z.id}>
                  {z.poligono?.length > 0 && (
                    <path d={aRuta(z.poligono)} fill={relleno} stroke={borde} strokeWidth={grueso} />
                  )}
                  {(z.discos || []).map((d, k) => (
                    <circle
                      key={k}
                      cx={aX(d.lon)} cy={aY(d.lat)}
                      r={Math.max(RADIO_MINIMO, radioMapa(d.r))}
                      fill={relleno} stroke={borde} strokeWidth={grueso}
                    />
                  ))}
                </g>
              )
            })
          )}

          {/* Trazo del dedo */}
          {modo === 'trazo' && trazo.length > 1 && (
            <polyline
              points={trazo.map(([lo, la]) => `${aX(lo).toFixed(1)},${aY(la).toFixed(1)}`).join(' ')}
              fill="none"
              stroke="var(--grana)"
              strokeOpacity=".55"
              strokeWidth={grosor}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>
      </div>

      {!soloLectura && (
        <>
          <p style={{
            fontSize: 'var(--t-11)', color: 'var(--papel-tenue)',
            marginTop: 'var(--e-2)', lineHeight: 1.5
          }}>
            {modo === 'trazo'
              ? 'Cada área amarilla es una zona de distribución. Pasa el dedo por encima: si el trazo la roza aunque sea en parte, sus especies entran.'
              : 'Toca las provincias que te interesen.'}
          </p>

          {modo === 'trazo' && (
            <div className="fila" style={{ gap: 'var(--e-3)', marginTop: 'var(--e-3)' }}>
              <span style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}>Grosor</span>
              <input
                type="range" min="6" max="40" value={grosor}
                onChange={e => {
                  setGrosor(Number(e.target.value))
                  if (trazo.length) recalcular(trazo)
                }}
                aria-label="Grosor del trazo"
                className="crece"
                style={{ accentColor: 'var(--atala)' }}
              />
              {trazo.length > 0 && (
                <button onClick={limpiarTrazo}
                  style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}>
                  Borrar
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Zonas por id, leídas en el momento: el catálogo crece con el campo. */
export const ZONA_POR_ID = new Proxy({}, {
  get: (_, id) => todasLasZonas().find(z => z.id === id)
})
export { PROVINCIAS }
