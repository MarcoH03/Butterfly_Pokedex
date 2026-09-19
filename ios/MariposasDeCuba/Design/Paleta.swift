import SwiftUI
import UIKit

/// ══════════════════════════════════════════════════════════════
/// Mariposas de Cuba — sistema visual (versión nativa)
///
/// Los mismos valores que `src/index.css` en la versión web: los
/// colores del sistema de iOS, con el turquesa de Eumaeus atala como
/// acento — coincide casi con el `systemTeal` de Apple. Colores
/// dinámicos de verdad: `UIColor { traits in … }` cambia solo según
/// el modo claro/oscuro del teléfono, sin código adicional.
/// ══════════════════════════════════════════════════════════════

extension Color {
    /// Un color dinámico definido por su variante clara y oscura.
    static func dinamico(clara: UIColor, oscura: UIColor) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? oscura : clara
        })
    }

    init(hex: String, alpha: Double = 1) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s = s.replacingOccurrences(of: "#", with: "")
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        let r = Double((v >> 16) & 0xFF) / 255
        let g = Double((v >> 8) & 0xFF) / 255
        let b = Double(v & 0xFF) / 255
        self = Color(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}

enum Paleta {
    // MARK: - Fondos y superficies (systemBackground / secondarySystemBackground)
    static let sombra = Color.dinamico(clara: .white, oscura: .black)
    static let sombraAlt = Color.dinamico(
        clara: UIColor(red: 0.949, green: 0.949, blue: 0.969, alpha: 1),
        oscura: UIColor(red: 0.110, green: 0.110, blue: 0.118, alpha: 1)
    )
    static let linea = Color.dinamico(
        clara: UIColor(red: 0.235, green: 0.235, blue: 0.263, alpha: 0.29),
        oscura: UIColor(red: 0.329, green: 0.329, blue: 0.345, alpha: 0.65)
    )

    // MARK: - Texto (label / secondaryLabel / tertiaryLabel)
    static let papel = Color.dinamico(clara: .black, oscura: .white)
    static let papelMedio = Color.dinamico(
        clara: UIColor(red: 0.235, green: 0.235, blue: 0.263, alpha: 0.6),
        oscura: UIColor(red: 0.922, green: 0.922, blue: 0.961, alpha: 0.6)
    )
    static let papelTenue = Color.dinamico(
        clara: UIColor(red: 0.235, green: 0.235, blue: 0.263, alpha: 0.3),
        oscura: UIColor(red: 0.922, green: 0.922, blue: 0.961, alpha: 0.3)
    )

    // MARK: - Acentos (systemTeal / systemRed / systemYellow)
    static let atala = Color.dinamico(
        clara: UIColor(red: 0.180, green: 0.600, blue: 0.651, alpha: 1),
        oscura: UIColor(red: 0.251, green: 0.784, blue: 0.878, alpha: 1)
    )
    static let atalaHondo = Color.dinamico(
        clara: UIColor(red: 0.863, green: 0.941, blue: 0.949, alpha: 1),
        oscura: UIColor(red: 0.086, green: 0.235, blue: 0.251, alpha: 1)
    )
    static let grana = Color.dinamico(
        clara: UIColor(red: 1.0, green: 0.231, blue: 0.188, alpha: 1),
        oscura: UIColor(red: 1.0, green: 0.271, blue: 0.227, alpha: 1)
    )
    static let polen = Color.dinamico(
        clara: UIColor(red: 1.0, green: 0.800, blue: 0.0, alpha: 1),
        oscura: UIColor(red: 1.0, green: 0.839, blue: 0.039, alpha: 1)
    )

    /// Texto legible siempre sobre un relleno de acento saturado,
    /// sin importar el modo — igual que un botón "filled" de iOS.
    static let onAccento = Color.black.opacity(0.82)

    /// Segmento activo de un control segmentado personalizado.
    static let segmentoActivo = Color.dinamico(
        clara: .white,
        oscura: UIColor(red: 0.388, green: 0.388, blue: 0.400, alpha: 1)
    )

    /// La etiqueta de ejemplar es papel de verdad: no cambia con el modo.
    static let etiquetaFondo = Color(hex: "#ECE8DC")
    static let etiquetaTexto = Color(hex: "#1A1A16")
    static let etiquetaMeta = Color(hex: "#5C5C52")

    static func familia(_ nombre: String) -> Color {
        guard let hex = ColorFamilia.mapa[nombre] else { return atala }
        return Color(hex: hex)
    }
}

enum Forma {
    static let panel: CGFloat = 14
    static let hoja: CGFloat = 20
    static let control: CGFloat = 999
}

/// Nombres científicos en New York itálica — el mismo criterio que
/// `.binomio` en la web: siempre serif e itálica, nunca en negrita.
/// `design: .serif` es lo que hace que el sistema use New York en
/// vez de San Francisco — nada que empaquetar, ya vive en el iPhone.
extension Font {
    static func binomio(_ size: CGFloat) -> Font {
        .system(size: size, weight: .regular, design: .serif).italic()
    }
    static func serifTitulo(_ size: CGFloat, peso: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: peso, design: .serif)
    }
}
