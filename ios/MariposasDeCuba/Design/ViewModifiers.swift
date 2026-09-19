import SwiftUI

/// Botón que se atenúa y encoge levemente al tocarlo, la
/// realimentación táctil estándar de iOS — sustituye el `:hover` de
/// la web por algo que de verdad responde al dedo.
struct EstiloTactil: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.55 : 1)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == EstiloTactil {
    static var tactil: EstiloTactil { EstiloTactil() }
}

/// Una píldora de filtro: fondo `sombraAlt` con borde fino cuando no
/// está activa, `atala` sólido con texto oscuro cuando sí.
struct EstiloPildora: ViewModifier {
    var activa: Bool
    func body(content: Content) -> some View {
        content
            .font(.system(size: 13))
            .padding(.horizontal, 14)
            .padding(.vertical, 7)
            .foregroundStyle(activa ? Paleta.onAccento : Paleta.papel)
            .background(activa ? Paleta.atala : Paleta.sombraAlt)
            .clipShape(Capsule())
            .overlay {
                if !activa {
                    Capsule().strokeBorder(Paleta.linea, lineWidth: 1)
                }
            }
    }
}

extension View {
    func pildora(activa: Bool) -> some View { modifier(EstiloPildora(activa: activa)) }
}

/// La tarjeta base de una sección: esquinas a escala iOS.
struct TarjetaFondo: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Paleta.sombraAlt)
            .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
    }
}

extension View {
    func tarjeta() -> some View { modifier(TarjetaFondo()) }
}
