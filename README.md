# Mariposas de Cuba

Guía y libreta de campo de las mariposas de Cuba. PWA: se instala en el
iPhone y funciona sin conexión.

**Para sustituir datos inventados por reales (mapa, provincias, zonas,
especies, imágenes): ver [GUIA-DATOS.md](GUIA-DATOS.md).**

Dos capas de datos:

- **Catálogo** — las 207 especies, en `src/data/especies.json`. Igual siempre.
- **Lo tuyo** — avistamientos, notas y fotos. Vive en el teléfono
  (`localStorage`), no sale del dispositivo.

---

## Poner en marcha

```bash
npm install
npm run dev          # solo en la computadora
npm run dev:host     # accesible desde el iPhone en la red local (HTTPS)
```

`dev:host` imprime dos direcciones. Abre la de **Network** en Safari del
iPhone. Aparecerá un aviso de certificado: **Avanzado → Visitar el sitio**.
Después, **Compartir → Añadir a pantalla de inicio**.

## Publicar en GitHub Pages

1. En `vite.config.js`, la constante `REPO` debe coincidir con el nombre
   exacto del repositorio.
2. `npm run deploy`
3. En GitHub: *Settings → Pages → Source* → rama **`gh-pages`**.

Si la página sale en blanco, casi siempre es que `REPO` no coincide.

---

## Estructura

```
src/
├── App.jsx                 rutas
├── main.jsx                arranque
├── index.css               paleta, tipografía, armazón
├── data/especies.json      catálogo (207 especies)
├── data/zonas.json         semilla de zonas, contorno y provincias
├── lib/
│   ├── buscar.js           búsqueda con orden por relevancia
│   ├── geometria.js        polígonos, discos, trazo del dedo, proyección
│   ├── zonas.js            catálogo de zonas vivo: crece con el campo
│   └── almacen.js          avistamientos, notas, galería, estadios, respaldo
├── hooks/useEspecies.js    filtros, vista, selección manual
├── components/
│   ├── Lamina.jsx          imagen con silueta de reserva
│   ├── TarjetaEspecie.jsx  celda de la cuadrícula
│   ├── PanelFiltros.jsx    hoja de filtros
│   ├── MapaZonas.jsx       mapa: trazo a mano alzada y toque por provincia
│   ├── MapaAvistamientos.jsx  provincias sombreadas y puntos GPS
│   ├── Visor.jsx           imagen a pantalla completa con zoom
│   ├── RanuraFoto.jsx      hueco de foto: cámara o galería
│   └── HojaAvistamiento.jsx  anotar en el campo (GPS)
└── pages/
    ├── Laminas.jsx         catálogo
    └── Ficha.jsx           ficha de especie
```

---

## Imágenes

Van en `public/img/`, con el nombre que ya trae el JSON:

```
public/img/laminas/001_battus-polydamas-cubensis.jpg    ejemplar vivo
public/img/montados/001_battus-polydamas-cubensis.jpg   ejemplar montado
public/img/ciclo/001_battus-polydamas-cubensis-larva.jpg
public/img/ciclo/001_battus-polydamas-cubensis-pupa.jpg
public/img/ciclo/001_battus-polydamas-cubensis-hospedera.jpg
```

Mientras un archivo no exista, la app dibuja una silueta en su lugar.

Antes de subirlas, redúcelas a unos 1200 px de ancho y calidad ~80. Con
207 especies, la diferencia entre fotos crudas del iPhone y fotos
reducidas es de cientos de megas frente a unas decenas — y todo esto se
descarga al teléfono para el uso sin conexión.

---

## Rellenar el catálogo

Cada especie empieza con `"estado_datos": "pendiente"` y los campos de
texto vacíos. La ficha muestra «Por documentar» donde falta algo, así que
puedes ir avanzando sin que nada se vea roto.

Campos que mueven la interfaz:

| Campo | Efecto |
|---|---|
| `nombres_alternos` | la búsqueda los encuentra y aparecen bajo el nombre en la cuadrícula |
| `colores` | filtro de color (usa los valores de `meta.colores`) |
| `tamano_mm` | de aquí sale la clase pequeña/mediana/grande si no la escribes a mano |
| `tamano_clase` | fuerza la clase, por encima de `tamano_mm` |
| `distribucion.zonas` | ids del catálogo `zonas.json`; pintan el mapa de la ficha y alimentan el filtro geográfico |
| `distribucion.poligonos` | zonas propias de esa especie, si ninguna del catálogo le sirve |
| `endemica` | insignia roja |

---

## Respaldo de tus datos

Tus avistamientos, notas y fotos están solo en Safari. Si borras los
datos del navegador, se pierden. `src/lib/almacen.js` trae `exportar()` e
`importar()` para bajar y restaurar un JSON con todo; conviene añadir un
botón de ajustes que las llame.

