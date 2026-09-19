import { useState, useEffect, useRef } from 'react'
import { anotarAvistamiento, comprimirImagen } from '../lib/almacen'
import { registrarUbicacion, sugerirZonas, centroDeZona, zonaCubre, RADIO_NUEVO } from '../lib/zonas'
import { metrosEntre } from '../lib/geometria'
import { metaDatos } from '../hooks/useEspecies'

/* ══════════════════════════════════════════════════════════════
   HojaAvistamiento — anotar un avistamiento en el campo.

   Pensada para usarse de pie, con una mano y con prisa: pide el
   GPS al abrir, pone la hora actual y solo exige una decisión.

   La zona se escribe y se autocompleta con el catálogo. Al guardar:
     - zona nueva                -> nace con un disco de 500 m
     - zona conocida, GPS dentro -> no cambia
     - zona conocida, GPS fuera  -> se le añade otro disco
   Así el catálogo de zonas crece con el trabajo de campo en vez de
   depender de contornos inventados.
   ══════════════════════════════════════════════════════════════ */

export default function HojaAvistamiento({ especie, abierto, onCerrar, onGuardado }) {
  const [gps, setGps] = useState(null)
  const [estadoGps, setEstadoGps] = useState('inactivo')
  const [fuente, setFuente] = useState('gps')       // 'gps' | 'zona' | 'manual'
  const [latTexto, setLatTexto] = useState('')
  const [lonTexto, setLonTexto] = useState('')

  const [zonaTexto, setZonaTexto] = useState('')
  const [zonaElegida, setZonaElegida] = useState(null)
  const [sugerencias, setSugerencias] = useState([])
  const [mostrarSug, setMostrarSug] = useState(false)

  const [provincia, setProvincia] = useState('')
  const [capturada, setCapturada] = useState(false)
  const [nota, setNota] = useState('')
  const [foto, setFoto] = useState(null)
  const [aviso, setAviso] = useState('')

  const entradaCamara = useRef(null)
  const entradaGaleria = useRef(null)

  /* ── Al abrir: reiniciar y pedir ubicación ── */
  useEffect(() => {
    if (!abierto) return

    setFuente('gps'); setLatTexto(''); setLonTexto('')
    setZonaTexto(''); setZonaElegida(null); setMostrarSug(false)
    setProvincia(''); setCapturada(false); setNota('')
    setFoto(null); setAviso('')
    setGps(null); setEstadoGps('inactivo')

    if (!navigator.geolocation) { setEstadoGps('error'); return }

    setEstadoGps('buscando')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          precision: Math.round(pos.coords.accuracy)
        }
        setGps(p)
        setLatTexto(p.lat.toFixed(5))
        setLonTexto(p.lon.toFixed(5))
        setEstadoGps('listo')
      },
      err => setEstadoGps(err.code === err.PERMISSION_DENIED ? 'denegado' : 'error'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  }, [abierto])

  /* ── Autocompletado de zona ── */
  useEffect(() => { setSugerencias(sugerirZonas(zonaTexto)) }, [zonaTexto, abierto])

  if (!abierto) return null

  const lat = Number(latTexto)
  const lon = Number(lonTexto)
  const ubicacionValida =
    latTexto !== '' && lonTexto !== '' && !Number.isNaN(lat) && !Number.isNaN(lon)

  const usarGps = () => {
    if (!gps) return
    setLatTexto(gps.lat.toFixed(5))
    setLonTexto(gps.lon.toFixed(5))
    setFuente('gps')
  }

  const usarZona = () => {
    const centro = centroDeZona(zonaElegida)
    if (!centro) return
    setLatTexto(centro.lat.toFixed(5))
    setLonTexto(centro.lon.toFixed(5))
    setFuente('zona')
  }

  const elegirZona = zona => {
    setZonaElegida(zona)
    setZonaTexto(zona.nombre)
    setMostrarSug(false)
    if (!provincia && zona.provincias?.length === 1) setProvincia(zona.provincias[0])
  }

  const recibirFoto = async ev => {
    const archivo = ev.target.files?.[0]
    ev.target.value = ''
    if (!archivo) return
    try { setFoto(await comprimirImagen(archivo)) }
    catch { setAviso('No se pudo procesar la imagen.') }
  }

  const guardar = () => {
    let zonaId = zonaElegida?.id ?? null
    let mensaje = ''

    if (zonaTexto.trim() && ubicacionValida) {
      const res = registrarUbicacion(zonaTexto, lat, lon)
      if (res) {
        zonaId = res.zona.id
        if (res.accion === 'creada') mensaje = `Zona «${res.zona.nombre}» creada`
        if (res.accion === 'ampliada') mensaje = `Zona «${res.zona.nombre}» ampliada`
      }
    }

    const nuevo = anotarAvistamiento({
      especieId: especie.id,
      lat: ubicacionValida ? lat : null,
      lon: ubicacionValida ? lon : null,
      provincia,
      lugar: zonaTexto.trim(),
      zonaId,
      capturada,
      nota,
      foto
    })

    onGuardado?.(nuevo, mensaje)
    onCerrar()
  }

  const centroZona = centroDeZona(zonaElegida)
  const ampliara = zonaElegida && ubicacionValida && !zonaCubre(zonaElegida, lat, lon)
  const zonaEsNueva =
    zonaTexto.trim() &&
    !sugerencias.some(z => z.nombre.toLowerCase() === zonaTexto.trim().toLowerCase())

  return (
    <>
      <input ref={entradaCamara} type="file" accept="image/*" capture="environment"
        onChange={recibirFoto} style={{ display: 'none' }} />
      <input ref={entradaGaleria} type="file" accept="image/*"
        onChange={recibirFoto} style={{ display: 'none' }} />

      <div onClick={onCerrar}
        style={{ position: 'fixed', inset: 0, background: 'var(--velo)', zIndex: 70 }} />

      <div
        role="dialog"
        aria-label="Anotar avistamiento"
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          background: 'var(--sombra)',
          borderRadius: 'var(--r-hoja) var(--r-hoja) 0 0',
          boxShadow: '0 -1px 24px rgba(0,0,0,.2)',
          paddingBottom: 'var(--safe-bot)',
          zIndex: 71
        }}
      >
        <div className="asa" aria-hidden="true" />

        <div style={{ padding: 'var(--e-3) var(--e-4) var(--e-4)', borderBottom: '1px solid var(--linea)' }}>
          <div className="fila" style={{ gap: 'var(--e-3)' }}>
            <div className="crece">
              <div style={{ fontSize: 'var(--t-17)', fontWeight: 600 }}>Nuevo avistamiento</div>
              <div className="binomio truncar" style={{ color: 'var(--papel-medio)' }}>
                {especie.nombre}
              </div>
            </div>
            <button onClick={onCerrar} style={{ color: 'var(--papel-medio)', fontSize: 'var(--t-13)' }}>
              Cancelar
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: 'var(--e-4)' }}>

          {/* ── Zona ── */}
          <Campo etiqueta="Zona">
            <div style={{ position: 'relative' }}>
              <input
                value={zonaTexto}
                onChange={e => { setZonaTexto(e.target.value); setZonaElegida(null); setMostrarSug(true) }}
                onFocus={() => setMostrarSug(true)}
                placeholder="Escribe o elige del catálogo"
                style={entrada}
              />

              {mostrarSug && sugerencias.length > 0 && (
                <>
                  <div onClick={() => setMostrarSug(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div
                    style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 41,
                      marginTop: 4, maxHeight: 210, overflowY: 'auto',
                      background: 'var(--sombra-alt)',
                      borderRadius: 'var(--r-panel)',
                      boxShadow: '0 4px 16px rgba(0,0,0,.5), inset 0 0 0 1px var(--linea)'
                    }}
                  >
                    {sugerencias.map(z => (
                      <button
                        key={z.id}
                        onClick={() => elegirZona(z)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 13px', fontSize: 'var(--t-13)',
                          borderBottom: '1px solid var(--linea)'
                        }}
                      >
                        {z.nombre}
                        <span style={{ display: 'block', fontSize: 'var(--t-11)', color: 'var(--papel-tenue)' }}>
                          {z.discos?.length
                            ? `${z.discos.length} punto${z.discos.length === 1 ? '' : 's'} de campo`
                            : 'del catálogo'}
                          {z.provincias?.length ? ` · ${z.provincias.join(', ')}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {zonaEsNueva && (
              <Nota color="var(--atala)">
                Zona nueva. Al guardar se crea con un radio de {RADIO_NUEVO} m
                alrededor de esta ubicación.
              </Nota>
            )}
            {ampliara && (
              <Nota color="var(--polen)">
                Esta ubicación queda fuera de «{zonaElegida.nombre}»
                {centroZona
                  ? ` (a ${Math.round(metrosEntre([lon, lat], [centroZona.lon, centroZona.lat]))} m del centro)`
                  : ''}.
                Al guardar se le añade otro radio de {RADIO_NUEVO} m.
              </Nota>
            )}
          </Campo>

          {/* ── Ubicación ── */}
          <Campo etiqueta="Ubicación">
            <EstadoGps estado={estadoGps} gps={gps} fuente={fuente} />

            <div style={{ display: 'flex', gap: 'var(--e-2)', marginTop: 'var(--e-2)' }}>
              <input
                value={latTexto}
                onChange={e => { setLatTexto(e.target.value); setFuente('manual') }}
                inputMode="decimal" aria-label="Latitud" placeholder="Latitud"
                style={{ ...entrada, fontVariantNumeric: 'tabular-nums' }}
              />
              <input
                value={lonTexto}
                onChange={e => { setLonTexto(e.target.value); setFuente('manual') }}
                inputMode="decimal" aria-label="Longitud" placeholder="Longitud"
                style={{ ...entrada, fontVariantNumeric: 'tabular-nums' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--e-2)', marginTop: 'var(--e-2)' }}>
              <BotonFuente activo={fuente === 'gps'} onClick={usarGps} inhabilitado={!gps}>
                Mi ubicación
              </BotonFuente>
              <BotonFuente activo={fuente === 'zona'} onClick={usarZona} inhabilitado={!centroZona}>
                Centro de la zona
              </BotonFuente>
            </div>
          </Campo>

          {/* ── ¿La atrapaste? ── */}
          <Campo etiqueta="¿La atrapaste?">
            <div style={{ display: 'flex', gap: 'var(--e-2)' }}>
              <Alternador activo={!capturada} onTocar={() => setCapturada(false)}>
                Solo vista
              </Alternador>
              <Alternador activo={capturada} onTocar={() => setCapturada(true)} colorActivo="var(--grana)">
                Capturada
              </Alternador>
            </div>
          </Campo>

          {/* ── Foto ── */}
          <Campo etiqueta="Foto" opcional>
            {foto ? (
              <div className="fila" style={{ gap: 'var(--e-3)' }}>
                <img src={foto} alt="Foto del avistamiento"
                  style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 'var(--r-panel)' }} />
                <div className="crece" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => entradaCamara.current?.click()}
                    style={{ ...botonSecundario, textAlign: 'left' }}>Tomar otra</button>
                  <button onClick={() => setFoto(null)}
                    style={{ ...botonSecundario, textAlign: 'left', color: 'var(--grana)' }}>Quitar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--e-2)' }}>
                <button onClick={() => entradaCamara.current?.click()} style={botonSecundario}>
                  Tomar foto
                </button>
                <button onClick={() => entradaGaleria.current?.click()} style={botonSecundario}>
                  De la galería
                </button>
              </div>
            )}
          </Campo>

          {/* ── Provincia ── */}
          <Campo etiqueta="Provincia" opcional>
            <select value={provincia} onChange={e => setProvincia(e.target.value)} style={entrada}>
              <option value="">Sin especificar</option>
              {metaDatos.provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Campo>

          {/* ── Nota ── */}
          <Campo etiqueta="Nota" opcional>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              rows={3}
              placeholder="Comportamiento, planta, condiciones…"
              style={{ ...entrada, resize: 'vertical', lineHeight: 1.5 }}
            />
          </Campo>

          {aviso && <p style={{ fontSize: 'var(--t-12)', color: 'var(--grana)' }}>{aviso}</p>}
          <p style={{ fontSize: 'var(--t-11)', color: 'var(--papel-tenue)' }}>
            Puedes guardar ahora y completar los detalles más tarde.
          </p>
        </div>

        <div style={{ padding: 'var(--e-4)', borderTop: '1px solid var(--linea)' }}>
          <button
            onClick={guardar}
            style={{
              width: '100%', padding: 14, fontSize: 'var(--t-15)', fontWeight: 600,
              color: 'var(--on-accento)', background: 'var(--atala)',
              borderRadius: 'var(--r-control)'
            }}
          >
            Guardar avistamiento
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Piezas ─────────────────────────────────────────────────── */

const entrada = {
  width: '100%', padding: '11px 13px',
  fontSize: 'var(--t-15)', color: 'var(--papel)',
  background: 'var(--sombra-alt)',
  borderRadius: 'var(--r-panel)',
  boxShadow: 'inset 0 0 0 1px var(--linea)'
}

const botonSecundario = {
  flex: 1, padding: '10px 12px',
  fontSize: 'var(--t-13)', color: 'var(--papel)',
  background: 'var(--sombra-alt)',
  borderRadius: 'var(--r-panel)',
  boxShadow: 'inset 0 0 0 1px var(--linea)'
}

function Campo({ etiqueta, opcional, children }) {
  return (
    <div style={{ marginBottom: 'var(--e-5)' }}>
      <div className="fila" style={{ gap: 6, marginBottom: 'var(--e-2)' }}>
        <span style={{ fontSize: 'var(--t-13)', fontWeight: 500 }}>{etiqueta}</span>
        {opcional && (
          <span style={{ fontSize: 'var(--t-11)', color: 'var(--papel-tenue)' }}>opcional</span>
        )}
      </div>
      {children}
    </div>
  )
}

function Nota({ color, children }) {
  return (
    <p style={{
      fontSize: 'var(--t-11)', lineHeight: 1.5, color,
      marginTop: 'var(--e-2)', paddingLeft: 'var(--e-2)',
      borderLeft: `2px solid ${color}`
    }}>
      {children}
    </p>
  )
}

function BotonFuente({ activo, onClick, inhabilitado, children }) {
  return (
    <button
      onClick={onClick}
      disabled={inhabilitado}
      aria-pressed={activo}
      style={{
        flex: 1, padding: '9px 10px', fontSize: 'var(--t-12)',
        fontWeight: activo ? 600 : 400,
        borderRadius: 'var(--r-control)',
        color: activo ? 'var(--on-accento)' : 'var(--papel)',
        background: activo ? 'var(--atala)' : 'var(--sombra-alt)',
        boxShadow: activo ? 'none' : 'inset 0 0 0 1px var(--linea)',
        opacity: inhabilitado ? 0.4 : 1
      }}
    >
      {children}
    </button>
  )
}

function Alternador({ activo, onTocar, children, colorActivo = 'var(--atala)' }) {
  return (
    <button
      onClick={onTocar}
      aria-pressed={activo}
      style={{
        flex: 1, padding: 12, fontSize: 'var(--t-13)',
        fontWeight: activo ? 600 : 400,
        color: activo ? 'var(--on-accento)' : 'var(--papel)',
        background: activo ? colorActivo : 'var(--sombra-alt)',
        borderRadius: 'var(--r-panel)',
        boxShadow: activo ? 'none' : 'inset 0 0 0 1px var(--linea)'
      }}
    >
      {children}
    </button>
  )
}

function EstadoGps({ estado, gps, fuente }) {
  const base = {
    padding: '10px 13px', fontSize: 'var(--t-12)',
    background: 'var(--sombra-alt)', borderRadius: 'var(--r-panel)',
    boxShadow: 'inset 0 0 0 1px var(--linea)'
  }

  if (estado === 'listo' && gps) {
    return (
      <div style={{ ...base, boxShadow: 'inset 0 0 0 1px var(--atala-hondo)' }}>
        <span style={{ color: 'var(--papel-medio)' }}>
          {fuente === 'gps'
            ? `Tu ubicación, precisión de ${gps.precision} m`
            : fuente === 'zona'
              ? 'Centro de la zona elegida'
              : 'Coordenadas escritas a mano'}
        </span>
      </div>
    )
  }

  const mensajes = {
    buscando: 'Buscando tu ubicación…',
    denegado: 'Sin permiso de ubicación. Escribe las coordenadas o usa el centro de una zona.',
    error: 'No se pudo obtener la ubicación. Escríbela a mano.',
    inactivo: 'Ubicación no disponible.'
  }

  return <div style={{ ...base, color: 'var(--papel-medio)' }}>{mensajes[estado]}</div>
}
