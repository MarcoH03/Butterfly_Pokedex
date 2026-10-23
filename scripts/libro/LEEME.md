# Cómo salieron los datos del libro

Estos son los scripts que extrajeron el texto, las fotos y los mapas de
**Mariposas de Cuba: guía de campo** (Mancina, Núñez Águila y Neyra Raola,
eds., 2020) hacia `src/data/especies.json` y `public/img/`.

No son una herramienta pulida: son el rastro de cómo se hizo, para que
cualquiera pueda comprobarlo o repetirlo cuando aparezca una edición nueva.
**Las rutas están escritas a mano arriba de cada archivo** (apuntan al PDF y a
una carpeta de trabajo); hay que cambiarlas antes de ejecutar nada.

## El problema de origen

El PDF trae texto de verdad, pero las tipografías de titulares y etiquetas
vienen con la tabla de caracteres revuelta: `Des3(i:3i;-` es «Descripción» y
`6823` es «1823». En el texto corrido las ligaduras salen como dígitos (`4la`
= «fila»). Los párrafos están íntegros, así que se puede recuperar sin
adivinar:

- las etiquetas se reconocen por su **longitud** (11 caracteres = Descripción,
  12 = Distribución, 8 = Ecología, 9 = Sinónimos);
- las ligaduras se resuelven probando `fi`, `fl`, `ff`… contra el vocabulario
  del propio libro;
- los nombres científicos se emparejan con los que ya tenía la app
  permitiendo hasta un 30 % de caracteres distintos.

## Orden

| Paso | Script | Qué hace |
|---|---|---|
| 1 | `preparar.py` | limpia el texto, normaliza las etiquetas y lo parte por página |
| 2 | `extraer.py` | detecta encabezados, bloques de texto y leyendas |
| 3 | `agrupar.py` | arma cada ficha (Sinónimos → Descripción → Distribución → Ecología) |
| 4 | `ensamblar.py` | asigna cada ficha a su especie (epíteto + página + orden) |
| 5 | `parse2.py`, `comunes.py`, `comunes2.py` | índice (página y lámina) y nombres comunes |
| 6 | `construir.py` | escribe los campos de texto en `especies.json` |
| 7 | `extraer_pdf.py` | vuelca cada página a XML con posiciones + sus imágenes |
| 8 | `emparejar.py` | agrupa el texto en líneas y empareja nombres con ids |
| 9 | `laminas.py`, `fichas_img.py` | empareja cada foto y cada mapa con su especie |
| 10 | `mapas.py` | vectoriza las manchas naranjas y los puntos negros de los mapas |
| 11 | `aplicar_mapas.py` | escribe polígonos, localidades y zonas en `especies.json` |
| 12 | `construir_imgs.py` | escribe `public/img/laminas` y `public/img/montados` |
| — | `creditos.py` | saca los `©` rotados del borde de cada foto |

`correcciones.json` lleva las cuatro fichas que el emparejamiento automático
puso mal y que se arreglaron leyendo las páginas a mano.

## Los mapas

Cada ficha del libro trae un mapa de Cuba con los municipios donde la especie
está registrada en naranja y las localidades concretas como puntos negros.
`mapas.py` los separa por color, los vectoriza y los georreferencia con los
extremos reales del archipiélago (Cabo de San Antonio ↔ Punta de Maisí, cayos
de Hicacos ↔ Cabo Cruz).

Comprobación contra localidades conocidas: *Pseudochrysops bornoi yateritas*
(solo se conoce de Yateritas) cae a 10 km de Yateritas; *Holguinia holguin*,
a 5 km de Holguín. **La precisión es de unos 5–10 km**: sirve para ver y
filtrar, no para medir.

El contorno de la costa **no** se puede sacar de estos mapas: la capa base
dibuja los municipios con su extensión marina, así que el «litoral» que se ve
es más gordo que Cuba. Para la costa real sigue haciendo falta el GeoJSON de
gadm.org, como explica `GUIA-DATOS.md`.
