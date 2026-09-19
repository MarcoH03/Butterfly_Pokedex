import Foundation

/// Una especie del catálogo. Los mismos nombres de campo que el JSON
/// original (español), para poder leer especies.json tal cual sin
/// convertir nada.
struct Especie: Codable, Identifiable, Hashable {
    let id: Int
    let nombre: String
    let autoria: String
    let familia: String
    let subfamilia: String
    let nombresAlternos: [String]
    let endemica: Bool
    let tamanoMM: RangoTamano
    let tamanoClase: String?
    let colores: [String]
    let descripcion: String
    let anverso: String
    let reverso: String
    let rasgos: String
    let habitat: [String]
    let vuelo: Vuelo
    let comportamiento: String
    let ciclo: Ciclo
    let distribucion: Distribucion
    let imagenes: Imagenes
    let estadoDatos: String
    let fuentes: [String]

    enum CodingKeys: String, CodingKey {
        case id, nombre, autoria, familia, subfamilia
        case nombresAlternos = "nombres_alternos"
        case endemica
        case tamanoMM = "tamano_mm"
        case tamanoClase = "tamano_clase"
        case colores, descripcion, anverso, reverso, rasgos, habitat, vuelo, comportamiento, ciclo, distribucion, imagenes
        case estadoDatos = "estado_datos"
        case fuentes
    }

    /// Etiqueta de tres cifras, como en las cajas entomológicas: 001, 002…
    var numero: String { String(format: "%03d", id) }
}

struct RangoTamano: Codable, Hashable {
    let min: Double
    let max: Double
}

struct Vuelo: Codable, Hashable {
    let meses: [Int]
    let nota: String
}

struct Ciclo: Codable, Hashable {
    let huevo: String
    let larva: String
    let pupa: String
    let hospederas: [String]
    let notaHospederas: String

    enum CodingKeys: String, CodingKey {
        case huevo, larva, pupa, hospederas
        case notaHospederas = "nota_hospederas"
    }
}

struct Distribucion: Codable, Hashable {
    let zonas: [String]
    let poligonos: [[[Double]]]
    let nota: String
}

struct Imagenes: Codable, Hashable {
    let lamina: String?
    let montado: String?
    let larva: String?
    let pupa: String?
    let hospedera: String?
}

/// `meta` de especies.json: catálogo de opciones para los filtros.
struct CatalogoMeta: Codable {
    let titulo: String
    let version: String
    let total: Int
    let familias: [String]
    let subfamilias: [String]
    let provincias: [String]
    let colores: [String]
    let tamanos: [String]
    let umbralesTamanoMM: UmbralesTamano

    enum CodingKeys: String, CodingKey {
        case titulo, version, total, familias, subfamilias, provincias, colores, tamanos
        case umbralesTamanoMM = "umbrales_tamano_mm"
    }
}

struct UmbralesTamano: Codable {
    let pequeña: Double
    let grande: Double
}

struct CatalogoEspecies: Codable {
    let meta: CatalogoMeta
    let especies: [Especie]
}

/// Colores de familia — el mismo mapa que `TarjetaEspecie.jsx` en la
/// versión web, para orientarse de un vistazo en la cuadrícula.
enum ColorFamilia {
    static let mapa: [String: String] = [
        "Papilionidae": "#8E6FB8",
        "Hesperiidae":  "#B07B3F",
        "Pieridae":     "#C9A227",
        "Riodinidae":   "#4A9FB0",
        "Lycaenidae":   "#5C7FC0",
        "Nymphalidae":  "#C34733"
    ]
}
