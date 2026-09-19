#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════
   convertir-geojson.mjs

   Sustituye el contorno y las provincias aproximados de
   src/data/zonas.json por datos reales, a partir de GeoJSON.

   Uso:
     node scripts/convertir-geojson.mjs provincias.geojson
     node scripts/convertir-geojson.mjs provincias.geojson --contorno costa.geojson
     node scripts/convertir-geojson.mjs provincias.geojson --campo NAME_1
     node scripts/convertir-geojson.mjs provincias.geojson --revisar

   Opciones:
     --campo <clave>     propiedad con el nombre de la provincia.
                         Si no se pasa, la busca sola.
     --contorno <fichero> GeoJSON de la línea de costa (el resultado
                         de -dissolve en mapshaper). Si no se pasa, el
                         contorno se deja como está.
     --decimales <n>     precisión de las coordenadas (4 por defecto,
                         unos 11 m).
     --revisar           no escribe nada: solo informa.

   No toca la clave "zonas": tu catálogo de zonas se conserva.
   Antes de escribir deja una copia en zonas.json.bak
   ══════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DESTINO = resolve(AQUI, '../src/data/zonas.json')

/* Los 16 nombres que la app ya usa. Los avistamientos guardados
   llevan el nombre de la provincia como texto, así que si cambian
   los nombres se rompen los conteos. El script avisa si el GeoJSON
   trae otros. */
const NOMBRES_APP = [
  'Pinar del Río', 'Artemisa', 'La Habana', 'Mayabeque', 'Matanzas',
  'Cienfuegos', 'Villa Clara', 'Sancti Spíritus', 'Ciego de Ávila',
  'Camagüey', 'Las Tunas', 'Granma', 'Holguín', 'Santiago de Cuba',
  'Guantánamo', 'Isla de la Juventud'
]

/* Variantes que suelen aparecer en las fuentes -> nombre de la app.
   Añade aquí lo que te encuentres. */
const ALIAS = {
  'Ciudad de la Habana': 'La Habana',
  'La Habana (Ciudad)': 'La Habana',
  'Habana': 'La Habana',
  'Isla de la Juventud (Municipio Especial)': 'Isla de la Juventud',
  'Municipio Especial Isla de la Juventud': 'Isla de la Juventud',
  'Sancti Spiritus': 'Sancti Spíritus',
  'Camaguey': 'Camagüey',
  'Holguin': 'Holguín',
  'Guantanamo': 'Guantánamo',
  'Pinar del Rio': 'Pinar del Río',
  'Ciego de Avila': 'Ciego de Ávila'
}

const SIGLAS = {
  'Pinar del Río': 'PRí', 'Artemisa': 'Art', 'La Habana': 'Hab',
  'Mayabeque': 'May', 'Matanzas': 'Mtz', 'Cienfuegos': 'Cfg',
  'Villa Clara': 'VCl', 'Sancti Spíritus': 'SSp', 'Ciego de Ávila': 'CAv',
  'Camagüey': 'Cmg', 'Las Tunas': 'LTu', 'Granma': 'Gra',
  'Holguín': 'Hol', 'Santiago de Cuba': 'SCu', 'Guantánamo': 'Gtm',
  'Isla de la Juventud': 'IJu'
}

/* ── Argumentos ─────────────────────────────────────────────── */
const args = process.argv.slice(2)
if (args.length === 0 || args[0].startsWith('--')) {
  console.error('Falta el GeoJSON de provincias.\n' +
    'Uso: node scripts/convertir-geojson.mjs provincias.geojson [--campo NAME_1] [--contorno costa.geojson] [--revisar]')
  process.exit(1)
}

const entrada = args[0]
const opcion = (nombre, porDefecto = null) => {
  const i = args.indexOf(`--${nombre}`)
  return i === -1 ? porDefecto : (args[i + 1]?.startsWith('--') ? true : args[i + 1])
}
const campoPedido = opcion('campo')
const ficheroContorno = opcion('contorno')
const decimales = Number(opcion('decimales', 4))
const soloRevisar = args.includes('--revisar')

/* ── Utilidades ─────────────────────────────────────────────── */

const redondear = n => Number(n.toFixed(decimales))

