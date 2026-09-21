import { useEffect, useState } from 'react'
import MapaZonas, { ZONA_POR_ID } from './MapaZonas'

/* ══════════════════════════════════════════════════════════════
   PanelFiltros — hoja que sube desde abajo.

   Cinco grupos: familia, subfamilia, zona geográfica, color y
   tamaño. Todos menos la zona funcionan igual: tocar añade o
   quita.

   La zona geográfica no es una lista de nombres, porque las zonas
   son polígonos que no respetan los límites provinciales: se
   elige sobre el mapa, con el trazo del dedo o tocando
   provincias.
   ══════════════════════════════════════════════════════════════ */

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
  abierto, onCerrar,
  filtros, alternarFiltro, limpiar,
  fijarZonas, fijarProvincias,
  opciones, nActivos, nResultados
}) {
  const [mapaVisible, setMapaVisible] = useState(false)
  const [modoZona, setModoZona] = useState('trazo')

  useEffect(() => {
    if (!abierto) return
    const alPulsar = e => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [abierto, onCerrar])

  if (!abierto) return null

  const zonasElegidas = filtros.zonas ?? []
  const provinciasElegidas = filtros.provincias ?? []
  const nGeograficos = zonasElegidas.length + provinciasElegidas.length

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
          width: '100%', maxWidth: 480, maxHeight: '86vh',
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
            borderBottom: '1px solid var(--linea)',
            flexShrink: 0
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
              opciones={opciones?.familias}
              activas={filtros.familias}
              onTocar={v => alternarFiltro('familias', v)}
              cursiva
            />
          </Grupo>

          <Grupo titulo="Subfamilia">
            <Fichas
              opciones={opciones?.subfamilias}
              activas={filtros.subfamilias}
              onTocar={v => alternarFiltro('subfamilias', v)}
              cursiva
            />
          </Grupo>

          {/* ── Zona geográfica: sobre el mapa ── */}
          <Grupo titulo="Zona geográfica">
            {!mapaVisible ? (
              <>
                <button
                  onClick={() => setMapaVisible(true)}
                  className="fila"
                  style={{
                    gap: 'var(--e-3)', width: '100%',
                    padding: '12px 14px', textAlign: 'left',
                    fontSize: 'var(--t-13)',
                    background: 'var(--sombra-alt)',
                    borderRadius: 'var(--r-panel)',
                    boxShadow: 'inset 0 0 0 1px var(--linea)'
                  }}
                >
                  <span className="crece">
                    {nGeograficos > 0
                      ? `${nGeograficos} seleccionada${nGeograficos === 1 ? '' : 's'}`
                      : 'Abrir el mapa'}
                  </span>
                  <span style={{ fontSize: 'var(--t-11)', color: 'var(--papel-tenue)' }}>
                    trazo o provincias
                  </span>
                  <span aria-hidden="true" style={{ color: 'var(--papel-tenue)' }}>›</span>
                </button>

                {/* Lo ya elegido, para no tener que abrir el mapa para verlo */}
                {nGeograficos > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'var(--e-2)' }}>
                    {zonasElegidas.map(id => (
                      <span key={id} style={etiquetaGeo}>
                        {ZONA_POR_ID[id]?.nombre ?? id}
                      </span>
                    ))}
                    {provinciasElegidas.map(p => (
                      <span key={p} style={etiquetaGeo}>{p}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <MapaZonas
                  modo={modoZona}
                  onCambiarModo={m => {
                    setModoZona(m)
                    // Cada modo tiene su propia selección: al cambiar,
                    // se limpia la del otro para que el resultado no mienta.
                    if (m === 'trazo') fijarProvincias?.([])
                    else fijarZonas?.([])
                  }}
                  zonasElegidas={zonasElegidas}
                  onZonasElegidas={fijarZonas}
                  provinciasElegidas={provinciasElegidas}
                  onProvinciasElegidas={fijarProvincias}
                />

                <button
                  onClick={() => setMapaVisible(false)}
                  style={{
                    marginTop: 'var(--e-3)',
                    fontSize: 'var(--t-13)', color: 'var(--papel-medio)'
                  }}
                >
                  Ocultar el mapa
                </button>
              </>
            )}
          </Grupo>

          <Grupo titulo="Color">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--e-2)' }}>
              {(opciones?.colores ?? []).map(color => {
                const activa = (filtros.colores ?? []).includes(color)
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
              {(opciones?.tamanos ?? []).map(t => {
                const activa = (filtros.tamanos ?? []).includes(t)
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

/* ── Piezas ─────────────────────────────────────────────────── */

const etiquetaGeo = {
  padding: '4px 10px',
  fontSize: 'var(--t-12)',
  background: 'var(--atala-hondo)',
  borderRadius: 'var(--r-control)'
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

/* `opciones` y `activas` se normalizan a lista: si algún día falta una
   clave, el grupo sale vacío en vez de tumbar la aplicación. */
function Fichas({ opciones, activas, onTocar, cursiva }) {
  const lista = opciones ?? []
  const puestas = activas ?? []

  if (lista.length === 0) {
    return (
      <p style={{ fontSize: 'var(--t-12)', color: 'var(--papel-tenue)' }}>
        Sin opciones disponibles.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--e-2)' }}>
      {lista.map(o => {
        const activa = puestas.includes(o)
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
