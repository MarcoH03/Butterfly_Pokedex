import { useState, useMemo } from 'react'
import TarjetaEspecie from '../components/TarjetaEspecie'
import PanelFiltros from '../components/PanelFiltros'
import { useEspecies } from '../hooks/useEspecies'
import { leer } from '../lib/almacen'

/* ══════════════════════════════════════════════════════════════
   Laminas — pantalla principal.

   Cuadrícula de dos columnas con las fotos. Arriba: buscador,
   cambio de vista y filtros. Abajo, cuando hace falta: la barra
   de selección manual.
   ══════════════════════════════════════════════════════════════ */

export default function Laminas() {
  const e = useEspecies()
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  // Cuántos avistamientos tengo de cada especie, para el contador
  // de las tarjetas. Se calcula una vez por render de la pantalla.
  const conteos = useMemo(() => {
    const mapa = {}
    for (const a of leer().avistamientos) {
      mapa[a.especieId] = (mapa[a.especieId] || 0) + 1
    }
    return mapa
  }, [])

  return (
    <div className="armazon">

      {/* ══ Barra superior ══ */}
      <header
        style={{
          paddingTop: 'calc(var(--safe-top) + var(--e-3))',
          background: 'var(--sombra)',
          borderBottom: '1px solid var(--linea)'
        }}
      >
        {/* Título y vista */}
        <div
          className="fila"
          style={{ gap: 'var(--e-3)', padding: '0 var(--e-4) var(--e-3)' }}
        >
          <h1
            className="crece"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'var(--t-21)',
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Mariposas de Cuba
          </h1>

          <button
            onClick={() => e.setModoSeleccion(!e.modoSeleccion)}
            style={{
              fontSize: 'var(--t-13)',
              color: e.modoSeleccion ? 'var(--atala)' : 'var(--papel-medio)',
              fontWeight: e.modoSeleccion ? 600 : 400
            }}
          >
            {e.modoSeleccion ? 'Listo' : 'Escoger'}
          </button>
        </div>

        {/* Buscador */}
        <div style={{ padding: '0 var(--e-4) var(--e-3)' }}>
          <div
            className="fila"
            style={{
              gap: 'var(--e-2)',
              padding: '10px var(--e-3)',
              background: 'var(--sombra-alt)',
              borderRadius: 'var(--r-control)',
              boxShadow: 'inset 0 0 0 1px var(--linea)'
            }}
          >
            <Lupa />
            <input
              value={e.consulta}
              onChange={ev => e.setConsulta(ev.target.value)}
              placeholder="Buscar por nombre"
              aria-label="Buscar especies"
              className="crece"
              style={{ fontSize: 'var(--t-15)', color: 'var(--papel)' }}
            />
            {e.consulta && (
              <button
                onClick={() => e.setConsulta('')}
                aria-label="Borrar búsqueda"
                style={{ color: 'var(--papel-medio)', fontSize: 'var(--t-15)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Vista, filtros y recuento */}
        <div
          className="fila"
          style={{ gap: 'var(--e-2)', padding: '0 var(--e-4) var(--e-3)' }}
        >
          {/* Cambio de vista: láminas ↔ montados */}
          <div
            style={{
              display: 'flex',
              padding: 2,
              background: 'var(--sombra-alt)',
              borderRadius: 'var(--r-control)',
              boxShadow: 'inset 0 0 0 1px var(--linea)'
            }}
          >
            <Pestana activa={e.vista === 'laminas'} onTocar={() => e.setVista('laminas')}>
              Láminas
            </Pestana>
            <Pestana activa={e.vista === 'montados'} onTocar={() => e.setVista('montados')}>
              Montados
            </Pestana>
          </div>

          <span
            className="crece"
            style={{
              fontSize: 'var(--t-12)',
              color: 'var(--papel-tenue)',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {e.especies.length === e.total
              ? `${e.total} especies`
              : `${e.especies.length} de ${e.total}`}
          </span>

          <button
            onClick={() => setFiltrosAbiertos(true)}
            style={{
              position: 'relative',
              padding: '7px 14px',
              fontSize: 'var(--t-13)',
              borderRadius: 'var(--r-control)',
              color: e.activos.length ? 'var(--sombra)' : 'var(--papel)',
              background: e.activos.length ? 'var(--atala)' : 'var(--sombra-alt)',
              boxShadow: e.activos.length ? 'none' : 'inset 0 0 0 1px var(--linea)',
              fontWeight: e.activos.length ? 600 : 400
            }}
          >
            Filtrar{e.activos.length ? ` · ${e.activos.length}` : ''}
          </button>
        </div>

        {/* Chips de filtros activos */}
        {e.activos.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--e-2)',
              padding: '0 var(--e-4) var(--e-3)',
              overflowX: 'auto'
            }}
          >
            {e.activos.map(({ clave, valor, etiqueta }) => (
              <button
                key={`${clave}:${valor}`}
                onClick={() => e.quitarFiltro(clave, valor)}
                className="fila"
                style={{
                  gap: 6,
                  flexShrink: 0,
                  padding: '5px 10px',
                  fontSize: 'var(--t-12)',
                  color: 'var(--papel)',
                  background: 'var(--atala-hondo)',
                  borderRadius: 'var(--r-control)'
                }}
              >
                {etiqueta}
                <span aria-hidden="true" style={{ opacity: 0.7 }}>✕</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ══ Cuadrícula ══ */}
      <div className="zona-scroll">
        {e.especies.length === 0 ? (
          <Vacio consulta={e.consulta} onLimpiar={e.limpiarFiltros} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--e-2)',
              padding: 'var(--e-3) var(--e-3)',
              paddingBottom: e.modoSeleccion ? 96 : 'var(--e-6)'
            }}
          >
            {e.especies.map(esp => (
              <TarjetaEspecie
                key={esp.id}
                especie={esp}
                vista={e.vista}
                modoSeleccion={e.modoSeleccion}
                marcada={e.seleccion.includes(esp.id)}
                onMarcar={e.alternarSeleccion}
                avistamientos={conteos[esp.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══ Barra de selección manual ══ */}
      {e.modoSeleccion && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: `var(--e-3) var(--e-4) calc(var(--e-3) + var(--safe-bot))`,
            background: 'rgba(18,25,23,.94)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--linea)'
          }}
        >
          <div className="fila" style={{ gap: 'var(--e-3)' }}>
            <span className="crece" style={{ fontSize: 'var(--t-13)' }}>
              {e.seleccion.length === 0
                ? 'Toca las especies que quieras reunir'
                : `${e.seleccion.length} escogida${e.seleccion.length === 1 ? '' : 's'}`}
            </span>

            {e.seleccion.length > 0 && (
              <>
                <button
                  onClick={e.limpiarSeleccion}
                  style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}
                >
                  Vaciar
                </button>
                <button
                  onClick={() => e.setSoloSeleccion(!e.soloSeleccion)}
                  style={{
                    padding: '9px 16px',
                    fontSize: 'var(--t-13)', fontWeight: 600,
                    borderRadius: 'var(--r-control)',
                    color: e.soloSeleccion ? 'var(--papel)' : 'var(--sombra)',
                    background: e.soloSeleccion ? 'var(--atala-hondo)' : 'var(--atala)'
                  }}
                >
                  {e.soloSeleccion ? 'Ver todas' : 'Ver solo estas'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <PanelFiltros
        abierto={filtrosAbiertos}
        onCerrar={() => setFiltrosAbiertos(false)}
        filtros={e.filtros}
        alternarFiltro={e.alternarFiltro}
        limpiar={e.limpiarFiltros}
        opciones={e.opciones}
        nActivos={e.activos.length}
        nResultados={e.especies.length}
      />
    </div>
  )
}

/* ── Piezas ─────────────────────────────────────────────────── */

function Pestana({ activa, onTocar, children }) {
  return (
    <button
      onClick={onTocar}
      aria-pressed={activa}
      style={{
        padding: '6px 13px',
        fontSize: 'var(--t-12)',
        fontWeight: activa ? 600 : 400,
        borderRadius: 'var(--r-control)',
        color: activa ? 'var(--sombra)' : 'var(--papel-medio)',
        background: activa ? 'var(--papel)' : 'transparent'
      }}
    >
      {children}
    </button>
  )
}

function Lupa() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="6.8" cy="6.8" r="4.6"
        fill="none" stroke="var(--papel-medio)" strokeWidth="1.5"
      />
      <path
        d="M10.4 10.4 L14 14"
        stroke="var(--papel-medio)" strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  )
}

/* Una pantalla vacía es una invitación, no un error. */
function Vacio({ consulta, onLimpiar }) {
  return (
    <div style={{ padding: 'var(--e-10) var(--e-6)', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 'var(--t-17)', marginBottom: 'var(--e-2)' }}>
        Ninguna especie coincide
      </p>
      <p style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)', marginBottom: 'var(--e-5)' }}>
        {consulta
          ? `No hay resultados para «${consulta}». Prueba con el género o parte del nombre.`
          : 'Los filtros activos no dejan pasar ninguna especie.'}
      </p>
      <button
        onClick={onLimpiar}
        style={{
          padding: '10px 20px',
          fontSize: 'var(--t-13)', fontWeight: 600,
          color: 'var(--sombra)', background: 'var(--atala)',
          borderRadius: 'var(--r-control)'
        }}
      >
        Quitar filtros
      </button>
    </div>
  )
}
