/* ══════════════════════════════════════════════════════════════
   Búsqueda con orden por relevancia.

   Busca en el nombre científico y en los nombres alternos, y
   ordena los resultados por lo buena que es la coincidencia.
   No usa librerías: así la app sigue funcionando sin conexión
   y sin peso extra.

   Jerarquía de coincidencias (de mejor a peor):
     1000  el texto es exactamente el nombre
      900  el nombre empieza por el texto
      800  una palabra del nombre empieza por el texto
      700  el nombre contiene el texto
      600  coincidencia por nombre alterno (mismo desglose, -150)
      ...  coincidencia aproximada por distancia de edición
   ══════════════════════════════════════════════════════════════ */

/** Quita acentos y pasa a minúsculas, para que "guantánamo" == "guantanamo". */
export function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Distancia de Levenshtein: cuántas ediciones (insertar, borrar,
 * sustituir) hacen falta para convertir a en b.
 * Sirve para tolerar errores de tecleo: "heliconius" vs "heliconios".
 */
function distancia(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  // Solo guardamos dos filas de la matriz: basta y gasta mucho menos.
  let previa = Array.from({ length: b.length + 1 }, (_, i) => i)
  let actual = new Array(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    actual[0] = i
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1
      actual[j] = Math.min(
        previa[j] + 1,        // borrar
        actual[j - 1] + 1,    // insertar
        previa[j - 1] + coste // sustituir
      )
    }
    ;[previa, actual] = [actual, previa]
  }
  return previa[b.length]
}

/** Puntúa un texto candidato contra la consulta. 0 = no coincide. */
function puntuar(candidato, consulta) {
  const c = normalizar(candidato)
  const q = normalizar(consulta)
  if (!c || !q) return 0

  if (c === q) return 1000
  if (c.startsWith(q)) return 900

  // ¿Alguna palabra empieza por la consulta? ("atala" -> "Eumaeus atala")
  const palabras = c.split(/\s+/)
  if (palabras.some(p => p.startsWith(q))) return 800

  if (c.includes(q)) return 700

  // Coincidencia aproximada, solo si la consulta es lo bastante larga
  // para que el parecido signifique algo.
  if (q.length >= 4) {
    // Contra el texto completo
    const d = distancia(c, q)
    const tolerancia = Math.max(1, Math.floor(q.length / 3))
    if (d <= tolerancia) return 500 - d * 20

    // Contra cada palabra por separado
    for (const p of palabras) {
      if (Math.abs(p.length - q.length) > tolerancia + 1) continue
      const dp = distancia(p, q)
      if (dp <= tolerancia) return 450 - dp * 20
    }
  }

  return 0
}

/**
 * Busca especies y devuelve las coincidencias ordenadas.
 * @param {Array} especies  lista completa
 * @param {string} consulta texto escrito por el usuario
 * @returns {Array} especies con `_puntos` y `_motivo` añadidos
 */
export function buscarEspecies(especies, consulta) {
  const q = normalizar(consulta)
  if (!q) return especies

  const resultados = []

  for (const esp of especies) {
    // 1. Nombre científico: la coincidencia de más peso
    let puntos = puntuar(esp.nombre, consulta)
    let motivo = puntos > 0 ? 'nombre' : null

    // 2. Nombres alternos: valen algo menos que el científico
    for (const alt of esp.nombres_alternos || []) {
      const p = puntuar(alt, consulta) - 150
      if (p > puntos) { puntos = p; motivo = alt }
    }

    // 3. Familia y subfamilia: coincidencia débil, solo si es literal
    if (puntos <= 0) {
      const pf = puntuar(esp.familia, consulta)
      const ps = puntuar(esp.subfamilia, consulta)
      const pt = Math.max(pf, ps)
      if (pt >= 700) { puntos = pt - 400; motivo = 'clasificación' }
    }

    if (puntos > 0) resultados.push({ ...esp, _puntos: puntos, _motivo: motivo })
  }

  // Orden: primero los más relevantes; a igualdad, por número de catálogo.
  resultados.sort((a, b) => b._puntos - a._puntos || a.id - b.id)
  return resultados
}
