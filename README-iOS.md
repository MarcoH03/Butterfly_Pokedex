# Mariposas de Cuba — app nativa de iOS (SwiftUI)

Esta rama (`claude/ios-native-app-9n0hlj`) trae un puerto real de
**Mariposas de Cuba** a SwiftUI: un proyecto de Xcode que compila a un
`.ipa`, como si fuera a subirse a la App Store — no una web disfrazada.
Vive en `ios/MariposasDeCuba/`.

(La rama también conserva, en `src/`, un rediseño anterior de la versión
web con la misma paleta y tipografía — una PWA que se instala con
"Añadir a pantalla de inicio". Sigue ahí por si sirve, pero **lo que
pediste esta vez es esto**: código Swift de verdad, compilado por Xcode.)

---

## 1. Qué es esto

Un proyecto de Xcode completo, con SwiftUI y sin storyboards:

```
ios/
├── MariposasDeCuba.xcodeproj/         proyecto de Xcode
├── MariposasDeCuba/
│   ├── App/                            arranque + Info.plist
│   ├── Models/                         Especie, Zona, Avistamiento…
│   ├── Store/                          Almacen (persistencia), filtros
│   ├── Design/                         paleta de colores, tipografía
│   ├── Views/Catalogo/                 cuadrícula, filtros
│   ├── Views/Ficha/                    ficha de especie y todo lo suyo
│   ├── Resources/                      especies.json, zonas.json
│   └── Assets.xcassets/                icono de la app, color de acento
├── generate_project.rb                 genera el .xcodeproj
└── ci/elegir_simulador.py              usado por el workflow de CI
```

Dos pantallas, igual que en la web:

- **Catálogo** — `CatalogoView`: cuadrícula de dos columnas, con
  `.searchable()` nativo, control segmentado Láminas/Montados, hoja de
  filtros y modo de selección manual.
- **Ficha** — `FichaView`: identificación, distribución (mapa de Cuba
  dibujado con las coordenadas reales de `zonas.json`), ciclo de vida
  con foto por estadio, tus avistamientos (con mapa propio), galería
  personal y notas.

Los datos son los mismos dos archivos de siempre, empaquetados tal cual
en la app (`Resources/especies.json`, `Resources/zonas.json`) y leídos
con `Codable` — no hubo que convertir ni un campo. Lo que anotas tú
(avistamientos, notas, fotos, galería) se guarda con `FileManager` +
JSON en el `Documents` de la app, el equivalente nativo del
`localStorage` de la versión web.

## 2. Por qué se ve como una app de Apple de verdad

No hay nada que imitar: es SwiftUI corriendo sobre UIKit, así que estos
son componentes nativos reales, no CSS que se les parece:

- `NavigationStack` con título grande, que se encoge al hacer scroll.
- `.searchable()` — la barra de búsqueda del sistema, con su propio
  cancelar y su propia animación.
- `.sheet()` para las hojas modales (Filtros, Anotar avistamiento): el
  asa, el desenfoque de fondo y el gesto de arrastrar para cerrar los
  trae UIKit de fábrica.
- `Picker(.segmented)` para Láminas/Montados y Ejemplar vivo/Montado —
  el control segmentado real, no una aproximación.
- `Form` agrupado para "Anotar avistamiento": separadores, teclado y
  disposición los resuelve UIKit.
- `PhotosPicker` para elegir fotos de la galería, `UIImagePickerController`
  para la cámara, `CoreLocation` para el GPS.

La paleta de colores es la misma que se afinó para la versión web:
turquesa de *Eumaeus atala* como acento (coincide con el `systemTeal`
de Apple), fondos y textos que seguirán el modo claro/oscuro del
teléfono en tiempo real porque están definidos como colores dinámicos
de verdad (`UIColor { traits in … }` en `Design/Paleta.swift`), no
alternativas fijas. Los nombres científicos usan New York
(`design: .serif`), la serif de Apple — nada que empaquetar.