---

## Distribución: zonas, no provincias

La distribución de una especie son **polígonos**, no una lista de
provincias. Una zona puede cruzar límites provinciales (la Sierra Maestra
está en Granma y Santiago) o cubrir solo un pedazo de una (Guanahacabibes
dentro de Pinar del Río). Las provincias se **derivan** de las zonas,
nunca al contrario: `provinciasDe(especie)` en `useEspecies.js`.

`src/data/zonas.json` es el catálogo compartido: nueve zonas con nombre e
id. Una especie las referencia por id, así no hay que redibujar la misma
sierra en cada ficha. Si una especie ocupa algo que no está en el
catálogo, va en su propio `distribucion.poligonos`.

El filtro tiene dos vías, las dos en `MapaZonas.jsx`:

- **Trazo** — pasas el dedo como un plumón. `trazoAlcanzaZona()` en
  `geometria.js` da positivo si el trazo entra en la zona, si la zona
  queda bajo el grosor del trazo, o si el trazo la rodea. Es generoso a
  propósito: basta el solape parcial.
- **Provincias** — un toque por provincia. Entra la especie con alguna
  zona en ella.

## Siguiente

- [ ] Contornos reales: el de `zonas.json` es aproximado. Con el GeoJSON
      de gadm.org quedan las formas exactas de isla y provincias. En SVG
      y no con Leaflet, porque Leaflet descarga teselas y esta app tiene
      que funcionar sin conexión.
- [ ] Editor de zonas: dibujar un polígono con el dedo y guardarlo en
      `distribucion.poligonos` de una especie. Es el mismo código de
      trazo, cambiando el destino.
- [ ] Pantalla de ajustes con exportar/importar y espacio usado.
- [ ] Iconos `icon-192.png` y `icon-512.png` en `public/`.
- [ ] Mapa de tus propios avistamientos con los puntos GPS.


---

## Zonas: cómo se añaden

Hay dos vías, y conviven.

**1. Semilla del catálogo.** `src/data/zonas.json` trae nueve zonas con
nombre, id y polígono: macizos, ciénagas, llanuras. No se borran. Sus
contornos son aproximados; los exactos salen del GeoJSON de gadm.org.

**2. Desde el campo, sola.** Al anotar un avistamiento escribes la zona y
el autocompletado busca en el catálogo. Al guardar, `registrarUbicacion()`
en `src/lib/zonas.js` decide:

| Situación | Qué pasa |
|---|---|
| Nombre que no existe | nace la zona con un disco de 500 m en tu GPS |
| Zona conocida, GPS dentro | nada |
| Zona conocida, GPS fuera | se le añade otro disco de 500 m |

Así una zona es la **unión de los sitios donde realmente has estado**, no
un contorno inventado. Después de una temporada en Guanahacabibes, la zona
«Guanahacabibes» son tus puntos, con su forma real.

Las zonas de semilla que empiezas a ampliar se copian al almacén del
teléfono y desde ahí crecen; la semilla original no se toca.

El filtro por trazo prueba las dos formas: `trazoAlcanzaZona()` para los
polígonos y `trazoAlcanzaDiscos()` para los discos.

## Escala del mapa

Los mapas muestran toda Cuba de una vez, sin zoom. Un disco de 500 m a
esa escala mide menos de un píxel, así que `MapaZonas` y
`MapaAvistamientos` lo pintan con un radio mínimo de 3,5 unidades para
que se vea: **las marcas son posiciones, no extensiones reales**. Dos
puntos a menos de 2 km se pisan en el mapa; la lista por zona de abajo
es la que da el detalle.

El zoom estuvo hecho y se quitó a propósito: complicaba la interacción
(un dedo dibuja, dos dedos amplían) sin resolver nada que la lista no
resolviera ya. Si algún día hacen falta, las piezas eran un hook con el
`viewBox` del SVG y un componente de botones más barra de escala.

---

## Fotos: tres orígenes

1. **Catálogo** — archivos en `public/img/`, los mismos para siempre.
2. **Estadios** — huevo, larva, pupa y planta hospedera. El catálogo trae
   la ruta, pero si no existe el archivo puedes añadir la foto desde la app
   (cámara o galería) cuando la consigas en el campo. Se guarda en el
   teléfono y **tiene prioridad** sobre la del catálogo. Lleva un punto
   amarillo para distinguirla.
3. **Tuyas** — galería por especie y foto por avistamiento.

Todas se abren a pantalla completa con `Visor.jsx`: pellizcar para acercar
hasta 6×, doble toque para 2,5×, arrastrar para mover, arrastrar hacia
abajo para cerrar. Desde una imagen se puede pasar a las demás de la misma
especie sin salir.
