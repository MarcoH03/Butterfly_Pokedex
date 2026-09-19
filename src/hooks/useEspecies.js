import { useState, useMemo, useEffect } from 'react'
import datos from '../data/especies.json'
import { buscarEspecies } from '../lib/buscar'
import { leerSeleccion, guardarSeleccion } from '../lib/almacen'
import { todasLasZonas } from '../lib/zonas'

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
  provincias: []    // provincias tocadas una por una
}

/* Las zonas se leen en el momento: el catálogo crece con el trabajo
   de campo, así que no se puede congelar en una constante. */
function zonaPorId(id) {
  return todasLasZonas().find(z => z.id === id) || null
}

function zonaPorNombre(nombre) {
  return todasLasZonas().find(z => z.nombre === nombre) || null
}

/** Provincias que toca una especie, derivadas de sus zonas. */
export function provinciasDe(especie) {
  const set = new Set()
  for (const id of especie.distribucion.zonas || []) {
    for (const p of zonaPorId(id)?.provincias || []) set.add(p)
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

  /* ── Opciones disponibles para cada filtro ──
     Las zonas se leen en el momento (ver zonaPorId): el catálogo
     crece con el trabajo de campo. Aquí se ofrecen por nombre,
     igual que familias o colores; abajo se traduce a id. */
  const opciones = useMemo(() => ({
    familias: meta.familias,
    subfamilias: meta.subfamilias,
    provincias: meta.provincias,
    zonas: todasLasZonas().map(z => z.nombre),
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

    // Zonas alcanzadas por el trazo: basta con compartir una.
    // El filtro se elige por nombre; la especie guarda ids.
    if (filtros.zonas.length) {
      const idsElegidos = filtros.zonas.map(nombre => zonaPorNombre(nombre)?.id).filter(Boolean)
      lista = lista.filter(e =>
        idsElegidos.some(id => e.distribucion.zonas.includes(id)))
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
    setFiltros(prev => ({ ...prev, [clave]: prev[clave].filter(v => v !== valor) }))
  }

  const limpiarFiltros = () => { setFiltros(FILTROS_VACIOS); setConsulta('') }

  /* Los dos modos del mapa se fijan enteros, no uno a uno. */
  const fijarZonas = (ids) => setFiltros(prev => ({ ...prev, zonas: ids }))
  const fijarProvincias = (nombres) => setFiltros(prev => ({ ...prev, provincias: nombres }))

  const alternarSeleccion = (id) => {
    setSeleccion(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const limpiarSeleccion = () => { setSeleccion([]); setSoloSeleccion(false) }

  /* ── Filtros activos como lista plana, para pintar los chips ── */
  const activos = useMemo(() => {
    const salida = []
    for (const [clave, valores] of Object.entries(filtros)) {
      for (const valor of valores) {
        const etiqueta = valor
        salida.push({ clave, valor, etiqueta })
      }
    }
    return salida
  }, [filtros])

  return {
    especies, meta, total: todas.length,
    consulta, setConsulta,
    filtros, alternarFiltro, quitarFiltro, limpiarFiltros, activos, opciones,
    fijarZonas, fijarProvincias,
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
