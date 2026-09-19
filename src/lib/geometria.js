/* ══════════════════════════════════════════════════════════════
   Geometría para el filtro por zonas.

   Todo trabaja en grados (longitud, latitud) como pares [lon, lat].
   A la escala de Cuba y para decidir «se tocan o no», tratar los
   grados como un plano es suficiente: no hay que proyectar.

   Sin librerías: la app tiene que funcionar sin conexión y sin peso
   extra.
   ══════════════════════════════════════════════════════════════ */

/**
 * ¿El punto está dentro del polígono?
 * Lanzamiento de rayo: cuenta cuántos lados cruza una semirrecta
 * horizontal. Impar = dentro.
 */
export function puntoDentro(punto, poligono) {
  const [x, y] = punto
  let dentro = false
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i]
    const [xj, yj] = poligono[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      dentro = !dentro
    }
  }
  return dentro
}

/** Distancia mínima del punto p al segmento a–b. */
export function distanciaASegmento(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const largo2 = dx * dx + dy * dy
  if (largo2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])

  // Proyección de p sobre la recta, recortada al segmento
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / largo2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/** ¿Se cruzan los segmentos a–b y c–d? */
export function segmentosCruzan(a, b, c, d) {
  const giro = (p, q, r) =>
    Math.sign((q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]))
  return (
    giro(a, b, c) !== giro(a, b, d) &&
    giro(c, d, a) !== giro(c, d, b)
  )
}

/** Caja envolvente de un polígono: [minLon, minLat, maxLon, maxLat]. */
export function caja(poligono) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of poligono) {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  return [x0, y0, x1, y1]
}

/** ¿Se solapan dos cajas, con un margen? Descarte rápido. */
function cajasSeSolapan(a, b, margen = 0) {
  return !(
    a[2] + margen < b[0] || b[2] + margen < a[0] ||
    a[3] + margen < b[1] || b[3] + margen < a[1]
  )
}

/**
 * ¿El trazo del dedo alcanza esta zona?
 *
 * El trazo se comporta como un plumón: una línea con grosor. La
 * regla es deliberadamente generosa, porque basta con que la zona
 * quede contenida en parte:
 *
 *   a) algún punto del trazo cae dentro de la zona
 *   b) algún vértice de la zona queda a menos de `radio` del trazo
 *   c) si el trazo se cerró en lazo, la zona cae dentro del lazo
 *      o sus bordes se cruzan
 *
 * @param {Array} trazo   puntos [lon, lat] en el orden dibujado
 * @param {Array} zona    polígono [lon, lat]
 * @param {number} radio  mitad del grosor del plumón, en grados
 */
export function trazoAlcanzaZona(trazo, zona, radio) {
  if (!trazo?.length || !zona?.length) return false

  // Descarte rápido por caja envolvente: evita recorrer zonas lejanas.
  if (!cajasSeSolapan(caja(trazo), caja(zona), radio)) return false

  // a) el trazo entra en la zona
  for (const punto of trazo) {
    if (puntoDentro(punto, zona)) return true
  }

  // b) la zona queda debajo del grosor del trazo
  for (const vertice of zona) {
    if (trazo.length === 1) {
      if (Math.hypot(vertice[0] - trazo[0][0], vertice[1] - trazo[0][1]) <= radio) {
        return true
      }
    } else {
      for (let i = 1; i < trazo.length; i++) {
        if (distanciaASegmento(vertice, trazo[i - 1], trazo[i]) <= radio) return true
      }
    }
  }

  // c) el trazo rodea la zona, o los bordes se cruzan
  if (trazo.length >= 3) {
    for (const vertice of zona) {
      if (puntoDentro(vertice, trazo)) return true
    }
    for (let i = 1; i < trazo.length; i++) {
      for (let j = 0, k = zona.length - 1; j < zona.length; k = j++) {
        if (segmentosCruzan(trazo[i - 1], trazo[i], zona[k], zona[j])) return true
      }
    }
  }

  return false
}

/** Ids de las zonas que el trazo alcanza. */
export function zonasAlcanzadas(trazo, zonas, radio) {
  return zonas.filter(z => trazoAlcanzaZona(trazo, z.poligono, radio)).map(z => z.id)
}

