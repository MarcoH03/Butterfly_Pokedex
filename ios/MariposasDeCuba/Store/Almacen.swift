import Foundation
import SwiftUI

/// Todo lo que el usuario guarda en el teléfono: avistamientos, notas,
/// galería, fotos de estadios y selección manual. Vive en
/// Documents/almacen.json + Documents/fotos/, nunca sale del
/// dispositivo. Equivalente nativo de `src/lib/almacen.js`.
@MainActor
final class Almacen: ObservableObject {
    static let shared = Almacen()

    @Published private(set) var datos: AlmacenDatos

    private let archivoDatos: URL
    private let carpetaFotos: URL

    private init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        archivoDatos = docs.appendingPathComponent("almacen.json")
        carpetaFotos = docs.appendingPathComponent("fotos", isDirectory: true)
        try? FileManager.default.createDirectory(at: carpetaFotos, withIntermediateDirectories: true)

        if let data = try? Data(contentsOf: archivoDatos),
           let leido = try? JSONDecoder.conFechaISO().decode(AlmacenDatos.self, from: data) {
            datos = leido
        } else {
            datos = AlmacenDatos()
        }
    }

    private func guardar() {
        objectWillChange.send()
        guard let data = try? JSONEncoder.conFechaISO().encode(datos) else { return }
        try? data.write(to: archivoDatos, options: .atomic)
    }

    // MARK: - Fotos en disco

    /// Guarda los datos de una imagen en Documents/fotos y devuelve su
    /// nombre de archivo (lo que se guarda en el registro, no la ruta
    /// completa — así el almacén es portátil entre instalaciones).
    func guardarImagen(_ data: Data) -> String {
        let nombre = "\(UUID().uuidString).jpg"
        let destino = carpetaFotos.appendingPathComponent(nombre)
        try? data.write(to: destino)
        return nombre
    }

    func rutaImagen(_ archivo: String) -> URL {
        carpetaFotos.appendingPathComponent(archivo)
    }

    private func borrarImagen(_ archivo: String?) {
        guard let archivo else { return }
        try? FileManager.default.removeItem(at: rutaImagen(archivo))
    }

    // MARK: - Avistamientos

    func avistamientosDe(_ especieId: Int) -> [Avistamiento] {
        datos.avistamientos
            .filter { $0.especieId == especieId }
            .sorted { $0.fecha > $1.fecha }
    }

    func conteoPorEspecie() -> [Int: Int] {
        Dictionary(grouping: datos.avistamientos, by: \.especieId).mapValues(\.count)
    }

    func agregarAvistamiento(_ a: Avistamiento) {
        datos.avistamientos.append(a)
        guardar()
    }

    func borrarAvistamiento(_ id: UUID) {
        if let a = datos.avistamientos.first(where: { $0.id == id }) {
            borrarImagen(a.fotoArchivo)
        }
        datos.avistamientos.removeAll { $0.id == id }
        guardar()
    }

    /// Avistamientos agrupados por lugar, con el conteo — para la
    /// sección "Por zona" de la ficha.
    func conteoPorLugar(_ especieId: Int) -> [ConteoLugar] {
        let propios = avistamientosDe(especieId).filter { !$0.lugar.isEmpty }
        let agrupado = Dictionary(grouping: propios, by: \.lugar)
        return agrupado.map { ConteoLugar(lugar: $0.key, provincia: $0.value.first?.provincia, veces: $0.value.count) }
            .sorted { $0.veces > $1.veces }
    }

    // MARK: - Notas

    func leerNota(_ especieId: Int) -> String {
        datos.notas[String(especieId)] ?? ""
    }

    func guardarNota(_ especieId: Int, _ texto: String) {
        datos.notas[String(especieId)] = texto
        guardar()
    }

    // MARK: - Galería personal

    func galeriaDe(_ especieId: Int) -> [FotoGaleria] {
        datos.galeria.filter { $0.especieId == especieId }
    }

    @discardableResult
    func agregarFoto(_ especieId: Int, data: Data, pie: String = "") -> Bool {
        let archivo = guardarImagen(data)
        datos.galeria.append(FotoGaleria(especieId: especieId, archivo: archivo, pie: pie))
        guardar()
        return true
    }

    func borrarFoto(_ id: UUID) {
        if let f = datos.galeria.first(where: { $0.id == id }) { borrarImagen(f.archivo) }
        datos.galeria.removeAll { $0.id == id }
        guardar()
    }

    // MARK: - Fotos de estadio (huevo / larva / pupa / hospedera)

    func fotoEstadio(_ especieId: Int, _ estadio: String) -> String? {
        datos.fotosEstadio.first { $0.especieId == especieId && $0.estadio == estadio }?.archivo
    }

    func guardarFotoEstadio(_ especieId: Int, _ estadio: String, data: Data) {
        if let existente = datos.fotosEstadio.firstIndex(where: { $0.especieId == especieId && $0.estadio == estadio }) {
            borrarImagen(datos.fotosEstadio[existente].archivo)
            datos.fotosEstadio[existente].archivo = guardarImagen(data)
        } else {
            let archivo = guardarImagen(data)
            datos.fotosEstadio.append(FotoEstadio(especieId: especieId, estadio: estadio, archivo: archivo))
        }
        guardar()
    }

    func borrarFotoEstadio(_ especieId: Int, _ estadio: String) {
        if let existente = datos.fotosEstadio.first(where: { $0.especieId == especieId && $0.estadio == estadio }) {
            borrarImagen(existente.archivo)
        }
        datos.fotosEstadio.removeAll { $0.especieId == especieId && $0.estadio == estadio }
        guardar()
    }

    // MARK: - Zonas propias (nacidas en el campo)

    func todasLasZonas(semilla: [Zona]) -> [Zona] {
        semilla + datos.zonasPropias
    }

    // MARK: - Selección manual

    func alternarSeleccion(_ especieId: Int) {
        if let i = datos.seleccion.firstIndex(of: especieId) {
            datos.seleccion.remove(at: i)
        } else {
            datos.seleccion.append(especieId)
        }
        guardar()
    }

    func limpiarSeleccion() {
        datos.seleccion.removeAll()
        guardar()
    }

    // MARK: - Respaldo

    func exportarJSON() -> Data? {
        try? JSONEncoder.conFechaISO().encode(datos)
    }

    func importarJSON(_ data: Data) -> Bool {
        guard let leido = try? JSONDecoder.conFechaISO().decode(AlmacenDatos.self, from: data) else { return false }
        datos = leido
        guardar()
        return true
    }
}

extension JSONEncoder {
    static func conFechaISO() -> JSONEncoder {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }
}

extension JSONDecoder {
    static func conFechaISO() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }
}