/** Quita puntos repetidos seguidos, que sobran tras redondear. */
function limpiarAnillo(anillo) {
  const salida = []
  for (const [lon, lat] of anillo) {
    const p = [redondear(lon), redondear(lat)]
    const u = salida[salida.length - 1]
    if (!u || u[0] !== p[0] || u[1] !== p[1]) salida.push(p)
  }
  // El último punto suele repetir el primero: la app cierra sola el path.
  const a = salida[0], z = salida[salida.length - 1]
  if (salida.length > 1 && a[0] === z[0] && a[1] === z[1]) salida.pop()
  return salida
}

/**
 * Anillos exteriores de una geometría, en [lon, lat].
 * Los agujeros (anillos interiores) se descartan: en estas costas
 * son lagunas y no cambian nada para un mapa de distribución.
 */
function anillosDe(geometria) {
  if (!geometria) return []
  const { type, coordinates } = geometria
  if (type === 'Polygon') return [limpiarAnillo(coordinates[0])]
  if (type === 'MultiPolygon') return coordinates.map(poly => limpiarAnillo(poly[0]))
  console.warn(`  Geometría ignorada: ${type}`)
  return []
}

/** Adivina cuál propiedad lleva el nombre de la provincia. */
function detectarCampo(rasgos) {
  const candidatos = ['NAME_1', 'name', 'NOMBRE', 'nombre', 'NAME', 'prov_name', 'ADM1_ES']
  const props = rasgos[0]?.properties ?? {}
  for (const c of candidatos) if (c in props) return c
  // Si no, la primera propiedad de texto con 16 valores distintos
  for (const clave of Object.keys(props)) {
    const valores = new Set(rasgos.map(r => r.properties?.[clave]))
    if (typeof props[clave] === 'string' && valores.size >= 10) return clave
  }
  return null
}

const normalizar = t => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/** Nombre del GeoJSON -> nombre de la app. */
function nombreApp(bruto) {
  if (NOMBRES_APP.includes(bruto)) return bruto
  if (ALIAS[bruto]) return ALIAS[bruto]
  const n = normalizar(bruto)
  const hallado = NOMBRES_APP.find(x => normalizar(x) === n)
  return hallado ?? null
}

function superficie(anillo) {
  // Solo para ordenar anillos por tamaño; no son km² reales.
  let s = 0
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    s += anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1]
  }
  return Math.abs(s / 2)
}

/* ── Leer ───────────────────────────────────────────────────── */

if (!existsSync(entrada)) {
  console.error(`No existe: ${entrada}`)
  process.exit(1)
}

const geo = JSON.parse(readFileSync(entrada, 'utf8'))
const rasgos = geo.type === 'FeatureCollection' ? geo.features
  : geo.type === 'Feature' ? [geo]
  : null

if (!rasgos?.length) {
  console.error('El fichero no parece un FeatureCollection de GeoJSON.')
  process.exit(1)
}

const campo = campoPedido || detectarCampo(rasgos)
if (!campo) {
  console.error('No se encontró la propiedad del nombre. Pásala con --campo.')
  console.error('Propiedades disponibles: ' + Object.keys(rasgos[0].properties || {}).join(', '))
  process.exit(1)
}

console.log(`Entrada:  ${entrada}`)
console.log(`Campo:    ${campo}`)
console.log(`Rasgos:   ${rasgos.length}`)
console.log('')

/* ── Convertir provincias ───────────────────────────────────── */

const provincias = []
const sinReconocer = []
const faltantes = new Set(NOMBRES_APP)

for (const r of rasgos) {
  const bruto = String(r.properties?.[campo] ?? '').trim()
  const nombre = nombreApp(bruto)

  if (!nombre) {
    sinReconocer.push(bruto)
    continue
  }
  faltantes.delete(nombre)

  const anillos = anillosDe(r.geometry)
    .filter(a => a.length >= 3)
    .sort((a, b) => superficie(b) - superficie(a))

  if (!anillos.length) {
    console.warn(`  ${nombre}: sin geometría utilizable`)
    continue
  }

  provincias.push({
    nombre,
    sigla: SIGLAS[nombre] ?? nombre.slice(0, 3),
    poligonos: anillos
  })
}

// El orden de la app es oeste -> este: se mantiene ordenando por longitud.
provincias.sort((a, b) => {
  const oeste = p => Math.min(...p.poligonos.flat().map(c => c[0]))
  return oeste(a) - oeste(b)
})

/* ── Contorno ───────────────────────────────────────────────── */