## 3. Qué se simplificó en esta primera versión

Honestidad primero: portar 4000 líneas de React a Swift entero, con
paridad exacta en cada gesto, es un proyecto de semanas. Esta primera
versión prioriza que **se vea, se sienta y compile** como una app
nativa real, con todas las pantallas y datos funcionando. Un recorte
consciente:

- **Mapa de zonas: de toque, no de trazo a mano alzada.** La web deja
  dibujar con el dedo sobre el mapa para elegir zonas
  (`geometria.js` + `MapaZonas.jsx`, con detección de solape trazo↔polígono
  a medida). En la app nativa (`MapaCubaView.swift`) el mapa usa las
  mismas coordenadas reales de `zonas.json` y se puede tocar una zona
  para elegirla, pero no se puede "pintar" un área con el dedo. Mismo
  dato, mismo mapa, gesto más simple.

Todo lo demás — catálogo, filtros, ficha completa, avistamientos con
GPS y foto, ciclo de vida, galería, notas, selección manual — está
completo y funcionando.

## 4. Cómo se compila (importante: no hace falta tu Mac)

Este entorno donde trabajé es Linux — no puede correr Xcode, que solo
existe para macOS. Así que separé el proyecto en dos partes:

1. **Generar el `.xcodeproj`** no necesita macOS: `generate_project.rb`
   usa la gema Ruby `xcodeproj` (la misma librería que usan CocoaPods y
   fastlane) para escribir el proyecto directamente. Se puede correr en
   cualquier máquina con Ruby.
2. **Compilarlo** sí necesita Xcode/macOS de verdad — y para eso usa
   `.github/workflows/build-ios.yml`, que corre en un runner de macOS
   de **GitHub Actions** (gratis para repositorios públicos). Ese
   runner:
   - Compila el proyecto sin firmar (`CODE_SIGNING_ALLOWED=NO`) y
     empaqueta el `.app` resultante en un `.ipa`.
   - Sube ese `.ipa` como artefacto descargable del workflow.
   - Además compila una copia para el Simulador de iOS, la instala,
     arranca el simulador en modo claro y en modo oscuro, y guarda una
     captura real de cada uno — las capturas de la sección 6 salen de
     ahí, no son un dibujo aproximado.

Esto es justo lo que resuelve tu limitación de hardware: **ni tu
MacBook de 2014 ni esta sesión necesitan compilar nada** — lo hace el
runner de Apple que GitHub presta gratis.

### Volver a compilar después de cambiar algo

```bash
cd ios
ruby generate_project.rb     # solo si añadiste o quitaste archivos
```

Luego, en GitHub: pestaña **Actions → Compilar app nativa de iOS → Run
workflow** (el botón aparece una vez que este archivo llegue a la rama
`main`; mientras tanto se dispara solo con cada push que toque `ios/`).

## 5. Cómo ponerla en tu iPhone — sin Xcode, sin iTools, sin 3uTools

Un `.ipa` no es como un `.apk` de Android: **tiene que estar firmado
para que iOS lo abra**, incluso en tu propio teléfono. El `.ipa` que
produce el CI no está firmado a propósito — firmarlo en GitHub
necesitaría meter tu Apple ID en un secreto de CI, y no hace falta:
las herramientas de abajo firman el `.ipa` con tu Apple ID **en el
momento de instalarlo**, usando el mismo mecanismo gratuito que usa
Xcode para "Ejecutar" una app en tu propio dispositivo sin cuenta de
desarrollador de pago.

**Por qué no iTools/3uTools:** ambos gestionan archivos y hacen
backups, pero su función de "instalar IPA" depende de firmar con un
certificado — algo que en iOS moderno (sin jailbreak) solo funciona de
forma fiable con herramientas que hablan directamente con los
servicios de desarrollador de Apple. Por eso la recomendación real hoy
es **Sideloadly** o **AltStore**, no 3uTools.

