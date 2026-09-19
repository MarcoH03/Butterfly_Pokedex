import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Lamina from '../components/Lamina'
import Visor from '../components/Visor'
import RanuraFoto from '../components/RanuraFoto'
import HojaAvistamiento from '../components/HojaAvistamiento'
import MapaZonas, { ZONA_POR_ID } from '../components/MapaZonas'
import MapaAvistamientos from '../components/MapaAvistamientos'
import { COLOR_FAMILIA } from '../components/TarjetaEspecie'
import { especiePorId, provinciasDe } from '../hooks/useEspecies'
import {
  avistamientosDe, conteoPorLugar, conteoPorProvincia, borrarAvistamiento,
  leerNota, guardarNota,
  galeriaDe, agregarFoto, borrarFoto, comprimirImagen,
  fotoEstadio, guardarFotoEstadio, borrarFotoEstadio
} from '../lib/almacen'

/* ══════════════════════════════════════════════════════════════
   Ficha — todo sobre una especie.

   Secciones apiladas en vez de pestañas: en un teléfono es más
   rápido desplazarse que buscar la pestaña correcta, y así nada
   queda escondido.

   Cualquier imagen se abre a pantalla completa con zoom (Visor).
   ══════════════════════════════════════════════════════════════ */

const ESTADIOS = [
  { clave: 'huevo',     titulo: 'Huevo',              campo: 'huevo' },
  { clave: 'larva',     titulo: 'Larva (oruga)',      campo: 'larva' },
  { clave: 'pupa',      titulo: 'Pupa (crisálida)',   campo: 'pupa' },
  { clave: 'hospedera', titulo: 'Planta hospedera',   campo: null }
]

