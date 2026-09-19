import Foundation

/// Carga perezosa de los dos catálogos empaquetados con la app:
/// especies.json y zonas.json. Son datos fijos — no cambian nunca en
/// tiempo de ejecución, así que basta con leerlos una vez.
enum Catalogo {
    static let especies: CatalogoEspecies = cargar("especies", tipo: CatalogoEspecies.self)
    static let zonas: CatalogoZonas = cargar("zonas", tipo: CatalogoZonas.self)

    static var zonaPorId: [String: Zona] {
        Dictionary(uniqueKeysWithValues: zonas.zonas.map { ($0.id, $0) })
    }

    /// Provincias que toca una especie, derivadas de sus zonas —
    /// nunca al revés. Igual que `provinciasDe()` en useEspecies.js.
    static func provinciasDe(_ especie: Especie) -> [String] {
        var set = Set<String>()
        for zonaId in especie.distribucion.zonas {
            if let z = zonaPorId[zonaId] {
                for p in z.provincias { set.insert(p) }
            }
        }
        return Array(set).sorted()
    }

    private static func cargar<T: Decodable>(_ nombre: String, tipo: T.Type) -> T {
        guard let url = Bundle.main.url(forResource: nombre, withExtension: "json") else {
            fatalError("Falta el recurso \(nombre).json en el paquete de la app")
        }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            fatalError("No se pudo leer \(nombre).json: \(error)")
        }
    }
}
