import SwiftUI
import PhotosUI

/// Anotar un avistamiento en el campo: zona, fecha, si fue
/// capturada u observada, GPS y una foto opcional. Se guarda en el
/// teléfono. `Form` nativo: separadores, agrupado y teclado ya
/// resueltos por UIKit, no hay que imitarlos.
struct HojaAvistamientoView: View {
    let especie: Especie
    var onGuardado: (String?) -> Void

    @EnvironmentObject private var almacen: Almacen
    @Environment(\.dismiss) private var dismiss
    @StateObject private var ubicacion = Ubicacion()

    @State private var lugar: String = ""
    @State private var zonaElegida: Zona?
    @State private var fecha = Date()
    @State private var capturada = false
    @State private var nota = ""
    @State private var fotoData: Data?
    @State private var mostrarCamara = false
    @State private var seleccionGaleria: PhotosPickerItem?

    private var sugerencias: [Zona] {
        guard !lugar.isEmpty else { return [] }
        return Catalogo.zonas.zonas.filter { $0.nombre.localizedCaseInsensitiveContains(lugar) }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Zona") {
                    TextField("Escribe o elige del catálogo", text: $lugar)
                    if !sugerencias.isEmpty && zonaElegida == nil {
                        ForEach(sugerencias) { zona in
                            Button(zona.nombre) {
                                lugar = zona.nombre
                                zonaElegida = zona
                            }
                            .foregroundStyle(Paleta.papel)
                        }
                    }
                }

                Section("Cuándo") {
                    DatePicker("Fecha", selection: $fecha, displayedComponents: [.date, .hourAndMinute])
                }

                Section("Cómo") {
                    Picker("", selection: $capturada) {
                        Text("Observada").tag(false)
                        Text("Capturada").tag(true)
                    }
                    .pickerStyle(.segmented)
                }

                Section("Ubicación GPS") {
                    if let c = ubicacion.coordenada {
                        Text("\(c.latitude, specifier: "%.4f"), \(c.longitude, specifier: "%.4f")")
                            .foregroundStyle(Paleta.papelMedio)
                            .monospacedDigit()
                    }
                    Button(ubicacion.buscando ? "Buscando…" : "Usar mi ubicación actual") {
                        ubicacion.pedir()
                    }
                    .disabled(ubicacion.buscando)
                    if let error = ubicacion.error {
                        Text(error).font(.system(size: 12)).foregroundStyle(Paleta.grana)
                    }
                }

                Section("Foto") {
                    if let fotoData, let ui = UIImage(data: fotoData) {
                        Image(uiImage: ui)
                            .resizable().scaledToFill()
                            .frame(height: 160)
                            .frame(maxWidth: .infinity)
                            .clipped()
                            .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
                            .listRowInsets(EdgeInsets())
                        Button("Quitar foto", role: .destructive) { fotoData = nil }
                    } else {
                        Button("Cámara") { mostrarCamara = true }
                        PhotosPicker("Galería", selection: $seleccionGaleria, matching: .images)
                    }
                }

                Section("Nota") {
                    TextField("Observaciones, dudas de identificación…", text: $nota, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Nuevo avistamiento")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Guardar") { guardar() }
                        .fontWeight(.semibold)
                }
                ToolbarItem(placement: .principal) {
                    VStack(spacing: 0) {
                        Text("Nuevo avistamiento").font(.system(size: 15, weight: .semibold))
                        Text(especie.nombre).font(.binomio(12)).foregroundStyle(Paleta.papelMedio)
                    }
                }
            }
        }
        .sheet(isPresented: $mostrarCamara) {
            CameraPicker { data in fotoData = data }
        }
        .onChange(of: seleccionGaleria) { _, item in
            Task {
                if let item, let data = try? await item.loadTransferable(type: Data.self) {
                    fotoData = data
                }
            }
        }
    }

    private func guardar() {
        var archivo: String?
        if let fotoData { archivo = almacen.guardarImagen(fotoData) }

        let avistamiento = Avistamiento(
            especieId: especie.id,
            fecha: fecha,
            lugar: lugar,
            provincia: zonaElegida?.provincias.first,
            lat: ubicacion.coordenada?.latitude,
            lon: ubicacion.coordenada?.longitude,
            capturada: capturada,
            nota: nota,
            fotoArchivo: archivo
        )
        almacen.agregarAvistamiento(avistamiento)
        dismiss()
        onGuardado(zonaElegida == nil && !lugar.isEmpty ? "Zona nueva anotada" : nil)
    }
}
