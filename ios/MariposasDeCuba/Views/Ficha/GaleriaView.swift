import SwiftUI
import PhotosUI

/// Galería personal de una especie: tus fotos, guardadas en el
/// teléfono. Cámara o galería para añadir, tocar para ver a pantalla
/// completa, mantener pulsado para borrar.
struct GaleriaView: View {
    let especieId: Int
    var onAbrir: (String) -> Void

    @EnvironmentObject private var almacen: Almacen
    @State private var mostrarCamara = false
    @State private var seleccionGaleria: [PhotosPickerItem] = []

    private let columnas = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]

    var body: some View {
        Seccion("Mi galería") {
            HStack(spacing: 12) {
                Button("Cámara") { mostrarCamara = true }
                    .font(.system(size: 13)).foregroundStyle(Paleta.atala)
                PhotosPicker(selection: $seleccionGaleria, matching: .images) {
                    Text("Galería").font(.system(size: 13)).foregroundStyle(Paleta.atala)
                }
            }
        } contenido: {
            let fotos = almacen.galeriaDe(especieId)
            if fotos.isEmpty {
                Text("Aquí van tus propias fotos de esta especie. Se guardan en el teléfono.")
                    .font(.system(size: 13)).foregroundStyle(Paleta.papelMedio)
            } else {
                LazyVGrid(columns: columnas, spacing: 8) {
                    ForEach(fotos) { foto in
                        ZStack(alignment: .topTrailing) {
                            Button { onAbrir("galeria:\(foto.id.uuidString)") } label: {
                                if let ui = UIImage(contentsOfFile: almacen.rutaImagen(foto.archivo).path) {
                                    Image(uiImage: ui).resizable().aspectRatio(1, contentMode: .fill)
                                        .frame(maxWidth: .infinity)
                                        .aspectRatio(1, contentMode: .fit)
                                        .clipped()
                                        .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
                                }
                            }
                            Button { almacen.borrarFoto(foto.id) } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(.white, .black.opacity(0.6))
                            }
                            .padding(4)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $mostrarCamara) {
            CameraPicker { data in almacen.agregarFoto(especieId, data: data) }
        }
        .onChange(of: seleccionGaleria) { _, items in
            Task {
                for item in items {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        almacen.agregarFoto(especieId, data: data)
                    }
                }
                seleccionGaleria = []
            }
        }
    }
}
