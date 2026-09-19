# Mariposas de Cuba — versión nativa para iOS

Esta rama (`claude/ios-native-app-9n0hlj`) convierte **Mariposas de Cuba** en
una app que se ve, se siente y se instala como una app nativa de iOS,
siguiendo la filosofía de diseño de Apple (Human Interface Guidelines):
tipografía del sistema, colores dinámicos de claro/oscuro, barras
translúcidas con desenfoque, hojas modales con asa, controles segmentados
y realimentación táctil al estilo iOS.

No toca la lógica de la app — el catálogo, los filtros, el mapa, la
cámara, las notas — solo su piel. Todo lo que hacía la app antes lo sigue
haciendo igual.

---

## 1. Qué es esta app

Mariposas de Cuba es una guía y libreta de campo de las 207 especies de
mariposas descritas en Cuba. Es una **PWA** (Progressive Web App): un sitio
web que se instala en el iPhone desde Safari y, una vez instalado, se
comporta como una app nativa — icono propio, pantalla completa sin barra
de Safari, funciona sin conexión.

Dos capas de datos:

- **Catálogo** — las 207 especies, fijo, vive en el código
  (`src/data/especies.json`).
- **Lo tuyo** — tus avistamientos, fotos y notas de campo. Vive solo en el
  teléfono (`localStorage` de Safari), nunca sale del dispositivo.

Dos pantallas:

- **Catálogo** (`/`) — cuadrícula de dos columnas con las especies, buscador,
  filtros (familia, subfamilia, zona, color, tamaño) y una vista alterna de
  ejemplares montados.
- **Ficha** (`/especie/:id`) — todo sobre una especie: identificación,
  distribución (mapa de Cuba), ciclo de vida con foto por estadio, tus
  avistamientos con mapa propio, tu galería de fotos y tus notas.

Puedes anotar un avistamiento (con GPS, foto y si fue capturada u
observada), fotografiar los estadios del ciclo de vida que te falten, y
llevar una libreta de notas por especie — todo se guarda en el teléfono.

Documentación más detallada del funcionamiento interno: [README.md](README.md)
(estructura de carpetas, formato de los datos, cómo rellenar el catálogo).
La [GUIA-DATOS.md](GUIA-DATOS.md) explica cómo sustituir los datos de
ejemplo por los reales.

---

## 2. Qué cambió en esta rama

### 2.1. Paleta: colores dinámicos de verdad

Antes la app tenía una única paleta oscura fija. Ahora usa los **colores
del sistema de iOS**, que cambian solos según el ajuste de Pantalla y
brillo del teléfono — exactamente como Ajustes, Mensajes o Notas:

| Variable      | Uso                          | Claro                    | Oscuro                    |
|---------------|-------------------------------|---------------------------|----------------------------|
| `--sombra`     | fondo de pantalla (`systemBackground`) | `#FFFFFF` | `#000000` |
| `--sombra-alt` | superficies (`secondarySystemBackground`) | `#F2F2F7` | `#1C1C1E` |
| `--linea`      | separadores (`separator`) | `rgba(60,60,67,.29)` | `rgba(84,84,88,.65)` |
| `--papel`      | texto principal (`label`) | `#000000` | `#FFFFFF` |
| `--papel-medio`| texto secundario (`secondaryLabel`) | 60 % negro | 60 % blanco |
| `--atala`      | acento (`systemTeal`) | `#2E99A6` | `#40C8E0` |
| `--grana`      | alertas (`systemRed`) | `#FF3B30` | `#FF453A` |
| `--polen`      | conteos (`systemYellow`) | `#FFCC00` | `#FFD60A` |

El turquesa de **Eumaeus atala** — la mariposa que le da nombre a la
paleta original — resulta que coincide casi exactamente con el
`systemTeal` de Apple, así que la identidad visual de la app y el sistema
de color de iOS conviven sin fricción; no hubo que inventar un acento
nuevo, solo afinar el que ya existía para que funcionara en ambos modos.

Se cambiaron los **valores** de las variables, no sus **nombres**, así que
ningún componente tuvo que reescribirse para adoptar la paleta nueva.

**Excepciones deliberadas** (no cambian con el modo, a propósito, igual
que Fotos o Mapas de Apple): la etiqueta de ejemplar (papel color crema,
como una etiqueta real de caja entomológica), el visor de fotos a
pantalla completa, y el mapa de Cuba — los tres se quedan oscuros siempre,
porque son visores de imagen/mapa, no texto de interfaz.

### 2.2. Tipografía del sistema, sin descargas

Antes la app cargaba dos tipos de Google Fonts (Spectral e IBM Plex Sans).
Ahora usa **San Francisco** (`-apple-system`) para la interfaz y **New
York** (`ui-serif`) para los nombres científicos — los dos tipos nativos
de Apple, que ya viven en el iPhone. Resultado: la app tipográficamente es
indistinguible de una app nativa, pesa menos, y funciona sin red desde el
primer instante (antes, sin conexión, los tipos ya descargados se veían
bien, pero la primera carga dependía de Google Fonts).

