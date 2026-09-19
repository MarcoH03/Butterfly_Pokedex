/* ══════════════════════════════════════════════════════════════
   Almacén de datos personales.

   Los datos de las especies vienen del JSON y nunca cambian.
   Los datos TUYOS —avistamientos, notas, fotos— viven aquí, en el
   almacenamiento del navegador del teléfono. No salen del
   dispositivo y funcionan sin conexión.

   Aviso importante: si borras los datos de Safari, se van. Usa
   exportar() de vez en cuando para guardar una copia.
   ══════════════════════════════════════════════════════════════ */

const CLAVE = 'mariposas:v2'

/**
 * Identificador único. crypto.randomUUID solo existe en contexto
 * seguro (HTTPS o localhost); si sirves por http:// en la red local
 * no está, así que hace falta la alternativa.
 */
function nuevoId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const VACIO = {
  // [{ id, especieId, fecha, lat, lon, provincia, zonaId, lugar, capturada, nota, foto }]
  avistamientos: [],
  notas: {},           // { [especieId]: "texto libre" }
  galeria: {},         // { [especieId]: [{ id, dataUrl, pie, fecha }] }
  // Fotos de los estadios que vas consiguiendo en el campo:
  // { [especieId]: { huevo, larva, pupa, hospedera } } -> data URL
  estadios: {},
  zonas: [],           // zonas tuyas, que crecen con el trabajo de campo
  seleccion: []        // ids marcados a mano en la pantalla principal
}

/* ── Lectura y escritura ─────────────────────────────────────── */

export function leer() {
  try {
    const bruto = localStorage.getItem(CLAVE)
    if (!bruto) return { ...VACIO }
    // Mezclamos con VACIO para que una versión vieja sin algún
    // campo no rompa la app.
    return { ...VACIO, ...JSON.parse(bruto) }
  } catch {
    // Safari en modo privado puede lanzar al tocar localStorage.
    return { ...VACIO }
  }
}

export function escribir(datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos))
    return true
  } catch {
    return false
  }
}

/* ── Avistamientos ───────────────────────────────────────────── */

/** Crea un avistamiento. Solo especieId es obligatorio. */
export function anotarAvistamiento({
  especieId, lat, lon, provincia, lugar, zonaId, capturada, nota, foto, fecha
}) {
  const datos = leer()
  const avistamiento = {
    id: nuevoId(),
    especieId,
    fecha: fecha || new Date().toISOString(),
    lat: lat ?? null,
    lon: lon ?? null,
    provincia: provincia || '',
    lugar: lugar || '',
    zonaId: zonaId || null,
    capturada: !!capturada,
    nota: nota || '',
    foto: foto || null
  }
  datos.avistamientos.push(avistamiento)
  escribir(datos)
  return avistamiento
}

export function editarAvistamiento(id, cambios) {
  const datos = leer()
  const i = datos.avistamientos.findIndex(a => a.id === id)
  if (i === -1) return null
  datos.avistamientos[i] = { ...datos.avistamientos[i], ...cambios }
  escribir(datos)
  return datos.avistamientos[i]
}

export function borrarAvistamiento(id) {
  const datos = leer()
  datos.avistamientos = datos.avistamientos.filter(a => a.id !== id)
  escribir(datos)
}

