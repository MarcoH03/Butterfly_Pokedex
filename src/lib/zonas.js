import semilla from '../data/zonas.json'
import { leer, escribir } from './almacen'
import { metrosEntre, puntoEnDiscos, centroDeDiscos } from './geometria'
import { normalizar } from './buscar'

/* ══════════════════════════════════════════════════════════════
   Catálogo de zonas vivo.

   Una zona no es un polígono dibujado a mano: es una unión de
   discos de 500 m centrados en puntos GPS reales. Crece sola con
   el trabajo de campo.

     - Anotas en una zona nueva      -> nace la zona con un disco
     - Anotas en una zona conocida
       y el GPS cae dentro           -> no cambia nada
     - Anotas en una zona conocida
       y el GPS cae fuera            -> se le añade otro disco

   Así, después de una temporada, «Guanahacabibes» es el conjunto
   real de sitios donde has estado, no un contorno inventado.

   Las zonas de `data/zonas.json` son la semilla (macizos, ciénagas)
   y no se pueden borrar. Las tuyas viven en el teléfono.
   ══════════════════════════════════════════════════════════════ */

export const RADIO_NUEVO = 500   // metros

/* ── Semilla: las zonas del catálogo, con su polígono ────────── */
const SEMILLA = semilla.zonas.map(z => ({
  id: z.id,
  nombre: z.nombre,
  provincias: z.provincias,
  poligono: z.poligono,     // las de semilla vienen como polígono
  discos: [],
  origen: 'catalogo'
}))

/* ── Lectura ─────────────────────────────────────────────────── */

/** Todas las zonas: las de catálogo más las tuyas. */
export function todasLasZonas() {
  return [...SEMILLA, ...(leer().zonas || [])]
}

export function zonaPorId(id) {
  return todasLasZonas().find(z => z.id === id) || null
}

/**
 * Coincidencias por nombre, para el autocompletado.
 * Primero las que empiezan por el texto, después las que lo contienen.
 */
export function sugerirZonas(texto, limite = 6) {
  const q = normalizar(texto)
  if (!q) return todasLasZonas().slice(0, limite)

  const puntuadas = []
  for (const z of todasLasZonas()) {
    const n = normalizar(z.nombre)
    if (n === q) puntuadas.push([z, 3])
    else if (n.startsWith(q)) puntuadas.push([z, 2])
    else if (n.includes(q)) puntuadas.push([z, 1])
  }
  return puntuadas
    .sort((a, b) => b[1] - a[1] || a[0].nombre.localeCompare(b[0].nombre))
    .slice(0, limite)
    .map(([z]) => z)
}

/** Ubicación por defecto de una zona: el centro de lo que abarca. */
export function centroDeZona(zona) {
  if (!zona) return null
  if (zona.discos?.length) return centroDeDiscos(zona.discos)
  if (zona.poligono?.length) {
    const lon = zona.poligono.reduce((s, p) => s + p[0], 0) / zona.poligono.length
    const lat = zona.poligono.reduce((s, p) => s + p[1], 0) / zona.poligono.length
    return { lon, lat }
  }
  return null
}

/** ¿Esta ubicación ya está cubierta por la zona? */
export function zonaCubre(zona, lat, lon) {
  if (!zona) return false
  if (zona.discos?.length && puntoEnDiscos([lon, lat], zona.discos)) return true
  // Para las de semilla, basta con estar a menos de 5 km de su centro:
  // sus polígonos son aproximados y no conviene fiarse del borde.
  if (zona.poligono?.length) {
    const c = centroDeZona(zona)
    return c && metrosEntre([lon, lat], [c.lon, c.lat]) <= 5000
  }
  return false
}

/* ── Escritura: la zona crece ────────────────────────────────── */

function idDesdeNombre(nombre) {
  return normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

/**
 * Registra una ubicación en una zona por su nombre.
 * Crea la zona si no existe; le añade un disco si el punto cae fuera.
 *
 * @returns {{ zona, accion: 'creada'|'ampliada'|'sin_cambio' }}
 */
export function registrarUbicacion(nombre, lat, lon) {
  if (!nombre?.trim() || lat == null || lon == null) return null

  const datos = leer()
  datos.zonas = datos.zonas || []

  const q = normalizar(nombre)
  const existente = todasLasZonas().find(z => normalizar(z.nombre) === q)

  // Zona nueva
  if (!existente) {
    let id = idDesdeNombre(nombre)
    // Evitar choque de ids
    while (todasLasZonas().some(z => z.id === id)) id += '-2'

    const zona = {
      id,
      nombre: nombre.trim(),
      provincias: [],
      discos: [{ lat, lon, r: RADIO_NUEVO, fecha: new Date().toISOString() }],
      origen: 'campo'
    }
    datos.zonas.push(zona)
    escribir(datos)
    return { zona, accion: 'creada' }
  }

  // Ya cubierta: nada que hacer
  if (zonaCubre(existente, lat, lon)) {
    return { zona: existente, accion: 'sin_cambio' }
  }

  // Zona de catálogo que hay que empezar a ampliar con datos de campo:
  // se copia al almacén del teléfono y desde ahí crece.
  let propia = datos.zonas.find(z => normalizar(z.nombre) === q)
  if (!propia) {
    propia = {
      id: existente.id,
      nombre: existente.nombre,
      provincias: existente.provincias || [],
      poligono: existente.poligono,
      discos: [],
      origen: existente.origen === 'catalogo' ? 'catalogo+campo' : 'campo'
    }
    datos.zonas.push(propia)
  }

  propia.discos.push({ lat, lon, r: RADIO_NUEVO, fecha: new Date().toISOString() })
  escribir(datos)
  return { zona: propia, accion: 'ampliada' }
}

/** Renombrar una zona propia. Las de catálogo puro no se tocan. */
export function renombrarZona(id, nombre) {
  const datos = leer()
  const z = (datos.zonas || []).find(z => z.id === id)
  if (!z) return false
  z.nombre = nombre.trim()
  return escribir(datos)
}

/** Borrar una zona propia (las de semilla no se borran). */
export function borrarZona(id) {
  const datos = leer()
  datos.zonas = (datos.zonas || []).filter(z => z.id !== id)
  return escribir(datos)
}

/** Cuántos metros cuadrados cubre, para saber si una zona ya es grande. */
export function areaAproximada(zona) {
  if (!zona?.discos?.length) return 0
  // Sin restar solapes: sirve como orden de magnitud.
  return zona.discos.reduce((s, d) => s + Math.PI * d.r * d.r, 0)
}
