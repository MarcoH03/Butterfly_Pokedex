# Guía de datos

Cómo sustituir cada dato inventado por el real. El orden importa: el mapa
primero, porque las zonas dependen de él y las especies dependen de las
zonas.

Qué hay inventado ahora mismo, para que lo tengas todo a la vista:

| Dato | Estado | Dónde |
|---|---|---|
| Contorno de Cuba | 47 puntos dibujados a mano | `src/data/zonas.json` → `contorno` |
| Provincias | bandas de longitud, no formas | `src/data/zonas.json` → `provincias` |
| 9 zonas del catálogo | polígonos inventados | `src/data/zonas.json` → `zonas` |
| 207 especies | taxonomía real, todo lo demás vacío | `src/data/especies.json` |
| Imágenes | no existen; sale una silueta | `public/img/` |

Los avistamientos, notas y fotos que metas desde la app **son datos
reales desde el primer día**: viven en el teléfono y nada de esto los
toca.

---

## 1. Contorno y provincias

### De dónde sacarlos

| Fuente | Qué da | Notas |
|---|---|---|
| [gadm.org](https://gadm.org) | provincias (nivel 1) y municipios (nivel 2) | gratis para uso no comercial; es lo que quieres |
| [Natural Earth](https://www.naturalearthdata.com) | costas y provincias, ya simplificadas | dominio público, más grueso |
| [protectedplanet.net](https://www.protectedplanet.net) | áreas protegidas | para el apartado 2 |

En GADM: descarga Cuba, nivel 1. El campo con el nombre suele llamarse
`NAME_1`, pero compruébalo.

### Simplificar

Los polígonos de GADM traen decenas de miles de puntos. Sin simplificar,
`zonas.json` pasa de varios megas y la app se vuelve lenta de descargar
al teléfono, que es justo lo que no queremos en una PWA sin conexión.

Usa **[mapshaper.org](https://mapshaper.org)** en el navegador, sin
instalar nada. Arrastra el fichero y abre la consola:

```
-simplify 3% keep-shapes
-o precision=0.0001 format=geojson provincias.json
```

`keep-shapes` evita que las provincias pequeñas desaparezcan.
`precision=0.0001` redondea a unos 11 m, que sobra.

Para la línea de costa, en la misma sesión:

```
-dissolve
-o precision=0.0001 format=geojson costa.json
```

`-dissolve` funde las 16 provincias en una sola pieza: eso es la costa,
sin fronteras internas.

Si el resultado pasa de unos 250 KB, vuelve y baja a `-simplify 2%`. A
la escala en la que se mira este mapa no vas a notar la diferencia.

### Convertir

```bash
node scripts/convertir-geojson.mjs provincias.json --contorno costa.json
```

Antes de escribir nada, mira qué dice con `--revisar`. El script:

- detecta solo el campo del nombre, o se lo pasas con `--campo NAME_1`;
- traduce variantes (`Ciudad de la Habana` → `La Habana`) y lista las
  que no supo emparejar, para que las añadas a `ALIAS` dentro del script;
- acepta `MultiPolygon`, así que las provincias con cayos salen bien;
- ordena las provincias de oeste a este, como espera la app;
- avisa si el total de puntos es excesivo;
- imprime la extensión de los datos y los valores de `MAPA` que tocan;
- **no toca la clave `zonas`** y deja copia en `zonas.json.bak`.

**Ojo con los nombres.** Cada avistamiento guarda la provincia como
texto. Si cambias «Sancti Spíritus» por «Sancti Spiritus», los conteos
del mapa de avistamientos dejan de cuadrar. El script mantiene los 16
nombres que la app ya usa: no los toques.

### Ajustar el marco

Si el script dice que los datos se salen, edita `MAPA` en
`src/lib/geometria.js` con los valores que imprimió:

```js
export const MAPA = {
  lon0: -85.05, lon1: -74.05,
  lat0: 19.70,  lat1: 23.35,
  k: 100,
  cos: Math.cos((21.5 * Math.PI) / 180)
}
```

`k` es cuántas unidades de mapa mide un grado: déjalo en 100. `cos`
corrige el ancho para que la isla no salga estirada; si cambias mucho el
marco, pon la latitud media nueva.

### Cambiar el código que dibuja las provincias

Esto es obligatorio. Ahora las provincias son rectángulos recortados
contra la costa, porque no tenían forma. Con polígonos reales el código
se simplifica: desaparecen el recorte y el truco de `mitad`
(norte/sur) que usaba para las provincias que comparten longitud.

En **`src/components/MapaZonas.jsx`**, sustituye todo el bloque
`modo === 'provincias' ? PROVINCIAS.map(...)` por:

```jsx
PROVINCIAS.map(p => {
  const activa = provinciasElegidas.includes(p.nombre)
  return (
    <path
      key={p.nombre}
      d={p.poligonos.map(aRuta).join(' ')}
      fill={activa ? 'rgba(63,168,155,.42)' : 'transparent'}
      stroke="rgba(236,232,220,.13)"
      strokeWidth="1"
      onClick={() => alternarProvincia(p.nombre)}
      style={{ cursor: 'pointer' }}
    />
  )
})
```

Un solo `<path>` por provincia, con todos sus anillos concatenados: los
cayos entran gratis y se seleccionan con la provincia.

En **`src/components/MapaAvistamientos.jsx`**, el mismo cambio en el
bloque que sombrea según el conteo:

```jsx
PROVINCIAS.map(p => {
  const n = conteoPorProvincia[p.nombre] || 0
  if (n === 0) return null
  const alfa = 0.25 + 0.55 * (n / maximo)
  return (
    <path
      key={p.nombre}
      d={p.poligonos.map(aRuta).join(' ')}
      fill={`rgba(217,162,39,${alfa.toFixed(2)})`}
    />
  )
})
```

Después puedes borrar de los dos ficheros el `<clipPath>`, la constante
`LAT_DIV` y la lectura de `latitud_division`.

Con esto los límites pasan a ser reales y el mapa deja de ser un croquis.

---

## 2. Las zonas del catálogo

Aquí hay que ser claro: **las nueve zonas de `zonas.json` son polígonos
que inventé yo** para que el filtro tuviera con qué responder. Los
nombres son reales (Guanahacabibes, Sierra Maestra, Escambray), los
contornos no. Como vas a usar esto al lado de trabajo publicable, no
deberían quedarse ahí como están.

Tres salidas, y lo razonable es combinarlas.

### a) Bórralas y deja que crezcan del campo

La más honesta. Vacía la lista:

```json
"zonas": []
```

A partir de ahí, cada zona nace de un avistamiento tuyo: un disco de
500 m en tu GPS, que se amplía cuando anotas fuera de él. No hay ni un
dato inventado, y las zonas acaban siendo exactamente los sitios donde
has estado. Lo que pierdes es el filtro por zona hasta que tengas
avistamientos suficientes.

### b) Áreas protegidas, para las grandes

Para los macizos y ciénagas que usas como categorías amplias, los
límites de las áreas protegidas son defendibles y públicos. En
[protectedplanet.net](https://www.protectedplanet.net) busca Cuba y
descarga en GeoJSON: Guanahacabibes, Ciénaga de Zapata, Viñales,
Turquino, Alejandro de Humboldt. Simplifica en mapshaper igual que
antes y pega el resultado:

```json
{
  "id": "guanahacabibes",
  "nombre": "Parque Nacional Guanahacabibes",
  "provincias": ["Pinar del Río"],
  "poligono": [[-84.95,21.88], [-84.30,22.02], "…"],
  "fuente": "WDPA 2026, Parque Nacional Guanahacabibes"
}
```

Añade `fuente` siempre. Dentro de un año no vas a recordar de dónde
salió cada contorno, y es lo primero que necesitas si citas la app en
algo escrito.

### c) Distritos biogeográficos de la literatura

Si trabajas con una regionalización publicada para Cuba, úsala: el
nombre y la cita valen más que un contorno preciso. Puedes poner la zona
sin `poligono`, solo con `provincias`, y el filtro por toque funciona
igual. El filtro por trazo no la encontrará hasta que tenga geometría,
así que anótalo en `nota`.

### Las provincias de cada zona se pueden calcular

El campo `provincias` de cada zona está escrito a mano. Con provincias
reales ya no hace falta: se deduce de la geometría. En
`src/lib/zonas.js`, algo así:

```js
import { puntoDentro } from './geometria'
import catalogo from '../data/zonas.json'

/** Provincias que toca una zona, según dónde caen sus puntos. */
export function provinciasDeZona(zona) {
  const puntos = zona.discos?.length
    ? zona.discos.map(d => [d.lon, d.lat])
    : (zona.poligono ?? [])

  const tocadas = new Set()
  for (const p of catalogo.provincias) {
    for (const anillo of p.poligonos) {
      if (puntos.some(q => puntoDentro(q, anillo))) { tocadas.add(p.nombre); break }
    }
  }
  return [...tocadas]
}
```

Prueba los vértices, no el solape de polígonos: es mucho más barato y
para esto acierta. Una zona que cruza una provincia sin que ningún
vértice caiga dentro se escaparía, pero con discos de 500 m eso no pasa.

---

## 3. Textos y campos de las especies

`src/data/especies.json`. Las 207 entradas tienen taxonomía real
(familia, subfamilia, nombre) y el resto vacío. La ficha pone «Por
documentar» donde falta algo, así que puedes ir avanzando sin que se vea
roto.

```json
{
 "id": 131,
 "nombre": "Eumaeus atala",
 "autoria": "(Poey, 1832)",
 "nombres_alternos": ["Mariposa del cicas", "Atala"],
 "endemica": false,
 "tamano_mm": { "min": 38, "max": 46 },
 "colores": ["negro", "verde", "iridiscente", "rojo"],
 "descripcion": "…",
 "anverso": "…",
 "reverso": "…",
 "rasgos": "…",
 "ciclo": {
   "huevo": "…", "larva": "…", "pupa": "…",
   "hospederas": ["Zamia integrifolia"],
   "nota_hospederas": "…"
 },
 "distribucion": { "zonas": ["guanahacabibes"], "poligonos": [], "nota": "…" },
 "estado_datos": "parcial",
 "fuentes": ["Núñez Aguila, R. 2019. …"]
}
```

Campos que mueven la interfaz más de lo que parece:

| Campo | Efecto |
|---|---|
| `nombres_alternos` | entran en la búsqueda y salen bajo el nombre en la cuadrícula |
| `colores` | filtro de color; usa exactamente los valores de `meta.colores` |
| `tamano_mm` | de aquí sale la clase pequeña/mediana/grande |
| `tamano_clase` | fuerza la clase por encima de `tamano_mm` |
| `distribucion.zonas` | ids de `zonas.json`; pintan el mapa y alimentan el filtro |
| `endemica` | insignia roja |
| `estado_datos` | `pendiente` / `parcial` / `completo`, para saber por dónde vas |
| `fuentes` | no se muestra todavía, pero rellénalo desde el principio |

Dos avisos de formato. Los `colores` tienen que coincidir carácter a
carácter con `meta.colores` o el filtro no los encuentra; y los ids de
`distribucion.zonas` con los de `zonas.json`, o la zona sale como un id
crudo en la ficha.

### Por dónde empezar

No vayas por orden de id. Empieza por las que conoces de primera mano:
lo que has visto, lo que tienes montado, lo que estás escribiendo. Marca
esas como `completo` y filtra por `estado_datos` mientras pruebas, así
trabajas siempre contra fichas llenas.

---

## 4. Imágenes

Van en `public/img/`, con el nombre que ya trae el JSON:

```
public/img/laminas/131_eumaeus-atala.jpg       ejemplar vivo
public/img/montados/131_eumaeus-atala.jpg      ejemplar montado
public/img/ciclo/131_eumaeus-atala-larva.jpg
public/img/ciclo/131_eumaeus-atala-pupa.jpg
public/img/ciclo/131_eumaeus-atala-hospedera.jpg
```

El nombre sale de `id` + el nombre científico en minúsculas con guiones.
Míralo en el campo `imagenes` de cada especie: ahí está la ruta exacta
que la app va a buscar.

**Reduce antes de subir.** 1200 px de ancho y calidad 80 basta de sobra
para la pantalla del teléfono. Con 207 especies × 5 imágenes, la
diferencia entre fotos crudas y reducidas son cientos de megas frente a
unas decenas — y todo esto se descarga al teléfono para funcionar sin
conexión.

```bash
# con ImageMagick, sobre una carpeta entera
mogrify -resize 1200x1200\> -quality 80 *.jpg
```

Las fotos del huevo, la larva, la pupa y la planta hospedera también se
pueden añadir desde la app con la cámara, y esas ganan a la del
catálogo. Para esas cuatro no hace falta que toques `public/img/` si
prefieres ir consiguiéndolas en el campo.

---

## 5. Orden de trabajo

1. Provincias y contorno reales, con el script y los dos cambios de
   código. Media tarde, y a partir de ahí el mapa deja de ser un croquis.
2. Vaciar las nueve zonas inventadas. Un minuto, y quita el único dato
   falso que queda en el programa.
3. Reponer las zonas que necesites como categorías, con su `fuente`.
4. Rellenar las especies que conoces, con sus imágenes.
5. El resto, poco a poco, mientras las zonas de campo crecen solas.

Después del 1 y el 2, todo lo que el programa afirma es verificable. Eso
es lo que hace la diferencia entre una demostración y una herramienta que
puedes citar.
