import { useState, useMemo, useEffect } from 'react'
import datos from '../data/especies.json'
import { buscarEspecies } from '../lib/buscar'
import { leerSeleccion, guardarSeleccion } from '../lib/almacen'
import { todasLasZonas } from '../lib/zonas'
import catalogoZonas from '../data/zonas.json'
import { puntoDentro, trazoAlcanzaZona, distanciaASegmento } from '../lib/geometria'

/* ══════════════════════════════════════════════════════════════
   useEspecies — toda la lógica de la pantalla principal.

   Reúne en un solo sitio: búsqueda, filtros, modo de vista
   (láminas / montados) y selección manual. Los componentes solo
   pintan lo que este hook les da.
   ══════════════════════════════════════════════════════════════ */

const FILTROS_VACIOS = {
  familias: [],
  subfamilias: [],
  colores: [],
  tamanos: [],
  // Filtro geográfico. Se llena desde MapaZonas y admite las dos vías:
  zonas: [],        // ids de zona alcanzadas por el trazo
  provincias: [],   // provincias tocadas una por una
  trazo: null       // { puntos, radio }: el trazo crudo, para los polígonos del libro
}

/* Las zonas se leen en el momento: el catálogo crece con el trabajo
   de campo, así que no se puede congelar en una constante. */
function zonaPorId(id) {
  return todasLasZonas().find(z => z.id === id) || null
}

/* Provincia en la que cae un punto. Las provincias del catálogo son
   bandas de longitud (ver GUIA-DATOS.md); con contornos reales esto
   se simplifica, pero el resultado que da aquí ya es utilizable. */
function provinciaDePunto([lon, lat]) {
  for (const p of catalogoZonas.provincias) {
    if (p.contorno) {
      if (puntoDentro([lon, lat], catalogoZonas.contorno[p.contorno])) return p.nombre
      continue
    }
    const [a, b] = [Math.min(p.lon0, p.lon1), Math.max(p.lon0, p.lon1)]
    if (lon < a || lon > b) continue
    if (p.mitad === 'norte' && lat < catalogoZonas.latitud_division) continue
    if (p.mitad === 'sur' && lat > catalogoZonas.latitud_division) continue
    return p.nombre
  }
  return null
}

/** Provincias que toca una especie: por sus zonas y por las localidades del libro. */
export function provinciasDe(especie) {
  const set = new Set()
  for (const id of especie.distribucion.zonas || []) {
    for (const p of zonaPorId(id)?.provincias || []) set.add(p)
  }
  for (const punto of especie.distribucion.localidades || []) {
    const p = provinciaDePunto(punto)
    if (p) set.add(p)
  }
  return [...set]
}

/** Deduce la clase de tamaño si el JSON no la trae escrita. */
function claseTamano(esp, umbrales) {
  if (esp.tamano_clase) return esp.tamano_clase
  const max = esp.tamano_mm?.max || 0
  if (!max) return null
  if (max < umbrales['pequeña']) return 'pequeña'
  if (max > umbrales.grande) return 'grande'
  return 'mediana'
}