### 2.3. Formas: el lenguaje visual de iOS

- Las tarjetas y paneles pasan de un radio de 4 px a **14 px**, la escala
  de esquina que usa iOS en tarjetas y hojas.
- Las hojas modales (Filtros, Anotar avistamiento) suben con **esquinas de
  20 px** y un **asa** (`—`) centrada arriba, el gesto visual de "esto se
  puede arrastrar" que usan las hojas de iOS (Compartir, Formularios).
- Los controles segmentados (Láminas/Montados, Ejemplar vivo/Montado,
  Trazo/Provincias) ahora tienen un segmento activo **elevado** con sombra
  sutil, como `UISegmentedControl`, en vez de un simple cambio de color.

### 2.4. Barras translúcidas con desenfoque

La barra superior del catálogo y de la ficha, y la barra inferior de
acciones, ahora usan `backdrop-filter: blur()` con saturación — el
"Material" de iOS — en vez de un fondo opaco. Al hacer scroll, el
contenido se ve pasar difuminado detrás de la barra, igual que en
Ajustes o Mail.

### 2.5. Realimentación táctil

Los botones ya no cambian de color al tocarlos: se **atenúan** (opacidad
~55 %) y se encogen levemente, la respuesta táctil estándar de iOS/UIKit,
en vez del `:hover` propio de la web de escritorio.

### 2.6. Icono de la app

La app no tenía icono (`public/img/*/LEEME.txt` eran marcadores de
posición y no existía ningún `icon-*.png`). Se diseñó uno nuevo: una
mariposa estilizada en el turquesa de la app sobre un degradado oscuro
bosque→negro, en `apple-touch-icon.png` (180×180), `icon-192.png`,
`icon-512.png` y una variante `icon-512-maskable.png` con margen de
seguridad para los sistemas que recortan el icono en círculo.

### 2.7. Metadatos de PWA para iOS

- `theme-color` ahora tiene una variante para claro y otra para oscuro.
- Se añadió `apple-touch-icon` y `icon` reales (antes apuntaban a un
  archivo que no existía).
- El manifiesto (`vite.config.js`) usa los mismos tonos que la paleta
  nueva y declara los tres iconos.

### 2.8. Un error de datos corregido de paso

Al probar la hoja de Filtros para las capturas de pantalla, el grupo
«Zona geográfica» hacía fallar toda la app: el hook `useEspecies` nunca
rellenaba `opciones.zonas`, así que el componente intentaba recorrer
`undefined`. Se conectó ese grupo al catálogo real de zonas
(`src/lib/zonas.js`), filtrando por nombre igual que familia o color. No
es parte del encargo de diseño, pero sin este arreglo la hoja de filtros
no se podía ni abrir.

### Archivos tocados

```
src/index.css                      paleta, tipografía, formas — el grueso del cambio
src/hooks/useEspecies.js           arreglo del filtro de zona
src/pages/Laminas.jsx              barra superior con desenfoque, texto sobre acento
src/pages/Ficha.jsx                barra superior e inferior con desenfoque
src/components/PanelFiltros.jsx    asa, esquinas de hoja, velo adaptable
src/components/HojaAvistamiento.jsx  asa, esquinas de hoja, velo adaptable
src/components/TarjetaEspecie.jsx  texto sobre acento
src/components/MapaZonas.jsx       segmento activo elevado
src/components/RanuraFoto.jsx      texto sobre acento
index.html                         theme-color claro/oscuro, iconos, sin Google Fonts
vite.config.js                     manifiesto: colores e iconos
public/apple-touch-icon.png        icono nuevo
public/icon-192.png                icono nuevo
public/icon-512.png                icono nuevo
public/icon-512-maskable.png       icono nuevo
```

### Una limitación conocida (no de esta app — de iOS)

La barra de estado del iPhone (la hora, la batería) usa iconos claros
fijos en modo standalone (`apple-mobile-web-app-status-bar-style:
black-translucent`), porque **iOS no tiene ningún meta-tag que adapte la
barra de estado al modo claro/oscuro de una PWA** — es una limitación de
la plataforma, no de esta app. En modo oscuro se ve perfecta; en modo
claro, los iconos de la barra de estado son un poco tenues sobre el fondo
claro de la cabecera. Una app nativa de verdad (UIKit/SwiftUI) no tiene
este problema porque controla la barra de estado directamente — es
exactamente el tipo de matiz que solo se resuelve compilando la app,
sección siguiente.

---

## 3. Cómo probarla en tu iPhone (sin Xcode)

Tu MacBook Pro de 2014 no puede instalar la versión de Xcode que exige
compilar y firmar una app nativa de iOS, y **iTools/3uTools sirven para
instalar archivos `.ipa`** (apps ya compiladas y firmadas) — algo que este
proyecto, tal como está, no genera ni necesita.

