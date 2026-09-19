import { useEffect } from 'react'

/* ══════════════════════════════════════════════════════════════
   PanelFiltros — hoja que sube desde abajo.

   Cinco grupos: familia, subfamilia, zona geográfica, color y
   tamaño. Todos funcionan igual: tocar añade o quita.
   ══════════════════════════════════════════════════════════════ */

// Muestras de color para el filtro cromático
const MUESTRAS = {
  negro: '#1C1C1C',
  blanco: '#EFEFEA',
  amarillo: '#E0B932',
  naranja: '#D97A2B',
  pardo: '#7A5A3C',
  azul: '#3E62B8',
  verde: '#3C8A4A',
  rojo: '#BE3B2C',
  gris: '#8A8F8C',
  iridiscente: 'linear-gradient(120deg,#6FD6C0,#4F86D6,#A97BD6)'
}

const AYUDA_TAMANO = {
  'pequeña': 'hasta 35 mm',
  'mediana': '35 a 70 mm',
  'grande': 'más de 70 mm'
}

export default function PanelFiltros({
  abierto, onCerrar, filtros, alternarFiltro, limpiar, opciones, nActivos, nResultados
}) {
  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return
    const alPulsar = e => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <>
      <div
        onClick={onCerrar}
        style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,9,.7)', zIndex: 60 }}
      />

      <div
        role="dialog"
        aria-label="Filtros"
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, maxHeight: '82vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--sombra)',
          borderTop: '1px solid var(--linea)',
          borderRadius: '14px 14px 0 0',
          paddingBottom: 'var(--safe-bot)',
          zIndex: 61
        }}
      >
        {/* Cabecera */}
        <div
          className="fila"
          style={{
            gap: 'var(--e-3)',
            padding: 'var(--e-4)',
            borderBottom: '1px solid var(--linea)'
          }}
        >
          <span className="crece" style={{ fontSize: 'var(--t-17)', fontWeight: 600 }}>
            Filtros
          </span>
          {nActivos > 0 && (
            <button
              onClick={limpiar}
              style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}
            >
              Quitar todo
            </button>
          )}
          <button
            onClick={onCerrar}
            style={{
              fontSize: 'var(--t-13)', fontWeight: 600,
              color: 'var(--sombra)', background: 'var(--atala)',
              padding: '7px 16px', borderRadius: 'var(--r-control)'
            }}
          >
            Ver {nResultados}
          </button>
        </div>

        {/* Grupos */}
        <div style={{ overflowY: 'auto', padding: 'var(--e-4)' }}>
          <Grupo titulo="Familia">
            <Fichas
              opciones={opciones.familias}
              activas={filtros.familias}
              onTocar={v => alternarFiltro('familias', v)}
              cursiva
            />
          </Grupo>

          <Grupo titulo="Subfamilia">
            <Fichas
              opciones={opciones.subfamilias}
              activas={filtros.subfamilias}
              onTocar={v => alternarFiltro('subfamilias', v)}
              cursiva
            />
          </Grupo>

          <Grupo titulo="Zona geográfica">
            <Fichas
              opciones={opciones.zonas}
              activas={filtros.zonas}
              onTocar={v => alternarFiltro('zonas', v)}
            />
          </Grupo>

          <Grupo titulo="Color">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--e-2)' }}>
              {opciones.colores.map(color => {
                const activa = filtros.colores.includes(color)
                return (
                  <button
                    key={color}
                    onClick={() => alternarFiltro('colores', color)}
                    aria-pressed={activa}
                    className="fila"
                    style={{
                      gap: 7,
                      padding: '7px 13px 7px 9px',
                      borderRadius: 'var(--r-control)',
                      fontSize: 'var(--t-13)',
                      color: activa ? 'var(--sombra)' : 'var(--papel)',
                      background: activa ? 'var(--atala)' : 'var(--sombra-alt)',
                      boxShadow: activa ? 'none' : 'inset 0 0 0 1px var(--linea)'
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 13, height: 13, borderRadius: '50%',
                        background: MUESTRAS[color] || color,
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.28)',
                        flexShrink: 0
                      }}
                    />
                    {color}
                  </button>
                )
              })}
            </div>
          </Grupo>

          <Grupo titulo="Tamaño">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--e-2)' }}>
              {opciones.tamanos.map(t => {
                const activa = filtros.tamanos.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => alternarFiltro('tamanos', t)}
                    aria-pressed={activa}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--r-control)',
                      fontSize: 'var(--t-13)',
                      textAlign: 'left',
                      color: activa ? 'var(--sombra)' : 'var(--papel)',
                      background: activa ? 'var(--atala)' : 'var(--sombra-alt)',
                      boxShadow: activa ? 'none' : 'inset 0 0 0 1px var(--linea)'
                    }}
                  >
                    {t}
                    <span
                      style={{
                        display: 'block',
                        fontSize: 'var(--t-11)',
                        color: activa ? 'rgba(18,25,23,.7)' : 'var(--papel-tenue)'
                      }}
                    >
                      {AYUDA_TAMANO[t]}
                    </span>
                  </button>
                )
              })}
            </div>
          </Grupo>
        </div>
      </div>
    </>
  )
}

function Grupo({ titulo, children }) {
  return (
    <section style={{ marginBottom: 'var(--e-6)' }}>
      <h3
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 'var(--t-15)',
          fontWeight: 600,
          marginBottom: 'var(--e-3)'
        }}
      >
        {titulo}
      </h3>
      {children}
    </section>
  )
}

function Fichas({ opciones, activas, onTocar, cursiva }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--e-2)' }}>
      {opciones.map(o => {
        const activa = activas.includes(o)
        return (
          <button
            key={o}
            onClick={() => onTocar(o)}
            aria-pressed={activa}
            className={cursiva ? 'binomio' : undefined}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--r-control)',
              fontSize: 'var(--t-13)',
              color: activa ? 'var(--sombra)' : 'var(--papel)',
              background: activa ? 'var(--atala)' : 'var(--sombra-alt)',
              boxShadow: activa ? 'none' : 'inset 0 0 0 1px var(--linea)'
            }}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}