export function useEspecies() {
  const todas = datos.especies
  const meta = datos.meta

  const [consulta, setConsulta] = useState('')
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)

  // Modo de vista: 'laminas' (ejemplar vivo) o 'montados'
  const [vista, setVista] = useState('laminas')

  // Selección manual: modo activo + ids marcados
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [seleccion, setSeleccion] = useState(() => leerSeleccion())
  // Cuando está activo, la cuadrícula muestra SOLO lo seleccionado
  const [soloSeleccion, setSoloSeleccion] = useState(false)

  // La selección persiste entre sesiones
  useEffect(() => { guardarSeleccion(seleccion) }, [seleccion])

  /* ── Opciones disponibles para cada filtro ── */
  const opciones = useMemo(() => ({
    familias: meta.familias,
    subfamilias: meta.subfamilias,
    provincias: meta.provincias,
    colores: meta.colores,
    tamanos: meta.tamanos
  }), [meta])

  /* ── Aplicar búsqueda y filtros ──
     useMemo evita recalcular 207 especies en cada tecla si no
     ha cambiado nada relevante. */
  const especies = useMemo(() => {
    let lista = todas

    // Selección manual primero: si está activa, todo lo demás
    // se aplica dentro de ese subconjunto.
    if (soloSeleccion && seleccion.length) {
      lista = lista.filter(e => seleccion.includes(e.id))
    }

    if (filtros.familias.length)
      lista = lista.filter(e => filtros.familias.includes(e.familia))

    if (filtros.subfamilias.length)
      lista = lista.filter(e => filtros.subfamilias.includes(e.subfamilia))

    /* Geografía por trazo. Una especie entra si el dedo roza una de
       sus zonas del catálogo, una de las manchas que el libro pinta en
       su mapa, o una de sus localidades. */
    if (filtros.zonas.length || filtros.trazo) {
      const tr = filtros.trazo
      lista = lista.filter(e => {
        if (filtros.zonas.some(id => e.distribucion.zonas.includes(id))) return true
        if (!tr) return false
        if ((e.distribucion.poligonos || []).some(p => trazoAlcanzaZona(tr.puntos, p, tr.radio))) return true
        return (e.distribucion.localidades || []).some(q =>
          tr.puntos.some((p, i) =>
            i === 0
              ? Math.hypot(q[0] - p[0], q[1] - p[1]) <= tr.radio
              : distanciaASegmento(q, tr.puntos[i - 1], p) <= tr.radio))
      })
    }

    // Provincias tocadas: entra la especie con alguna zona en esa provincia.
    if (filtros.provincias.length)
      lista = lista.filter(e =>
        provinciasDe(e).some(p => filtros.provincias.includes(p)))

    // Color: la mariposa debe tener TODOS los colores marcados.
    // Cambia .every por .some si prefieres "cualquiera de estos".
    if (filtros.colores.length)
      lista = lista.filter(e =>
        filtros.colores.every(c => e.colores.includes(c)))

    if (filtros.tamanos.length)
      lista = lista.filter(e =>
        filtros.tamanos.includes(claseTamano(e, meta.umbrales_tamano_mm)))

    // La búsqueda va al final: ella impone su propio orden por
    // relevancia, así que debe ser lo último que toca la lista.
    if (consulta.trim()) lista = buscarEspecies(lista, consulta)

    return lista
  }, [todas, meta, consulta, filtros, soloSeleccion, seleccion])

  /* ── Acciones ── */

  const alternarFiltro = (clave, valor) => {
    setFiltros(prev => {
      const actual = prev[clave]
      return {
        ...prev,
        [clave]: actual.includes(valor)
          ? actual.filter(v => v !== valor)
          : [...actual, valor]
      }
    })
  }

  const quitarFiltro = (clave, valor) => {
    setFiltros(prev => Array.isArray(prev[clave])
      ? { ...prev, [clave]: prev[clave].filter(v => v !== valor) }
      : { ...prev, [clave]: null })
  }

  const limpiarFiltros = () => { setFiltros(FILTROS_VACIOS); setConsulta('') }

  /* Los dos modos del mapa se fijan enteros, no uno a uno. */
  const fijarZonas = (ids) => setFiltros(prev => ({ ...prev, zonas: ids }))
  const fijarProvincias = (nombres) => setFiltros(prev => ({ ...prev, provincias: nombres }))
  const fijarTrazo = (trazo) => setFiltros(prev => ({ ...prev, trazo }))

  const alternarSeleccion = (id) => {
    setSeleccion(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const limpiarSeleccion = () => { setSeleccion([]); setSoloSeleccion(false) }

  /* ── Filtros activos como lista plana, para pintar los chips ── */
  const activos = useMemo(() => {
    const salida = []
    for (const [clave, valores] of Object.entries(filtros)) {
      if (!Array.isArray(valores)) {
        // El trazo no es una lista: es un chip único.
        if (clave === 'trazo' && valores) salida.push({ clave, valor: 'trazo', etiqueta: 'área dibujada' })
        continue
      }
      for (const valor of valores) {
        // Las zonas se guardan por id; el chip debe mostrar el nombre.
        const etiqueta = clave === 'zonas' ? (zonaPorId(valor)?.nombre ?? valor) : valor
        salida.push({ clave, valor, etiqueta })
      }
    }
    return salida
  }, [filtros])

  return {
    especies, meta, total: todas.length,
    consulta, setConsulta,
    filtros, alternarFiltro, quitarFiltro, limpiarFiltros, activos, opciones,
    fijarZonas, fijarProvincias, fijarTrazo,
    vista, setVista,
    modoSeleccion, setModoSeleccion,
    seleccion, alternarSeleccion, limpiarSeleccion,
    soloSeleccion, setSoloSeleccion
  }
}

/** Busca una especie por id. Para la pantalla de ficha. */
export function especiePorId(id) {
  return datos.especies.find(e => e.id === Number(id))
}

export const metaDatos = datos.meta