La buena noticia: **no hace falta nada de eso**. Esta app es una PWA, y el
mecanismo de instalación de una PWA en iOS es Safari mismo — no Xcode, no
un `.ipa`, no una tienda de apps. Safari es, para este propósito, la única
herramienta de instalación que existe en iOS, y ya la tienes.

### Opción A — publicarla en internet (recomendada, la más sencilla en tu iPhone)

Este paso se hace **una vez**, desde cualquier computadora con Node.js
instalado — no hace falta Xcode ni una versión de macOS nueva, porque
`npm run deploy` no compila nada nativo, solo empaqueta HTML/CSS/JS y lo
sube a una rama de GitHub. Tu MacBook de 2014 puede hacerlo tal cual está.

```bash
npm install
npm run deploy
```

Esto construye la app y la sube a la rama `gh-pages`. Luego, en GitHub:
**Settings → Pages → Source → rama `gh-pages`**. GitHub te da una URL
pública, algo como:

```
https://marcoh03.github.io/Butterfly_Pokedex/
```

**En el iPhone:**

1. Abre esa URL en **Safari** (tiene que ser Safari: "Añadir a pantalla de
   inicio" para webs no existe en Chrome ni Firefox para iOS, aunque los
   instales — todos usan el motor de Safari pero no exponen esa opción).
2. Toca el icono de **Compartir** (el cuadrado con la flecha hacia
   arriba), en la barra inferior.
3. Baja hasta **«Añadir a pantalla de inicio»** → **Añadir**.
4. Ya tienes un icono nuevo en tu pantalla de inicio — el que se ve en
   las capturas más abajo. Ábrelo: no hay barra de Safari, arranca en
   pantalla completa, y a partir de la segunda vez que la abras funciona
   **sin conexión** (el *service worker* ya configurado con
   `vite-plugin-pwa` descarga y guarda todo lo que hace falta la primera
   vez que la visitas).

Después de instalarla así, para actualizarla basta con volver a hacer
`npm run deploy` cuando cambies algo: la próxima vez que abras la app en
el iPhone (con datos) se actualiza sola en segundo plano.

### Opción B — probarla en tu misma red, sin publicarla (para mientras la retocas)

Útil si estás cambiando cosas y quieres ver el resultado en el teléfono
al momento, sin publicar cada prueba.

```bash
npm install
npm run dev:host
```

Esto imprime dos direcciones. En el iPhone (conectado al **mismo Wi-Fi**
que la computadora), abre en Safari la que dice **Network** — algo como
`https://192.168.1.23:5173/Butterfly_Pokedex/`. Como es un certificado
autofirmado (así puede haber HTTPS en la red local, necesario para que
la PWA funcione), Safari mostrará un aviso: toca **Avanzado → Visitar
este sitio web**. Desde ahí, mismo paso 2-4 de arriba (Compartir → Añadir
a pantalla de inicio).

Esta versión no funciona fuera de esa red ni sin conexión — para eso está
la Opción A.

### Sobre iTools y 3uTools

Puedes seguir usándolos para lo que ya usas — gestionar fotos, backups,
archivos — no hacen falta ni estorban para nada de lo anterior. Lo único
que no van a poder hacer con este proyecto es "instalar la app" como si
fuera un `.ipa`, porque no se genera ningún `.ipa`: no hay nada que
sideloadear. Si en algún momento quisieras la versión realmente
compilada (un binario firmado, distribuible por TestFlight o cable), eso
sí exige Xcode y, con él, una versión de macOS que tu Mac de 2014
probablemente ya no pueda correr — la ruta PWA existe, entre otras
razones, precisamente para no depender de eso.

---

## 4. Capturas de la nueva interfaz

Todas tomadas a tamaño de iPhone 15 (393×852 pt, @3x), en ambos modos.
Los datos de ejemplo no traen fotos todavía (ver
[GUIA-DATOS.md](GUIA-DATOS.md)) — por eso se ve la silueta de reserva en
vez de una mariposa real; es el comportamiento normal de la app cuando
falta una imagen, no un error.

| | Claro | Oscuro |
|---|---|---|
| **Catálogo** | `docs/screenshots/catalogo-light.png` | `docs/screenshots/catalogo-dark.png` |
| **Ficha de especie** | `docs/screenshots/ficha-light.png` | `docs/screenshots/ficha-dark.png` |
| **Filtros** | `docs/screenshots/filtros-light.png` | `docs/screenshots/filtros-dark.png` |

---

## 5. Si quieres retomar el desarrollo

Todo lo de [README.md](README.md) sigue aplicando igual: estructura de
carpetas, formato de `especies.json`, cómo funcionan las zonas, el
respaldo de datos. Esta rama no cambió ni un campo de datos ni una regla
de negocio — solo el sistema visual.
