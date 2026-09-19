import { useState, useRef, useEffect, useCallback } from 'react'

/* ══════════════════════════════════════════════════════════════
   Visor — cualquier imagen a pantalla completa, con zoom.

   Gestos:
     - pellizcar con dos dedos  -> acercar y alejar
     - doble toque              -> alterna 1x y 2.5x en ese punto
     - arrastrar (con zoom)     -> mover la imagen
     - arrastrar hacia abajo    -> cerrar
     - tecla Escape             -> cerrar

   Hace falta para las láminas y sobre todo para los ejemplares
   montados, donde el detalle está en manchas de un milímetro.
   ══════════════════════════════════════════════════════════════ */

const ZOOM_MIN = 1
const ZOOM_MAX = 6
const ZOOM_DOBLE_TOQUE = 2.5

export default function Visor({ imagenes = [], indice = 0, onCerrar }) {
  const [i, setI] = useState(indice)
  const [zoom, setZoom] = useState(1)
  const [desp, setDesp] = useState({ x: 0, y: 0 })

  const punteros = useRef(new Map())
  const inicio = useRef(null)
  const ultimoToque = useRef(0)
  const caja = useRef(null)

  const actual = imagenes[i]

  /* Cerrar con Escape y bloquear el scroll del fondo */
  useEffect(() => {
    const alPulsar = e => {
      if (e.key === 'Escape') onCerrar()
      if (e.key === 'ArrowRight') cambiar(1)
      if (e.key === 'ArrowLeft') cambiar(-1)
    }
    window.addEventListener('keydown', alPulsar)
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = previo
    }
  })

  const reiniciar = () => { setZoom(1); setDesp({ x: 0, y: 0 }) }

  const cambiar = useCallback(paso => {
    setI(prev => {
      const siguiente = prev + paso
      if (siguiente < 0 || siguiente >= imagenes.length) return prev
      return siguiente
    })
    reiniciar()
  }, [imagenes.length])

  /* ── Gestos ── */

  const alBajar = ev => {
    punteros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    ev.currentTarget.setPointerCapture(ev.pointerId)

    // Doble toque
    if (punteros.current.size === 1) {
      const ahora = Date.now()
      if (ahora - ultimoToque.current < 300) {
        if (zoom > 1) reiniciar()
        else acercarEn(ev.clientX, ev.clientY, ZOOM_DOBLE_TOQUE)
        ultimoToque.current = 0
        return
      }
      ultimoToque.current = ahora
    }

    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()]
      inicio.current = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        zoom,
        desp: { ...desp }
      }
    } else {
      inicio.current = { x: ev.clientX, y: ev.clientY, desp: { ...desp }, zoom }
    }
  }

  const alMover = ev => {
    if (!punteros.current.has(ev.pointerId)) return
    punteros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })

    // Pellizco
    if (punteros.current.size === 2 && inicio.current?.dist) {
      const [a, b] = [...punteros.current.values()]
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const nuevo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN,
        inicio.current.zoom * (dist / inicio.current.dist)))
      setZoom(nuevo)
      return
    }

    // Arrastre
    if (punteros.current.size === 1 && inicio.current) {
      const dx = ev.clientX - inicio.current.x
      const dy = ev.clientY - inicio.current.y

      if (zoom > 1) {
        setDesp(limitar({
          x: inicio.current.desp.x + dx,
          y: inicio.current.desp.y + dy
        }, zoom))
      } else if (dy > 90 && Math.abs(dx) < 60) {
        // Arrastrar hacia abajo sin zoom = cerrar
        onCerrar()
      }
    }
  }

  const alSoltar = ev => {
    punteros.current.delete(ev.pointerId)
    if (punteros.current.size === 0) inicio.current = null
    if (zoom <= 1.02) reiniciar()
  }

  /** No dejar que la imagen se vaya del todo de la pantalla. */
  function limitar(d, z) {
    const r = caja.current?.getBoundingClientRect()
    if (!r) return d
    const maxX = (r.width * (z - 1)) / 2
    const maxY = (r.height * (z - 1)) / 2
    return {
      x: Math.max(-maxX, Math.min(maxX, d.x)),
      y: Math.max(-maxY, Math.min(maxY, d.y))
    }
  }

  /** Acerca centrando en el punto tocado. */
  function acercarEn(clientX, clientY, nuevoZoom) {
    const r = caja.current?.getBoundingClientRect()
    if (!r) { setZoom(nuevoZoom); return }
    const cx = clientX - r.left - r.width / 2
    const cy = clientY - r.top - r.height / 2
    setZoom(nuevoZoom)
    setDesp(limitar({ x: -cx * (nuevoZoom - 1), y: -cy * (nuevoZoom - 1) }, nuevoZoom))
  }

  if (!actual) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={actual.pie || 'Imagen a pantalla completa'}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: '#07100E',
        display: 'flex', flexDirection: 'column'
      }}
    >
      {/* Barra superior */}
      <div
        className="fila"
        style={{
          gap: 'var(--e-3)',
          padding: `calc(var(--safe-top) + var(--e-3)) var(--e-4) var(--e-3)`,
          position: 'relative', zIndex: 2
        }}
      >
        <span className="crece truncar" style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}>
          {actual.pie}
          {imagenes.length > 1 && (
            <span style={{ color: 'var(--papel-tenue)' }}> · {i + 1} de {imagenes.length}</span>
          )}
        </span>
        {zoom > 1.02 && (
          <button
            onClick={reiniciar}
            style={{ fontSize: 'var(--t-12)', color: 'var(--papel-medio)' }}
          >
            {zoom.toFixed(1)}× · ajustar
          </button>
        )}
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            fontSize: 15, color: 'var(--papel)',
            background: 'rgba(236,232,220,.12)'
          }}
        >
          ✕
        </button>
      </div>

      {/* Lienzo */}
      <div
        ref={caja}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        style={{
          flex: 1, overflow: 'hidden',
          display: 'grid', placeItems: 'center',
          touchAction: 'none', cursor: zoom > 1 ? 'grab' : 'zoom-in'
        }}
      >
        <img
          src={actual.src}
          alt={actual.pie || ''}
          draggable="false"
          style={{
            maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain',
            transform: `translate(${desp.x}px, ${desp.y}px) scale(${zoom})`,
            transformOrigin: 'center',
            transition: punteros.current.size ? 'none' : 'transform .18s ease-out',
            userSelect: 'none'
          }}
        />
      </div>

      {/* Navegación entre imágenes */}
      {imagenes.length > 1 && (
        <div
          className="fila"
          style={{
            gap: 'var(--e-2)', justifyContent: 'center',
            padding: `var(--e-3) var(--e-4) calc(var(--e-4) + var(--safe-bot))`
          }}
        >
          {imagenes.map((im, k) => (
            <button
              key={k}
              onClick={() => { setI(k); reiniciar() }}
              aria-label={im.pie}
              aria-current={k === i}
              style={{
                width: k === i ? 22 : 8, height: 8,
                borderRadius: 'var(--r-control)',
                background: k === i ? 'var(--atala)' : 'rgba(236,232,220,.25)'
              }}
            />
          ))}
        </div>
      )}

      <p
        style={{
          position: 'absolute', bottom: 'calc(var(--safe-bot) + 4px)', left: 0, right: 0,
          textAlign: 'center', fontSize: 'var(--t-11)', color: 'var(--papel-tenue)',
          pointerEvents: 'none'
        }}
      >
        {zoom > 1.02 ? 'Arrastra para mover · doble toque para ajustar' : 'Pellizca o haz doble toque para acercar'}
      </p>
    </div>
  )
}
