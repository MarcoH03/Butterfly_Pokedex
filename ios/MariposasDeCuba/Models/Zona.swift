import Foundation
import CoreGraphics

/// Una zona del catálogo geográfico (macizos, ciénagas, llanuras…).
/// El polígono es una lista de puntos [lon, lat], igual que en
/// zonas.json, para poder dibujar el contorno con CGPoint directo.
struct Zona: Codable, Identifiable, Hashable {
    let id: String
    let nombre: String
    let provincias: [String]
    let poligono: [[Double]]

    var puntos: [CGPoint] {
        poligono.map { CGPoint(x: $0[0], y: $0[1]) }
    }
}

struct Provincia: Codable, Hashable {
    let nombre: String
    let sigla: String
    let lon0: Double?
    let lon1: Double?
    let mitad: String?
    let contorno: String?
}

struct CatalogoZonas: Codable {
    let contorno: Contornos
    let provincias: [Provincia]
    let zonas: [Zona]
}

struct Contornos: Codable {
    let cuba: [[Double]]
    let islaJuventud: [[Double]]

    enum CodingKeys: String, CodingKey {
        case cuba
        case islaJuventud = "isla_juventud"
    }

    var puntosCuba: [CGPoint] { cuba.map { CGPoint(x: $0[0], y: $0[1]) } }
    var puntosIslaJuventud: [CGPoint] { islaJuventud.map { CGPoint(x: $0[0], y: $0[1]) } }
}
