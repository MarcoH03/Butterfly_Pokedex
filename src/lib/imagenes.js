/* ══════════════════════════════════════════════════════════════
   Rutas de imagen.

   El catálogo trae la ruta de cada imagen desde el principio, pero
   los archivos no existen hasta que los subes. Si el navegador las
   pide de todas formas, una cuadrícula de 207 especies dispara 207
   peticiones que acaban en 404 — y en GitHub Pages cada 404 es un
   viaje de ida y vuelta. Eso era la lentitud.

   Por eso cada especie declara qué imágenes tiene de verdad:

     "imagenes_listas": ["lamina", "montado"]

   Solo esas se piden. Las demás muestran la silueta directamente,
   sin tocar la red. Cuando subas un archivo, añade su clave a la
   lista.

   Claves: lamina · montado · huevo · larva · pupa · hospedera
   ══════════════════════════════════════════════════════════════ */

/* El catálogo guarda las rutas relativas ("img/laminas/001_….jpg").
   Una ruta relativa se resuelve contra la URL de la página, así que en
   la ficha (/especie/5) el navegador pedía /especie/img/laminas/… y
   solo salía la silueta. Hay que anclarlas a la base de la app, que en
   GitHub Pages no es la raíz del dominio. */
const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'

function conBase(ruta) {
  if (!ruta) return null
  if (/^([a-z]+:|\/\/|\/)/i.test(ruta)) return ruta   // absoluta, data:, blob:…
  return BASE.replace(/\/+$/, '') + '/' + ruta.replace(/^\/+/, '')
}

/**
 * Ruta de una imagen del catálogo, o null si el archivo no está.
 * @param {object} especie
 * @param {string} clave  lamina | montado | huevo | larva | pupa | hospedera
 */
export function rutaImagen(especie, clave) {
  if (!especie?.imagenes) return null
  if (!(especie.imagenes_listas ?? []).includes(clave)) return null

  const ruta = especie.imagenes[clave]
  // `adult` es una lista en versiones antiguas del catálogo
  return conBase(Array.isArray(ruta) ? (ruta[0] ?? null) : (ruta ?? null))
}

/** ¿Esta especie tiene alguna imagen subida? */
export function tieneImagenes(especie) {
  return (especie?.imagenes_listas ?? []).length > 0
}

/**
 * La imagen para la vista pedida y, si no está, la otra.
 *
 * Del libro salieron 180 láminas pero solo 154 montados, así que
 * muchas especies tienen una vista y no la otra. Antes de dibujar una
 * silueta, se prueba con la que sí existe: es mejor ver la mariposa en
 * la otra vista que no verla.
 *
 * Devuelve `{ src, clave }`, donde `clave` dice cuál se está usando.
 */
export function rutaImagenOAlterna(especie, vista) {
  const pedida = vista === 'montados' ? 'montado' : 'lamina'
  const otra = pedida === 'montado' ? 'lamina' : 'montado'
  const src = rutaImagen(especie, pedida)
  if (src) return { src, clave: pedida }
  const alterna = rutaImagen(especie, otra)
  return alterna ? { src: alterna, clave: otra } : { src: null, clave: null }
}
