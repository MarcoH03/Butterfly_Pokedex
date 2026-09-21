import { useRef, useState, useEffect } from 'react'
import Lamina from './Lamina'
import { comprimirImagen } from '../lib/almacen'

/* ══════════════════════════════════════════════════════════════
   RanuraFoto — un hueco de foto que se puede llenar desde la app.

   Sirve para los estadios del ciclo de vida: huevo, larva, pupa y
   planta hospedera. Mientras no tengas la foto muestra la silueta
   y un botón; cuando la consigues en el campo, la añades desde el
   teléfono y se guarda ahí mismo.

   El menú es una hoja que sube desde abajo, no un globo junto al
   botón. Antes crecía hacia arriba desde la miniatura y, si la
   ranura estaba en la parte alta de la pantalla, el contenedor con
   scroll de la ficha lo recortaba: la primera opción quedaba
   fuera. Una hoja fija al borde inferior no se puede recortar, y
   además da un área de toque mayor.

   Dos entradas de archivo distintas, porque en iOS es lo que
   separa la cámara del carrete:
     - capture="environment" abre la cámara trasera
     - sin capture abre la galería
   ══════════════════════════════════════════════════════════════ */

export default function RanuraFoto({
  src,
  alt,
  tamano = 76,
  editable = true,
  onFoto,
  onBorrar,
  esPropia = false,
  onAbrir
}) {
  const entradaCamara = useRef(null)
  const entradaGaleria = useRef(null)
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState('')

  // Cerrar con Escape, como las demás hojas
  useEffect(() => {
    if (!menu) return
    const alPulsar = ev => { if (ev.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [menu])

  const recibir = async ev => {
    const archivo = ev.target.files?.[0]
    ev.target.value = ''
    setMenu(false)
    if (!archivo) return
    setError('')
    try {
      const dataUrl = await comprimirImagen(archivo)
      onFoto?.(dataUrl)
    } catch {
      setError('No se pudo procesar la imagen.')
    }
  }

  return (
    <div style={{ width: tamano, flexShrink: 0, position: 'relative' }}>
      <input
        ref={entradaCamara} type="file" accept="image/*" capture="environment"
        onChange={recibir} style={{ display: 'none' }}
      />
      <input
        ref={entradaGaleria} type="file" accept="image/*"
        onChange={recibir} style={{ display: 'none' }}
      />

      <button
        onClick={() => (src ? onAbrir?.() : editable && setMenu(true))}
        aria-label={src ? `Ver ${alt} a pantalla completa` : `Añadir foto de ${alt}`}
        style={{ display: 'block', width: '100%', padding: 0 }}
      >
        <Lamina src={src} alt={alt} relacion="1" radio={4} />
      </button>

      {src && esPropia && (
        <span
          title="Foto tuya"
          style={{
            position: 'absolute', top: 4, left: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--polen)'
          }}
        />
      )}

      {editable && (
        <button
          onClick={() => setMenu(true)}
          aria-label={src ? 'Cambiar foto' : 'Añadir foto'}
          style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 26, height: 26, borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            fontSize: 15, lineHeight: 1,
            color: 'var(--sombra)', background: 'var(--atala)',
            boxShadow: '0 1px 4px rgba(0,0,0,.4)'
          }}
        >
          {src ? '⋯' : '+'}
        </button>
      )}

      {error && (
        <p style={{ fontSize: 'var(--t-11)', color: 'var(--grana)', marginTop: 4 }}>
          {error}
        </p>
      )}

      {/* ── Hoja de opciones ── */}
      {menu && (
        <>
          <div
            onClick={() => setMenu(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,9,.72)', zIndex: 80 }}
          />
          <div
            role="dialog"
            aria-label={`Foto de ${alt}`}
            style={{
              position: 'fixed', bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '100%', maxWidth: 480,
              background: 'var(--sombra)',
              borderTop: '1px solid var(--linea)',
              borderRadius: '14px 14px 0 0',
              paddingBottom: 'calc(var(--safe-bot) + var(--e-2))',
              zIndex: 81
            }}
          >
            <div
              style={{
                padding: 'var(--e-4)',
                borderBottom: '1px solid var(--linea)'
              }}
            >
              <div style={{ fontSize: 'var(--t-15)', fontWeight: 600 }}>
                Foto de {alt.toLowerCase()}
              </div>
              <div style={{ fontSize: 'var(--t-11)', color: 'var(--papel-tenue)' }}>
                Se guarda en el teléfono
              </div>
            </div>

            <Opcion onClick={() => entradaCamara.current?.click()}>
              Tomar foto
            </Opcion>
            <Opcion onClick={() => entradaGaleria.current?.click()}>
              Elegir de la galería
            </Opcion>
            {src && esPropia && onBorrar && (
              <Opcion
                onClick={() => { onBorrar(); setMenu(false) }}
                color="var(--grana)"
              >
                Quitar foto
              </Opcion>
            )}
            <Opcion onClick={() => setMenu(false)} color="var(--papel-medio)">
              Cancelar
            </Opcion>
          </div>
        </>
      )}
    </div>
  )
}

function Opcion({ onClick, children, color = 'var(--papel)' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%',
        padding: 'var(--e-4)',
        fontSize: 'var(--t-15)',
        textAlign: 'left',
        color,
        borderBottom: '1px solid var(--linea)'
      }}
    >
      {children}
    </button>
  )
}