export default function Ficha() {
  const { id } = useParams()
  const navegar = useNavigate()
  const especie = especiePorId(id)

  const [vista, setVista] = useState('lamina')
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [version, setVersion] = useState(0)
  const [visor, setVisor] = useState(null)     // { imagenes, indice }
  const [mensaje, setMensaje] = useState('')

  // Aviso pasajero, p.ej. «Zona ampliada»
  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(''), 2600)
    return () => clearTimeout(t)
  }, [mensaje])

  if (!especie) {
    return (
      <div className="armazon">
        <div style={{ padding: 'var(--e-10) var(--e-6)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 'var(--t-17)', marginBottom: 'var(--e-4)' }}>
            Esa especie no está en el catálogo
          </p>
          <button
            onClick={() => navegar('/')}
            style={{
              padding: '10px 20px', fontSize: 'var(--t-13)', fontWeight: 600,
              color: 'var(--sombra)', background: 'var(--atala)',
              borderRadius: 'var(--r-control)'
            }}
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  const colorFam = COLOR_FAMILIA[especie.familia] || 'var(--atala)'
  const avistamientos = avistamientosDe(especie.id)
  const lugares = conteoPorLugar(especie.id)
  const porProvincia = conteoPorProvincia(especie.id)

  /* ── Todas las imágenes de la especie, para el visor ──
     Un solo conjunto: así al abrir cualquiera se puede pasar a
     las demás sin salir de pantalla completa. */
  const imagenes = useMemo(() => {
    const lista = []
    if (especie.imagenes.lamina) lista.push({ src: especie.imagenes.lamina, pie: 'Ejemplar vivo', clave: 'lamina' })
    if (especie.imagenes.montado) lista.push({ src: especie.imagenes.montado, pie: 'Ejemplar montado', clave: 'montado' })
    for (const e of ESTADIOS) {
      const propia = fotoEstadio(especie.id, e.clave)
      const src = propia || especie.imagenes[e.clave]
      if (src) lista.push({ src, pie: e.titulo, clave: e.clave, propia: !!propia })
    }
    for (const f of galeriaDe(especie.id)) {
      lista.push({ src: f.dataUrl, pie: f.pie || 'Foto tuya', clave: `galeria:${f.id}`, propia: true })
    }
    for (const a of avistamientos) {
      if (a.foto) lista.push({ src: a.foto, pie: a.lugar || 'Avistamiento', clave: `avist:${a.id}`, propia: true })
    }
    return lista
  }, [especie, version, avistamientos])

  /** Abre el visor en la imagen cuya clave se pasa. */
  const abrirVisor = clave => {
    const i = imagenes.findIndex(im => im.clave === clave)
    if (i >= 0) setVisor({ imagenes, indice: i })
  }

  const srcPrincipal = vista === 'montado' ? especie.imagenes.montado : especie.imagenes.lamina

  return (
    <div className="armazon">

      <header
        className="fila"
        style={{
          gap: 'var(--e-3)',
          paddingTop: 'calc(var(--safe-top) + var(--e-3))',
          paddingLeft: 'var(--e-4)', paddingRight: 'var(--e-4)',
          paddingBottom: 'var(--e-3)',
          borderBottom: '1px solid var(--linea)'
        }}
      >
        <button onClick={() => navegar(-1)} className="fila"
          style={{ gap: 5, fontSize: 'var(--t-13)', color: 'var(--atala)' }}>
          <span aria-hidden="true">‹</span> Catálogo
        </button>
        <span className="crece" style={{
          textAlign: 'right', fontSize: 'var(--t-12)',
          color: 'var(--papel-tenue)', fontVariantNumeric: 'tabular-nums'
        }}>
          {String(especie.id).padStart(3, '0')}
        </span>
      </header>

      <div className="zona-scroll" style={{ paddingBottom: 96 }}>

        {/* ── Imagen principal: tocar para pantalla completa ── */}
        <button
          onClick={() => abrirVisor(vista === 'montado' ? 'montado' : 'lamina')}
          aria-label="Ver la imagen a pantalla completa"
          style={{ display: 'block', width: '100%', padding: 0, position: 'relative' }}
        >
          <Lamina src={srcPrincipal} alt={especie.nombre} relacion="4 / 3" />
          {srcPrincipal && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', bottom: 10, right: 10,
                padding: '4px 9px', fontSize: 'var(--t-11)',
                color: 'var(--papel)', background: 'rgba(7,16,14,.7)',
                borderRadius: 'var(--r-control)'
              }}
            >
              Ampliar
            </span>
          )}
        </button>

        <div className="fila" style={{ gap: 'var(--e-2)', padding: 'var(--e-3) var(--e-4) 0' }}>
          <div style={{
            display: 'flex', padding: 2,
            background: 'var(--sombra-alt)', borderRadius: 'var(--r-control)',
            boxShadow: 'inset 0 0 0 1px var(--linea)'
          }}>
            <MiniPestana activa={vista === 'lamina'} onTocar={() => setVista('lamina')}>
              Ejemplar vivo
            </MiniPestana>
            <MiniPestana activa={vista === 'montado'} onTocar={() => setVista('montado')}>
              Montado
            </MiniPestana>
          </div>
        </div>

        {/* ── Encabezado ── */}
        <div style={{ padding: 'var(--e-4)' }}>
          <h1 className="binomio" style={{ fontSize: 'var(--t-27)', fontWeight: 400, lineHeight: 1.2 }}>
            {especie.nombre}
          </h1>
          {especie.autoria && (
            <p className="autoria" style={{ fontSize: 'var(--t-13)', marginTop: 2 }}>
              {especie.autoria}
            </p>
          )}
          <div className="fila" style={{ gap: 'var(--e-2)', flexWrap: 'wrap', marginTop: 'var(--e-3)' }}>
            <Insignia color={colorFam}>{especie.familia}</Insignia>
            <Insignia>{especie.subfamilia}</Insignia>
            {especie.endemica && <Insignia color="var(--grana)">Endémica</Insignia>}
          </div>
        </div>

        <hr className="divisor" />

        {/* ── Identificación ── */}
        <Seccion titulo="Identificación">
          <Dato etiqueta="Envergadura">
            {especie.tamano_mm?.max
              ? `${especie.tamano_mm.min}–${especie.tamano_mm.max} mm`
              : <Pendiente />}
          </Dato>
          {especie.nombres_alternos?.length > 0 && (
            <Dato etiqueta="Otros nombres">{especie.nombres_alternos.join(' · ')}</Dato>
          )}
          {especie.colores?.length > 0 && (
            <Dato etiqueta="Colores">{especie.colores.join(', ')}</Dato>
          )}
          <Parrafo>{especie.descripcion}</Parrafo>
          {especie.anverso && <SubDato etiqueta="Anverso">{especie.anverso}</SubDato>}
          {especie.reverso && <SubDato etiqueta="Reverso">{especie.reverso}</SubDato>}
          {especie.rasgos && <SubDato etiqueta="Rasgos distintivos">{especie.rasgos}</SubDato>}
        </Seccion>

        <hr className="divisor" />

        {/* ── Distribución ── */}
        <Seccion titulo="Distribución">
          <MapaZonas modo="trazo" soloLectura zonasElegidas={especie.distribucion.zonas} />

          {especie.distribucion.zonas.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'var(--e-3)' }}>
                {especie.distribucion.zonas.map(id => (
                  <span key={id} style={{
                    padding: '4px 10px', fontSize: 'var(--t-12)',
                    background: 'var(--atala-hondo)', borderRadius: 'var(--r-control)'
                  }}>
                    {ZONA_POR_ID[id]?.nombre ?? id}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 'var(--t-11)', color: 'var(--papel-tenue)', marginTop: 'var(--e-2)' }}>
                Provincias alcanzadas: {provinciasDe(especie).join(', ') || '—'}.
              </p>
            </>
          ) : (
            <p style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)', marginTop: 'var(--e-3)' }}>
              Sin zonas asignadas todavía.
            </p>
          )}

          {especie.distribucion.nota && (
            <Parrafo style={{ marginTop: 'var(--e-4)' }}>{especie.distribucion.nota}</Parrafo>
          )}
        </Seccion>

        <hr className="divisor" />

        {/* ── Ciclo de vida: cuatro estadios con foto ── */}
        <Seccion titulo="Ciclo de vida">
          {especie.ciclo.hospederas?.length > 0 ? (
            <div style={{ marginBottom: 'var(--e-4)' }}>
              <Etiqueta>Plantas hospederas</Etiqueta>
              <ul style={{ listStyle: 'none', marginTop: 'var(--e-2)' }}>
                {especie.ciclo.hospederas.map(h => (
                  <li key={h} className="binomio" style={{
                    fontSize: 'var(--t-15)', color: 'var(--atala)',
                    padding: '3px 0 3px var(--e-3)',
                    borderLeft: '2px solid var(--atala-hondo)'
                  }}>
                    {h}
                  </li>
                ))}
              </ul>
              {especie.ciclo.nota_hospederas && (
                <Parrafo style={{ marginTop: 'var(--e-2)', fontSize: 'var(--t-13)' }}>
                  {especie.ciclo.nota_hospederas}
                </Parrafo>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 'var(--e-4)' }}>
              <Etiqueta>Plantas hospederas</Etiqueta>
              <div style={{ marginTop: 'var(--e-1)' }}><Pendiente /></div>
            </div>
          )}

          {ESTADIOS.map(e => (
            <Estadio
              key={e.clave}
              titulo={e.titulo}
              texto={e.campo ? especie.ciclo[e.campo] : especie.ciclo.nota_hospederas}
              propia={fotoEstadio(especie.id, e.clave)}
              catalogo={especie.imagenes[e.clave]}
              onFoto={dataUrl => { guardarFotoEstadio(especie.id, e.clave, dataUrl); setVersion(v => v + 1) }}
              onBorrar={() => { borrarFotoEstadio(especie.id, e.clave); setVersion(v => v + 1) }}
              onAbrir={() => abrirVisor(e.clave)}
            />
          ))}

          <p style={{ fontSize: 'var(--t-11)', color: 'var(--papel-tenue)', marginTop: 'var(--e-2)' }}>
            El punto amarillo marca las fotos que añadiste tú. Las que tomes en el
            campo se guardan en el teléfono y sustituyen a la del catálogo.
          </p>
        </Seccion>

        <hr className="divisor" />

        {/* ── Mis avistamientos, con mapa ── */}
        <Seccion
          titulo="Mis avistamientos"
          acción={avistamientos.length > 0 && (
            <span style={{
              fontSize: 'var(--t-12)', fontVariantNumeric: 'tabular-nums',
              color: 'var(--polen)'
            }}>
              {avistamientos.length} en total
            </span>
          )}
        >
          {avistamientos.length === 0 ? (
            <p style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}>
              Todavía no has anotado esta especie. Cuando la veas, usa el botón de abajo.
            </p>
          ) : (
            <>
              <MapaAvistamientos
                avistamientos={avistamientos}
                conteoPorProvincia={porProvincia}
              />

              {lugares.length > 0 && (
                <div style={{ marginTop: 'var(--e-5)' }}>
                  <Etiqueta>Por zona</Etiqueta>
                  <div style={{ marginTop: 'var(--e-2)' }}>
                    {lugares.map(l => (
                      <div key={l.lugar} className="fila" style={{
                        gap: 'var(--e-3)', padding: '7px 0',
                        borderBottom: '1px solid var(--linea)'
                      }}>
                        <span className="crece truncar" style={{ fontSize: 'var(--t-13)' }}>
                          {l.lugar}
                          {l.provincia && l.provincia !== l.lugar && (
                            <span style={{ color: 'var(--papel-tenue)' }}> · {l.provincia}</span>
                          )}
                        </span>
                        <span style={{
                          fontSize: 'var(--t-12)', fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          color: 'var(--sombra)', background: 'var(--polen)',
                          padding: '1px 8px', borderRadius: 'var(--r-control)'
                        }}>
                          {l.veces}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 'var(--e-5)' }}>
                <Etiqueta>Registro</Etiqueta>
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  gap: 'var(--e-2)', marginTop: 'var(--e-2)'
                }}>
                  {avistamientos.map(a => (
                    <EtiquetaAvistamiento
                      key={a.id}
                      avistamiento={a}
                      onAbrirFoto={() => abrirVisor(`avist:${a.id}`)}
                      onBorrar={() => { borrarAvistamiento(a.id); setVersion(v => v + 1) }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </Seccion>

        <hr className="divisor" />

        <Galeria
          especieId={especie.id}
          version={version}
          onCambio={() => setVersion(v => v + 1)}
          onAbrir={clave => abrirVisor(clave)}
        />

        <hr className="divisor" />

        <Notas especieId={especie.id} />
      </div>

      {/* Aviso pasajero */}
      {mensaje && (
        <div
          role="status"
          style={{
            position: 'absolute', bottom: 86, left: 'var(--e-4)', right: 'var(--e-4)',
            padding: '10px 14px', fontSize: 'var(--t-13)',
            color: 'var(--sombra)', background: 'var(--polen)',
            borderRadius: 'var(--r-panel)', textAlign: 'center'
          }}
        >
          {mensaje}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: `var(--e-3) var(--e-4) calc(var(--e-3) + var(--safe-bot))`,
        background: 'rgba(18,25,23,.94)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--linea)'
      }}>
        <button
          onClick={() => setHojaAbierta(true)}
          style={{
            width: '100%', padding: 14, fontSize: 'var(--t-15)', fontWeight: 600,
            color: 'var(--sombra)', background: 'var(--atala)',
            borderRadius: 'var(--r-control)'
          }}
        >
          Anotar avistamiento
        </button>
      </div>

      <HojaAvistamiento
        especie={especie}
        abierto={hojaAbierta}
        onCerrar={() => setHojaAbierta(false)}
        onGuardado={(_, msg) => { setVersion(v => v + 1); if (msg) setMensaje(msg) }}
      />

      {visor && (
        <Visor
          imagenes={visor.imagenes}
          indice={visor.indice}
          onCerrar={() => setVisor(null)}
        />
      )}
    </div>
  )
}

/* ══ Galería personal ═══════════════════════════════════════ */

function Galeria({ especieId, version, onCambio, onAbrir }) {
  const [fotos, setFotos] = useState(() => galeriaDe(especieId))
  const [error, setError] = useState('')
  const camara = useRef(null)
  const galeria = useRef(null)

  useEffect(() => { setFotos(galeriaDe(especieId)) }, [especieId, version])

  const subir = async ev => {
    const archivos = [...ev.target.files]
    ev.target.value = ''
    setError('')
    for (const archivo of archivos) {
      try {
        const dataUrl = await comprimirImagen(archivo)
        if (!agregarFoto(especieId, dataUrl)) {
          setError('No cabe más en el almacenamiento del teléfono. Exporta una copia y borra fotos antiguas.')
          break
        }
      } catch {
        setError('Una de las imágenes no se pudo procesar.')
      }
    }
    setFotos(galeriaDe(especieId))
    onCambio?.()
  }

  return (
    <Seccion
      titulo="Mi galería"
      acción={
        <div className="fila" style={{ gap: 'var(--e-3)' }}>
          <button onClick={() => camara.current?.click()}
            style={{ fontSize: 'var(--t-13)', color: 'var(--atala)' }}>
            Cámara
          </button>
          <button onClick={() => galeria.current?.click()}
            style={{ fontSize: 'var(--t-13)', color: 'var(--atala)' }}>
            Galería
          </button>
        </div>
      }
    >
      <input ref={camara} type="file" accept="image/*" capture="environment"
        onChange={subir} style={{ display: 'none' }} />
      <input ref={galeria} type="file" accept="image/*" multiple
        onChange={subir} style={{ display: 'none' }} />

      {error && (
        <p style={{ fontSize: 'var(--t-12)', color: 'var(--grana)', marginBottom: 'var(--e-3)' }}>
          {error}
        </p>
      )}

      {fotos.length === 0 ? (
        <p style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}>
          Aquí van tus propias fotos de esta especie. Se guardan en el teléfono.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--e-2)' }}>
          {fotos.map(f => (
            <div key={f.id} style={{ position: 'relative' }}>
              <button
                onClick={() => onAbrir?.(`galeria:${f.id}`)}
                aria-label="Ver a pantalla completa"
                style={{ display: 'block', width: '100%', padding: 0 }}
              >
                <img
                  src={f.dataUrl}
                  alt={f.pie || 'Foto tuya'}
                  style={{
                    width: '100%', aspectRatio: '1', objectFit: 'cover',
                    borderRadius: 'var(--r-panel)'
                  }}
                />
              </button>
              <button
                onClick={() => {
                  borrarFoto(especieId, f.id)
                  setFotos(galeriaDe(especieId))
                  onCambio?.()
                }}
                aria-label="Borrar foto"
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  fontSize: 12, color: 'var(--papel)', background: 'rgba(12,17,16,.8)'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </Seccion>
  )
}

/* ══ Notas: se tocan y se escriben, y crecen solas ══════════ */

function Notas({ especieId }) {
  const [texto, setTexto] = useState(() => leerNota(especieId))
  const [guardado, setGuardado] = useState(false)
  const area = useRef(null)

  useEffect(() => { setTexto(leerNota(especieId)) }, [especieId])

  /* La caja crece con el texto: nunca hay que desplazarse dentro
     de un recuadro pequeño para leer lo que escribiste. */
  const ajustarAlto = () => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(ajustarAlto, [texto])

  useEffect(() => {
    if (texto === leerNota(especieId)) return
    const t = setTimeout(() => {
      guardarNota(especieId, texto)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 1600)
    }, 500)
    return () => clearTimeout(t)
  }, [texto, especieId])

  return (
    <Seccion
      titulo="Mis notas"
      acción={guardado && (
        <span style={{ fontSize: 'var(--t-12)', color: 'var(--atala)' }}>Guardado</span>
      )}
    >
      <textarea
        ref={area}
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onInput={ajustarAlto}
        placeholder="Toca aquí para escribir. Observaciones, dudas de identificación, referencias…"
        rows={1}
        style={{
          width: '100%',
          minHeight: 88,
          padding: 'var(--e-3)',
          fontSize: 'var(--t-15)',
          lineHeight: 1.6,
          color: 'var(--papel)',
          background: 'var(--sombra-alt)',
          borderRadius: 'var(--r-panel)',
          boxShadow: 'inset 0 0 0 1px var(--linea)',
          // Sin barra propia: la caja se estira y el scroll es el de la página.
          overflow: 'hidden',
          resize: 'none'
        }}
      />
    </Seccion>
  )
}

/* ══ Piezas compartidas ═════════════════════════════════════ */

function Seccion({ titulo, acción, children }) {
  return (
    <section style={{ padding: 'var(--e-5) var(--e-4)' }}>
      <div className="fila" style={{ gap: 'var(--e-3)', marginBottom: 'var(--e-3)' }}>
        <h2 className="crece" style={{
          fontFamily: 'var(--serif)', fontSize: 'var(--t-17)', fontWeight: 600
        }}>
          {titulo}
        </h2>
        {acción}
      </div>
      {children}
    </section>
  )
}

function Dato({ etiqueta, children }) {
  return (
    <div className="fila" style={{
      gap: 'var(--e-4)', alignItems: 'baseline',
      padding: '8px 0', borderBottom: '1px solid var(--linea)'
    }}>
      <span style={{
        fontSize: 'var(--t-13)', color: 'var(--papel-medio)',
        minWidth: 104, flexShrink: 0
      }}>
        {etiqueta}
      </span>
      <span className="crece" style={{ fontSize: 'var(--t-15)', textAlign: 'right' }}>
        {children}
      </span>
    </div>
  )
}

function SubDato({ etiqueta, children }) {
  return (
    <div style={{ marginTop: 'var(--e-4)' }}>
      <Etiqueta>{etiqueta}</Etiqueta>
      <Parrafo style={{ marginTop: 'var(--e-1)' }}>{children}</Parrafo>
    </div>
  )
}

function Etiqueta({ children }) {
  return (
    <span style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)' }}>{children}</span>
  )
}

function Parrafo({ children, style }) {
  if (!children) return <div style={style}><Pendiente /></div>
  return (
    <p style={{
      fontSize: 'var(--t-15)', lineHeight: 1.65,
      color: 'var(--papel)', maxWidth: '62ch', ...style
    }}>
      {children}
    </p>
  )
}

function Pendiente() {
  return (
    <span style={{ fontSize: 'var(--t-13)', color: 'var(--papel-tenue)' }}>
      Por documentar
    </span>
  )
}

function Insignia({ color, children }) {
  const esColor = Boolean(color)
  return (
    <span className="binomio" style={{
      fontSize: 'var(--t-12)', padding: '3px 10px',
      borderRadius: 'var(--r-control)',
      color: esColor ? 'var(--sombra)' : 'var(--papel)',
      background: esColor ? color : 'var(--sombra-alt)',
      boxShadow: esColor ? 'none' : 'inset 0 0 0 1px var(--linea)'
    }}>
      {children}
    </span>
  )
}

function MiniPestana({ activa, onTocar, children }) {
  return (
    <button
      onClick={onTocar}
      aria-pressed={activa}
      style={{
        padding: '6px 13px', fontSize: 'var(--t-12)',
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

/** Un estadio del ciclo: foto que puedes añadir, más su descripción. */
function Estadio({ titulo, texto, propia, catalogo, onFoto, onBorrar, onAbrir }) {
  return (
    <div className="fila" style={{
      gap: 'var(--e-3)', alignItems: 'flex-start', marginBottom: 'var(--e-4)'
    }}>
      <RanuraFoto
        src={propia || catalogo}
        alt={titulo}
        tamano={76}
        esPropia={!!propia}
        onFoto={onFoto}
        onBorrar={propia ? onBorrar : undefined}
        onAbrir={onAbrir}
      />
      <div className="crece">
        <Etiqueta>{titulo}</Etiqueta>
        <Parrafo style={{ marginTop: 2, fontSize: 'var(--t-13)' }}>{texto}</Parrafo>
      </div>
    </div>
  )
}

/** Un avistamiento, con la forma de una etiqueta de alfiler. */
function EtiquetaAvistamiento({ avistamiento: a, onBorrar, onAbrirFoto }) {
  const fecha = new Date(a.fecha)
  const dia = fecha.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
  const hora = fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="etiqueta fila" style={{ gap: 'var(--e-3)', alignItems: 'flex-start', paddingRight: 30 }}>
      {a.foto && (
        <button
          onClick={onAbrirFoto}
          aria-label="Ver la foto a pantalla completa"
          style={{ padding: 0, flexShrink: 0 }}
        >
          <img
            src={a.foto}
            alt=""
            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 2 }}
          />
        </button>
      )}

      <div className="crece" style={{ minWidth: 0 }}>
        <div className="etiqueta-loc">
          {a.lugar || a.provincia || 'Localidad sin especificar'}
          {a.lugar && a.provincia && `, ${a.provincia}`}
        </div>
        <div className="etiqueta-meta">
          {dia} · {hora}
          {a.lat != null && ` · ${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}`}
        </div>
        <div className="etiqueta-meta">{a.capturada ? 'Capturada' : 'Observada'}</div>
        {a.nota && <div style={{ marginTop: 3, color: '#3A3A32' }}>{a.nota}</div>}
      </div>

      <button
        onClick={onBorrar}
        aria-label="Borrar avistamiento"
        style={{ position: 'absolute', top: 6, right: 6, fontSize: 12, color: '#8A8A7E' }}
      >
        ✕
      </button>
    </div>
  )
}