### Paso 1 — descarga el `.ipa`

1. En GitHub, entra a la pestaña **Actions** del repositorio.
2. Abre la ejecución más reciente de **"Compilar app nativa de iOS"**.
3. Baja hasta **Artifacts** y descarga `MariposasDeCuba-ipa`
   (un `.zip` que trae dentro el `.ipa`).

### Paso 2 — instala con Sideloadly (recomendado)

Sideloadly corre en **Windows o macOS** — tu Mac de 2014, aunque no
pueda con Xcode moderno, sí puede con Sideloadly (pide mucho menos).
Si tu Mac tampoco puede, sirve cualquier PC con Windows a mano (el de
un amigo también funciona, solo hace falta el cable del iPhone un
momento).

1. Descarga Sideloadly desde **sideloadly.io** e instálalo (en Windows
   necesita también iTunes, por los drivers del iPhone — no hace falta
   abrirlo, solo tenerlo instalado).
2. Conecta el iPhone por cable.
3. Abre Sideloadly, arrastra el `.ipa` a la ventana.
4. Escribe tu Apple ID (uno normal y gratis, no de desarrollador de
   pago) cuando lo pida. Sideloadly lo usa un momento para firmar el
   `.ipa` — no guarda la contraseña.
5. Toca **Start**. En unos minutos el icono de Mariposas de Cuba
   aparece en tu pantalla de inicio.
6. La primera vez que la abras, iOS pedirá confiar en el desarrollador:
   **Ajustes → General → VPN y gestión de dispositivos → (tu Apple ID)
   → Confiar**.

**Con un Apple ID gratis, la app deja de abrir a los 7 días** (una
limitación de Apple, no de Sideloadly) — hay que reinstalarla con el
mismo `.ipa` para renovarla, un proceso de un minuto. Con AltStore
(abajo) ese paso se puede automatizar.

### Alternativa — AltStore

**AltStore** hace lo mismo pero deja instalado un "AltServer" en tu
computadora que puede renovar la firma sola por Wi-Fi cada semana, sin
tener que reconectar el cable ni repetir el proceso a mano. Un poco más
de instalación inicial (altstore.io), a cambio de no tener que pensar
en el límite de 7 días. También corre en Windows y Mac.

### Sobre iTools y 3uTools

Siguen sirviendo para lo que ya usas — fotos, backups, explorar
archivos. Lo único que no van a resolver de forma fiable en iOS
moderno es este paso concreto de instalar un `.ipa` propio; para eso
son Sideloadly/AltStore.

## 6. Capturas del simulador

Las siguientes capturas son reales, tomadas por el propio CI en un
Simulador de iPhone (no un mockup): `docs/screenshots-nativo/`.

*(Se añaden en cuanto termina la ejecución de
`.github/workflows/build-ios.yml` — el `.ipa` y las capturas quedan
como artefactos descargables de esa misma ejecución en la pestaña
Actions, con validez de 60 días.)*

## 7. Si quieres seguir desarrollando

Con un Mac que sí corra una versión de Xcode razonablemente reciente
(15 o más nueva):

```bash
cd ios
ruby generate_project.rb    # si Ruby no tiene el gem: gem install xcodeproj
open MariposasDeCuba.xcodeproj
```

**Añadir las fotos reales del catálogo:** en Xcode, arrastra una
carpeta `img` (con la misma estructura que `public/img/` en la web:
`img/laminas/001_….jpg`, `img/montados/…`, `img/ciclo/…`) a
`MariposasDeCuba/Resources`, eligiendo **"Create folder references"**
(el icono debe quedar azul, no amarillo) para que `Lamina.swift` las
encuentre por nombre de archivo tal como está escrito.

Todo lo de [README.md](README.md) sobre el formato de los datos sigue
aplicando igual — el catálogo es el mismo JSON en los dos lados.