let contorno = null
if (typeof ficheroContorno === 'string') {
  if (!existsSync(ficheroContorno)) {
    console.error(`No existe: ${ficheroContorno}`)
    process.exit(1)
  }
  const gc = JSON.parse(readFileSync(ficheroContorno, 'utf8'))
  const rc = gc.type === 'FeatureCollection' ? gc.features : [gc]
  const anillos = rc.flatMap(r => anillosDe(r.geometry ?? r))
    .filter(a => a.length >= 3)
    .sort((a, b) => superficie(b) - superficie(a))

  if (anillos.length) {
    // El anillo mayor es la isla principal; el siguiente, la Isla de
    // la Juventud. El resto son cayos: se guardan aparte.
    contorno = {
      cuba: anillos[0],
      isla_juventud: anillos[1] ?? [],
      cayos: anillos.slice(2, 40)
    }
  }
}

/* ── Informe ────────────────────────────────────────────────── */

const todos = provincias.flatMap(p => p.poligonos.flat())
const bbox = todos.length ? [
  Math.min(...todos.map(c => c[0])), Math.min(...todos.map(c => c[1])),
  Math.max(...todos.map(c => c[0])), Math.max(...todos.map(c => c[1]))
] : null

console.log(`Provincias convertidas: ${provincias.length} de 16`)
for (const p of provincias) {
  const puntos = p.poligonos.reduce((s, a) => s + a.length, 0)
  console.log(`  ${p.nombre.padEnd(22)} ${String(p.poligonos.length).padStart(3)} anillo(s)  ${String(puntos).padStart(5)} puntos`)
}

if (faltantes.size) {
  console.log('\nNo aparecieron en el GeoJSON:')
  for (const f of faltantes) console.log(`  ${f}`)
}
if (sinReconocer.length) {
  console.log('\nNombres que no supe emparejar (añádelos a ALIAS en este script):')
  for (const s of [...new Set(sinReconocer)]) console.log(`  «${s}»`)
}

if (bbox) {
  console.log('\nExtensión de los datos:')
  console.log(`  longitud  ${bbox[0]}  a  ${bbox[2]}`)
  console.log(`  latitud   ${bbox[1]}  a  ${bbox[3]}`)
  console.log('\nSi se sale del marco actual, ajusta MAPA en src/lib/geometria.js:')
  console.log(`  lon0: ${(bbox[0] - 0.1).toFixed(2)}, lon1: ${(bbox[2] + 0.1).toFixed(2)},`)
  console.log(`  lat0: ${(bbox[1] - 0.1).toFixed(2)}, lat1: ${(bbox[3] + 0.1).toFixed(2)},`)
}

const puntosTotales = provincias.reduce((s, p) => s + p.poligonos.reduce((t, a) => t + a.length, 0), 0)
console.log(`\nPuntos en total: ${puntosTotales}`)
if (puntosTotales > 12000) {
  console.log('  Son muchos para una app que se descarga al teléfono.')
  console.log('  Vuelve a mapshaper y simplifica más (-simplify 2% keep-shapes).')
}

/* ── Escribir ───────────────────────────────────────────────── */

if (soloRevisar) {
  console.log('\n--revisar: no se ha escrito nada.')
  process.exit(0)
}

if (provincias.length < 10) {
  console.error('\nSe reconocieron muy pocas provincias. No escribo nada.')
  console.error('Revisa --campo y los nombres de arriba.')
  process.exit(1)
}

const actual = JSON.parse(readFileSync(DESTINO, 'utf8'))
copyFileSync(DESTINO, DESTINO + '.bak')

const salida = {
  ...actual,
  aviso: 'Contorno y provincias con datos reales. Las zonas del catálogo son aparte: revisa su procedencia una por una.',
  fuente_limites: `${entrada} (convertido con scripts/convertir-geojson.mjs)`,
  contorno: contorno ?? actual.contorno,
  provincias,
  zonas: actual.zonas   // el catálogo de zonas no se toca
}
delete salida.latitud_division   // ya no hace falta: las provincias son polígonos

writeFileSync(DESTINO, JSON.stringify(salida, null, 1), 'utf8')

console.log(`\nEscrito:  ${DESTINO}`)
console.log(`Copia:    ${DESTINO}.bak`)
console.log('\nAhora hay que cambiar el dibujado de las provincias:')
console.log('  ver GUIA-DATOS.md, apartado «Cambiar el código que dibuja las provincias».')