/** Avistamientos de una especie, del más reciente al más antiguo. */
export function avistamientosDe(especieId) {
  return leer().avistamientos
    .filter(a => a.especieId === especieId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

/**
 * Cuenta avistamientos por lugar, para la vista "dónde la he visto".
 * @returns [{ lugar, provincia, veces, ultima }] ordenado por veces
 */
export function conteoPorLugar(especieId) {
  const mapa = new Map()
  for (const a of avistamientosDe(especieId)) {
    const clave = a.lugar || a.provincia || 'Sin localidad'
    const previo = mapa.get(clave)
    if (previo) {
      previo.veces++
      if (new Date(a.fecha) > new Date(previo.ultima)) previo.ultima = a.fecha
    } else {
      mapa.set(clave, { lugar: clave, provincia: a.provincia, veces: 1, ultima: a.fecha })
    }
  }
  return [...mapa.values()].sort((a, b) => b.veces - a.veces)
}

/** Avistamientos por provincia, para sombrear el mapa de la ficha. */
export function conteoPorProvincia(especieId) {
  const mapa = {}
  for (const a of avistamientosDe(especieId)) {
    if (!a.provincia) continue
    mapa[a.provincia] = (mapa[a.provincia] || 0) + 1
  }
  return mapa
}

/* ── Notas ───────────────────────────────────────────────────── */

export function leerNota(especieId) {
  return leer().notas[especieId] || ''
}

export function guardarNota(especieId, texto) {
  const datos = leer()
  if (texto.trim()) datos.notas[especieId] = texto
  else delete datos.notas[especieId]
  escribir(datos)
}

/* ── Galería personal ────────────────────────────────────────── */
/*
  Las fotos se guardan como data URL (base64) dentro del mismo
  almacén. localStorage ronda los 5 MB por sitio, así que la app
  reduce cada imagen antes de guardarla (ver comprimirImagen).
*/

export function galeriaDe(especieId) {
  return leer().galeria[especieId] || []
}

export function agregarFoto(especieId, dataUrl, pie = '') {
  const datos = leer()
  const lista = datos.galeria[especieId] || []
  lista.push({ id: nuevoId(), dataUrl, pie, fecha: new Date().toISOString() })
  datos.galeria[especieId] = lista
  return escribir(datos)
}

export function borrarFoto(especieId, fotoId) {
  const datos = leer()
  datos.galeria[especieId] = (datos.galeria[especieId] || []).filter(f => f.id !== fotoId)
  escribir(datos)
}

/**
 * Reduce una imagen a un ancho máximo y la devuelve como data URL JPEG.
 * Sin esto, tres fotos del iPhone llenan el almacenamiento.
 */
export function comprimirImagen(archivo, anchoMax = 1200, calidad = 0.78) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'))
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo abrir la imagen'))
      img.onload = () => {
        const escala = Math.min(1, anchoMax / img.width)
        const lienzo = document.createElement('canvas')
        lienzo.width = Math.round(img.width * escala)
        lienzo.height = Math.round(img.height * escala)
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
        resolve(lienzo.toDataURL('image/jpeg', calidad))
      }
      img.src = lector.result
    }
    lector.readAsDataURL(archivo)
  })
}

/* ── Fotos de estadios ──────────────────────────────────────── */
/*
  El catálogo trae rutas de archivo para huevo, larva, pupa y planta
  hospedera, pero muchas no existen: son justo las que vas
  descubriendo en el campo. Estas las añades desde la app y se
  guardan aquí, y tienen prioridad sobre el archivo del catálogo.
*/

export const ESTADIOS = ['huevo', 'larva', 'pupa', 'hospedera']

export function estadiosDe(especieId) {
  return leer().estadios[especieId] || {}
}

/** Foto de un estadio, o null. `clave` es uno de ESTADIOS. */
export function fotoEstadio(especieId, clave) {
  return estadiosDe(especieId)[clave] || null
}

export function guardarFotoEstadio(especieId, clave, dataUrl) {
  const datos = leer()
  datos.estadios[especieId] = { ...(datos.estadios[especieId] || {}), [clave]: dataUrl }
  return escribir(datos)
}

export function borrarFotoEstadio(especieId, clave) {
  const datos = leer()
  if (datos.estadios[especieId]) {
    delete datos.estadios[especieId][clave]
    if (Object.keys(datos.estadios[especieId]).length === 0) delete datos.estadios[especieId]
  }
  return escribir(datos)
}

/* ── Selección manual ────────────────────────────────────────── */

export function leerSeleccion() {
  return leer().seleccion
}

export function guardarSeleccion(ids) {
  const datos = leer()
  datos.seleccion = ids
  escribir(datos)
}

/* ── Copia de seguridad ──────────────────────────────────────── */

/** Descarga todos tus datos personales como un archivo JSON. */
export function exportar() {
  const datos = leer()
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mariposas-respaldo-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Restaura desde un archivo exportado. Reemplaza lo que haya. */
export async function importar(archivo) {
  const texto = await archivo.text()
  const datos = JSON.parse(texto)
  return escribir({ ...VACIO, ...datos })
}

/** Cuánto espacio ocupan tus datos, en KB. */
export function espacioUsado() {
  try {
    return Math.round((localStorage.getItem(CLAVE) || '').length / 1024)
  } catch {
    return 0
  }
}
