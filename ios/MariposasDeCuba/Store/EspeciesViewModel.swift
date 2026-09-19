import Foundation
import Combine

/// Búsqueda, filtros, vista (láminas/montados) y selección manual.
/// Equivalente nativo de `src/hooks/useEspecies.js`.
@MainActor
final class EspeciesViewModel: ObservableObject {
    @Published var consulta: String = ""
    @Published var vista: Vista = .laminas
    @Published var filtros = Filtros()
    @Published var modoSeleccion = false
    @Published var soloSeleccion = false

    private let todas = Catalogo.especies.especies
    let meta = Catalogo.especies.meta
    let almacen = Almacen.shared

    enum Vista: String { case laminas, montados }

    struct Filtros: Equatable {
        var familias: [String] = []
        var subfamilias: [String] = []
        var zonas: [String] = []       // por nombre, igual que la web
        var provincias: [String] = []
        var colores: [String] = []
        var tamanos: [String] = []

        var vacio: Bool {
            familias.isEmpty && subfamilias.isEmpty && zonas.isEmpty &&
            provincias.isEmpty && colores.isEmpty && tamanos.isEmpty
        }

        var cuenta: Int {
            familias.count + subfamilias.count + zonas.count + provincias.count + colores.count + tamanos.count
        }
    }

    var total: Int { todas.count }

    var opcionesZonas: [String] {
        Catalogo.zonas.zonas.map(\.nombre).sorted()
    }

    /// Lista final: selección manual → filtros → búsqueda, en ese orden.
    var especies: [Especie] {
        var lista = todas

        if soloSeleccion && !almacen.datos.seleccion.isEmpty {
            lista = lista.filter { almacen.datos.seleccion.contains($0.id) }
        }

        if !filtros.familias.isEmpty {
            lista = lista.filter { filtros.familias.contains($0.familia) }
        }
        if !filtros.subfamilias.isEmpty {
            lista = lista.filter { filtros.subfamilias.contains($0.subfamilia) }
        }
        if !filtros.zonas.isEmpty {
            let idsElegidos = Set(filtros.zonas.compactMap { nombre in
                Catalogo.zonas.zonas.first { $0.nombre == nombre }?.id
            })
            lista = lista.filter { !idsElegidos.isDisjoint(with: $0.distribucion.zonas) }
        }
        if !filtros.provincias.isEmpty {
            lista = lista.filter { !Set(Catalogo.provinciasDe($0)).isDisjoint(with: filtros.provincias) }
        }
        if !filtros.colores.isEmpty {
            lista = lista.filter { esp in filtros.colores.allSatisfy { esp.colores.contains($0) } }
        }
        if !filtros.tamanos.isEmpty {
            lista = lista.filter { filtros.tamanos.contains(claseTamano($0)) }
        }

        if !consulta.trimmingCharacters(in: .whitespaces).isEmpty {
            let q = normalizar(consulta)
            lista = lista.filter { esp in
                normalizar(esp.nombre).contains(q) ||
                esp.nombresAlternos.contains { normalizar($0).contains(q) }
            }
        }

        return lista
    }

    func claseTamano(_ e: Especie) -> String {
        if let clase = e.tamanoClase { return clase }
        let max = e.tamanoMM.max
        guard max > 0 else { return "" }
        if max < meta.umbralesTamanoMM.pequeña { return "pequeña" }
        if max > meta.umbralesTamanoMM.grande { return "grande" }
        return "mediana"
    }

    private func normalizar(_ s: String) -> String {
        s.folding(options: .diacriticInsensitive, locale: .current).lowercased()
    }

    func alternarFiltro(_ clave: WritableKeyPath<Filtros, [String]>, _ valor: String) {
        if let i = filtros[keyPath: clave].firstIndex(of: valor) {
            filtros[keyPath: clave].remove(at: i)
        } else {
            filtros[keyPath: clave].append(valor)
        }
    }

    func limpiarFiltros() {
        filtros = Filtros()
        consulta = ""
    }

    /// Filtros activos como lista plana, para pintar los chips.
    var activos: [(clave: String, valor: String)] {
        var salida: [(String, String)] = []
        salida += filtros.familias.map { ("familias", $0) }
        salida += filtros.subfamilias.map { ("subfamilias", $0) }
        salida += filtros.zonas.map { ("zonas", $0) }
        salida += filtros.provincias.map { ("provincias", $0) }
        salida += filtros.colores.map { ("colores", $0) }
        salida += filtros.tamanos.map { ("tamanos", $0) }
        return salida
    }

    func quitarFiltro(clave: String, valor: String) {
        switch clave {
        case "familias": filtros.familias.removeAll { $0 == valor }
        case "subfamilias": filtros.subfamilias.removeAll { $0 == valor }
        case "zonas": filtros.zonas.removeAll { $0 == valor }
        case "provincias": filtros.provincias.removeAll { $0 == valor }
        case "colores": filtros.colores.removeAll { $0 == valor }
        case "tamanos": filtros.tamanos.removeAll { $0 == valor }
        default: break
        }
    }

    static func especiePorId(_ id: Int) -> Especie? {
        Catalogo.especies.especies.first { $0.id == id }
    }
}