/* ── Proyección ──────────────────────────────────────────────── */
/*
  Equirectangular con el ancho corregido por cos(latitud media),
  para que Cuba no salga estirada. Suficiente para una isla de
  ~3,5° de latitud, y reversible, que es lo que hace falta para
  convertir el dedo en coordenadas.
*/
export const MAPA = {
  lon0: -85.05, lon1: -74.05,
  lat0: 19.70,  lat1: 23.35,
  k: 100,
  cos: Math.cos((21.5 * Math.PI) / 180)
}

export const ANCHO_MAPA = (MAPA.lon1 - MAPA.lon0) * MAPA.k * MAPA.cos
export const ALTO_MAPA  = (MAPA.lat1 - MAPA.lat0) * MAPA.k

export const aX = lon => (lon - MAPA.lon0) * MAPA.k * MAPA.cos
export const aY = lat => (MAPA.lat1 - lat) * MAPA.k
export const aLon = x => MAPA.lon0 + x / (MAPA.k * MAPA.cos)
export const aLat = y => MAPA.lat1 - y / MAPA.k

/** Polígono [lon,lat] -> atributo `d` de un <path> cerrado. */
export function aRuta(poligono) {
  return (
    poligono
      .map(([lon, lat], i) => `${i ? 'L' : 'M'}${aX(lon).toFixed(1)} ${aY(lat).toFixed(1)}`)
      .join(' ') + ' Z'
  )
}

/** Grosor del plumón en unidades de mapa -> radio en grados.
    MapaZonas hace este cálculo en línea; queda aquí por si hace falta. */
export function radioEnGrados(grosor) {
  return grosor / 2 / MAPA.k
}

/* ══════════════════════════════════════════════════════════════
   DISTANCIAS REALES Y DISCOS

   Las zonas que nacen en el campo no son polígonos dibujados:
   son uniones de discos de 500 m centrados en puntos GPS. Para
   eso hacen falta metros, no grados.
   ══════════════════════════════════════════════════════════════ */

const RADIO_TIERRA = 6371000
export const METROS_POR_GRADO_LAT = 111320

/** Metros entre dos puntos [lon, lat]. Equirectangular: exacta de sobra
    para distancias de kilómetros. */
export function metrosEntre(a, b) {
  const latMedia = ((a[1] + b[1]) / 2) * Math.PI / 180
  const dx = (b[0] - a[0]) * Math.cos(latMedia) * METROS_POR_GRADO_LAT
  const dy = (b[1] - a[1]) * METROS_POR_GRADO_LAT
  return Math.hypot(dx, dy)
}

/** Metros -> grados de latitud. Para pintar un disco en el mapa. */
export function metrosAGradosLat(metros) {
  return metros / METROS_POR_GRADO_LAT
}

/** ¿El punto cae dentro de alguno de los discos de la zona? */
export function puntoEnDiscos(punto, discos) {
  return discos.some(d => metrosEntre(punto, [d.lon, d.lat]) <= d.r)
}

/**
 * ¿El trazo del dedo alcanza una zona hecha de discos?
 * Un disco entra si su centro queda a menos de (radio del disco +
 * radio del plumón) del trazo.
 *
 * @param {Array} trazo  puntos [lon, lat]
 * @param {Array} discos [{lat, lon, r}] con r en metros
 * @param {number} radioGrados  mitad del grosor del plumón, en grados
 */
export function trazoAlcanzaDiscos(trazo, discos, radioGrados) {
  if (!trazo?.length || !discos?.length) return false

  const radioMetros = radioGrados * METROS_POR_GRADO_LAT

  for (const d of discos) {
    const centro = [d.lon, d.lat]
    const alcance = d.r + radioMetros

    if (trazo.length === 1) {
      if (metrosEntre(centro, trazo[0]) <= alcance) return true
      continue
    }

    for (let i = 1; i < trazo.length; i++) {
      // Distancia en grados al segmento, convertida a metros.
      // Se corrige la longitud por cos(lat) para no subestimar.
      const cos = Math.cos(d.lat * Math.PI / 180)
      const esc = p => [p[0] * cos, p[1]]
      const dist = distanciaASegmento(esc(centro), esc(trazo[i - 1]), esc(trazo[i]))
      if (dist * METROS_POR_GRADO_LAT <= alcance) return true
    }
  }
  return false
}

/** Centro aproximado de una zona: media de los centros de sus discos. */
export function centroDeDiscos(discos) {
  if (!discos?.length) return null
  const lon = discos.reduce((s, d) => s + d.lon, 0) / discos.length
  const lat = discos.reduce((s, d) => s + d.lat, 0) / discos.length
  return { lon, lat }
}
