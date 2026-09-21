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
  return Array.isArray(ruta) ? (ruta[0] ?? null) : (ruta ?? null)
}

/** ¿Esta especie tiene alguna imagen subida? */
export function tieneImagenes(especie) {
  return (especie?.imagenes_listas ?? []).length > 0
}
