import Foundation

/// Un avistamiento de campo: dónde, cuándo, si fue capturada u
/// observada, con foto y nota opcionales.
struct Avistamiento: Codable, Identifiable, Hashable {
    var id: UUID = UUID()
    var especieId: Int
    var fecha: Date
    var lugar: String
    var provincia: String?
    var lat: Double?
    var lon: Double?
    var capturada: Bool
    var nota: String
    var fotoArchivo: String?   // nombre de archivo en Documents/fotos/
}

/// Avistamientos agrupados por lugar, con el conteo — para la
/// sección "Por zona" de la ficha.
struct ConteoLugar: Identifiable, Hashable {
    var lugar: String
    var provincia: String?
    var veces: Int
    var id: String { lugar }
}

/// Una foto de galería personal para una especie.
struct FotoGaleria: Codable, Identifiable, Hashable {
    var id: UUID = UUID()
    var especieId: Int
    var archivo: String
    var pie: String
}

/// Foto propia de un estadio del ciclo de vida (huevo, larva, pupa,
/// hospedera), que sustituye a la del catálogo cuando existe.
struct FotoEstadio: Codable, Hashable {
    var especieId: Int
    var estadio: String
    var archivo: String
}

/// Todo lo que el usuario ha ido guardando en el teléfono — nunca los
/// datos del catálogo, que son fijos. Equivalente a `almacen.js`.
struct AlmacenDatos: Codable {
    var avistamientos: [Avistamiento] = []
    var notas: [String: String] = [:]                 // especieId (String) -> texto
    var galeria: [FotoGaleria] = []
    var fotosEstadio: [FotoEstadio] = []
    var zonasPropias: [Zona] = []
    var seleccion: [Int] = []
}
