import SwiftUI

/// Mapa de Cuba a partir de las coordenadas reales de
/// `zonas.json` (contorno de la isla + Isla de la Juventud),
/// proyectadas de forma sencilla (longitud/latitud como x/y —
/// a esta escala, sin apreciarse la curvatura, es suficiente).
///
/// Nota de alcance: la versión web deja "trazar con el dedo" una
/// zona a mano alzada sobre el mapa (gesto + geometría a medida,
/// en `geometria.js`/`MapaZonas.jsx`). Aquí, en la primera versión
/// nativa, el mapa es de toque — tocas una zona para elegirla —
/// en vez de trazo libre. Mismo dato, mismo mapa real, interacción
/// más simple. Ver README-iOS.md.
struct MapaCubaShape: Shape {
    let puntos: [CGPoint]

    func path(in rect: CGRect) -> Path {
        guard !puntos.isEmpty else { return Path() }
        let lons = puntos.map(\.x), lats = puntos.map(\.y)
        let minLon = lons.min()!, maxLon = lons.max()!
        let minLat = lats.min()!, maxLat = lats.max()!

        func proyectar(_ p: CGPoint) -> CGPoint {
            let nx = (p.x - minLon) / max(maxLon - minLon, 0.0001)
            let ny = 1 - (p.y - minLat) / max(maxLat - minLat, 0.0001)
            return CGPoint(x: rect.minX + nx * rect.width, y: rect.minY + ny * rect.height)
        }

        var path = Path()
        path.move(to: proyectar(puntos[0]))
        for p in puntos.dropFirst() { path.addLine(to: proyectar(p)) }
        path.closeSubpath()
        return path
    }
}

struct MapaZonasView: View {
    var zonasElegidas: Set<String> = []
    var alTocarZona: ((String) -> Void)? = nil

    private var limites: (minLon: Double, maxLon: Double, minLat: Double, maxLat: Double) {
        let cuba = Catalogo.zonas.contorno.cuba
        let lons = cuba.map { $0[0] }, lats = cuba.map { $0[1] }
        return (lons.min()!, lons.max()!, lats.min()!, lats.max()!)
    }

    var body: some View {
        GeometryReader { geo in
            let l = limites
            ZStack {
                Rectangle().fill(Color(hex: "#0E1513"))

                contorno(Catalogo.zonas.contorno.puntosCuba, en: geo.size, limites: l)
                    .fill(Color(hex: "#243430"))
                contorno(Catalogo.zonas.contorno.puntosCuba, en: geo.size, limites: l)
                    .stroke(Color(hex: "#3A4C47"), lineWidth: 1.2)

                contorno(Catalogo.zonas.contorno.puntosIslaJuventud, en: geo.size, limites: l)
                    .fill(Color(hex: "#243430"))
                contorno(Catalogo.zonas.contorno.puntosIslaJuventud, en: geo.size, limites: l)
                    .stroke(Color(hex: "#3A4C47"), lineWidth: 1.2)

                ForEach(Catalogo.zonas.zonas) { zona in
                    let elegida = zonasElegidas.contains(zona.id)
                    contorno(zona.puntos, en: geo.size, limites: l)
                        .fill(elegida ? Paleta.atala.opacity(0.55) : Color(hex: "#D9A227").opacity(0.16))
                        .overlay(
                            contorno(zona.puntos, en: geo.size, limites: l)
                                .stroke(elegida ? Paleta.atala : Color(hex: "#D9A227").opacity(0.5), lineWidth: 1.2)
                        )
                        .onTapGesture { alTocarZona?(zona.id) }
                }
            }
        }
        .aspectRatio(1.9, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
    }

    private func contorno(_ puntos: [CGPoint], en tamano: CGSize, limites l: (minLon: Double, maxLon: Double, minLat: Double, maxLat: Double)) -> Path {
        var path = Path()
        guard !puntos.isEmpty else { return path }
        func proyectar(_ p: CGPoint) -> CGPoint {
            let nx = (p.x - l.minLon) / max(l.maxLon - l.minLon, 0.0001)
            let ny = 1 - (p.y - l.minLat) / max(l.maxLat - l.minLat, 0.0001)
            return CGPoint(x: nx * tamano.width, y: ny * tamano.height)
        }
        path.move(to: proyectar(puntos[0]))
        for p in puntos.dropFirst() { path.addLine(to: proyectar(p)) }
        path.closeSubpath()
        return path
    }
}

struct MapaAvistamientosView: View {
    let avistamientos: [Avistamiento]

    private var limites: (minLon: Double, maxLon: Double, minLat: Double, maxLat: Double) {
        let cuba = Catalogo.zonas.contorno.cuba
        let lons = cuba.map { $0[0] }, lats = cuba.map { $0[1] }
        return (lons.min()!, lons.max()!, lats.min()!, lats.max()!)
    }

    var body: some View {
        GeometryReader { geo in
            let l = limites
            ZStack {
                Rectangle().fill(Color(hex: "#0E1513"))

                MapaCubaShape(puntos: Catalogo.zonas.contorno.puntosCuba)
                    .fill(Color(hex: "#1E2C29"))
                MapaCubaShape(puntos: Catalogo.zonas.contorno.puntosCuba)
                    .stroke(Color(hex: "#384944"), lineWidth: 1.2)

                ForEach(Array(avistamientos.enumerated()), id: \.offset) { _, a in
                    if let lat = a.lat, let lon = a.lon {
                        let nx = (lon - l.minLon) / max(l.maxLon - l.minLon, 0.0001)
                        let ny = 1 - (lat - l.minLat) / max(l.maxLat - l.minLat, 0.0001)
                        Circle()
                            .fill(Paleta.polen)
                            .frame(width: 6, height: 6)
                            .position(x: nx * geo.size.width, y: ny * geo.size.height)
                    }
                }
            }
        }
        .aspectRatio(1.9, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
    }
}
