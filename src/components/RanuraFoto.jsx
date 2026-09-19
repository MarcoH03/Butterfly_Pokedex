import { useRef, useState } from 'react'
import Lamina from './Lamina'
import { comprimirImagen } from '../lib/almacen'

/* ══════════════════════════════════════════════════════════════
   RanuraFoto — un hueco de foto que se puede llenar desde la app.

   Sirve para los estadios del ciclo de vida: huevo, larva, pupa y
   planta hospedera. Mientras no tengas la foto muestra la silueta
   y un botón; cuando la consigues en el campo, la añades desde el
   teléfono y se guarda ahí mismo.

   Dos entradas de archivo distintas, porque en iOS es lo que
   separa la cámara del carrete:
     - capture="environment" abre la cámara trasera
     - sin capture abre la galería
   ══════════════════════════════════════════════════════════════ */

export default function RanuraFoto({
  src,                 // foto actual (data URL o ruta del catálogo)
  alt,
  tamano = 76,
  editable = true,
  onFoto,              // (dataUrl) => void
  onBorrar,            // () => void
  esPropia = false,    // true si la foto la añadiste tú
  onAbrir              // () => void  — para el visor a pantalla completa
}) {
  const entradaCamara = useRef(null)
  const entradaGaleria = useRef(null)
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState('')

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

      {/* La imagen: tocarla abre el visor si hay foto, o el menú si no */}
      <button
        onClick={() => (src ? onAbrir?.() : editable && setMenu(true))}
        aria-label={src ? `Ver ${alt} a pantalla completa` : `Añadir foto de ${alt}`}
        style={{ display: 'block', width: '100%', padding: 0 }}
      >
        <Lamina src={src} alt={alt} relacion="1" radio={4} />
      </button>

      {/* Marca de foto propia */}
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

      {/* Botón de acción */}
      {editable && (
        <button
          onClick={() => setMenu(m => !m)}
          aria-label={src ? 'Cambiar foto' : 'Añadir foto'}
          style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 24, height: 24, borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            fontSize: 14, lineHeight: 1,
            color: 'var(--sombra)', background: 'var(--atala)',
            boxShadow: '0 1px 4px rgba(0,0,0,.4)'
          }}
        >
          {src ? '⋯' : '+'}
        </button>
      )}

      {/* Menú: cámara o galería */}
      {menu && (
        <>
          <div
            onClick={() => setMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: 'absolute', bottom: 32, right: 0, zIndex: 41,
              minWidth: 150,
              display: 'flex', flexDirection: 'column',
              background: 'var(--sombra-alt)',
              borderRadius: 'var(--r-panel)',
              boxShadow: '0 4px 16px rgba(0,0,0,.5), inset 0 0 0 1px var(--linea)',
              overflow: 'hidden'
            }}
          >
            <OpcionMenu onClick={() => entradaCamara.current?.click()}>
              Tomar foto
            </OpcionMenu>
            <OpcionMenu onClick={() => entradaGaleria.current?.click()}>
              Elegir de la galería
            </OpcionMenu>
            {src && esPropia && onBorrar && (
              <OpcionMenu
                onClick={() => { onBorrar(); setMenu(false) }}
                color="var(--grana)"
              >
                Quitar foto
              </OpcionMenu>
            )}
          </div>
        </>
      )}

      {error && (
        <p style={{ fontSize: 'var(--t-11)', color: 'var(--grana)', marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function OpcionMenu({ onClick, children, color = 'var(--papel)' }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '11px 14px',
        fontSize: 'var(--t-13)',
        textAlign: 'left',
        color,
        borderBottom: '1px solid var(--linea)'
      }}
    >
      {children}
    </button>
  )
}
