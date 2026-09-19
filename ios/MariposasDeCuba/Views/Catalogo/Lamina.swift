import SwiftUI

/// Una imagen que sabe fallar con dignidad: si la foto no está
/// empaquetada todavía, en vez de un hueco en blanco aparece una
/// silueta de alas — se ve intencional, no averiada. Igual que
/// `Lamina.jsx` en la versión web.
///
/// Las fotos del catálogo no van en Assets.xcassets (207 especies ×
/// 5 imágenes son demasiado para el catálogo de assets de Xcode):
/// se buscan por nombre de archivo dentro de una carpeta `img` que
/// se añade como carpeta azul ("folder reference") al proyecto,
/// exactamente con la misma estructura que `public/img/` en la web.
/// Ver README-iOS.md, sección "Añadir las fotos reales".
struct Lamina: View {
    let ruta: String?
    var relacion: CGFloat = 1

    var body: some View {
        ZStack {
            Paleta.sombraAlt
            if let imagen = imagenCargada {
                imagen
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                Silueta()
                    .stroke(Paleta.papel, lineWidth: 1.4)
                    .aspectRatio(1, contentMode: .fit)
                    .padding(36)
                    .opacity(0.16)
            }
        }
        .aspectRatio(relacion, contentMode: .fit)
        .clipped()
    }

    private var imagenCargada: Image? {
        guard let ruta, !ruta.isEmpty else { return nil }
        let nombreArchivo = (ruta as NSString).lastPathComponent
        let base = (nombreArchivo as NSString).deletingPathExtension
        let ext = (nombreArchivo as NSString).pathExtension

        if let url = Bundle.main.url(forResource: base, withExtension: ext, subdirectory: "img"),
           let ui = UIImage(contentsOfFile: url.path) {
            return Image(uiImage: ui)
        }
        if let url = Bundle.main.url(forResource: base, withExtension: ext),
           let ui = UIImage(contentsOfFile: url.path) {
            return Image(uiImage: ui)
        }
        return nil
    }
}

/// Silueta de mariposa en reposo — el mismo trazo que en la versión
/// web, como `Shape` para poder centrarla y escalarla con el sistema
/// de layout normal (sin GeometryReader, que dentro de una
/// LazyVGrid da tamaños ambiguos).
struct Silueta: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
            CGPoint(x: x / 48 * rect.width + rect.minX, y: y / 48 * rect.height + rect.minY)
        }
        p.move(to: pt(23, 22))
        p.addCurve(to: pt(23, 24), control1: pt(15, 8), control2: pt(5, 9))
        p.addCurve(to: pt(23, 22), control1: pt(5, 24), control2: pt(14, 25))

        p.move(to: pt(23, 25))
        p.addCurve(to: pt(23, 29), control1: pt(16, 27), control2: pt(8, 30))
        p.addCurve(to: pt(23, 25), control1: pt(12, 41), control2: pt(20, 34))

        p.move(to: pt(25, 22))
        p.addCurve(to: pt(25, 24), control1: pt(33, 8), control2: pt(43, 9))
        p.addCurve(to: pt(25, 22), control1: pt(43, 24), control2: pt(34, 25))

        p.move(to: pt(25, 25))
        p.addCurve(to: pt(25, 29), control1: pt(32, 27), control2: pt(40, 30))
        p.addCurve(to: pt(25, 25), control1: pt(36, 41), control2: pt(28, 34))

        p.move(to: pt(24, 18)); p.addLine(to: pt(24, 34))

        p.move(to: pt(24, 18)); p.addCurve(to: pt(18, 11), control1: pt(22, 14), control2: pt(20, 12))
        p.move(to: pt(24, 18)); p.addCurve(to: pt(30, 11), control1: pt(26, 14), control2: pt(28, 12))
        return p
    }
}
