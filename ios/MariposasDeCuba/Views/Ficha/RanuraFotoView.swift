import SwiftUI
import PhotosUI

/// Hueco de foto para un estadio del ciclo de vida: vacío invita a
/// añadir (cámara o galería), lleno muestra la foto con un punto
/// amarillo si es tuya (sustituye a la del catálogo) y un botón para
/// borrarla.
struct RanuraFotoView: View {
    var archivoPropio: String?          // nombre de archivo en Almacen
    var rutaCatalogo: String?           // ruta dentro del bundle (puede no existir)
    var tamano: CGFloat = 76
    var onFoto: (Data) -> Void
    var onBorrar: (() -> Void)? = nil
    var onAbrir: (() -> Void)? = nil

    @EnvironmentObject private var almacen: Almacen
    @State private var mostrarOrigen = false
    @State private var mostrarCamara = false
    @State private var mostrarGaleria = false
    @State private var seleccionGaleria: PhotosPickerItem?

    var body: some View {
        Button {
            if archivoPropio != nil || rutaCatalogo != nil {
                onAbrir?()
            } else {
                mostrarOrigen = true
            }
        } label: {
            ZStack(alignment: .topTrailing) {
                if let archivoPropio {
                    Image(uiImage: (try? UIImage(data: Data(contentsOf: almacen.rutaImagen(archivoPropio)))) ?? UIImage())
                        .resizable().aspectRatio(contentMode: .fill)
                } else {
                    Lamina(ruta: rutaCatalogo, relacion: 1)
                }

                if archivoPropio != nil {
                    Circle().fill(Paleta.polen).frame(width: 8, height: 8).padding(5)
                }
            }
            .frame(width: tamano, height: tamano)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(Paleta.linea, lineWidth: 1))
        }
        .buttonStyle(.tactil)
        .overlay(alignment: .bottomTrailing) {
            if let onBorrar, archivoPropio != nil {
                Button(role: .destructive, action: onBorrar) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.white, Paleta.grana)
                        .background(Circle().fill(.white).padding(2))
                }
                .offset(x: 6, y: 6)
            }
        }
        .confirmationDialog("Añadir foto", isPresented: $mostrarOrigen, titleVisibility: .visible) {
            Button("Cámara") { mostrarCamara = true }
            Button("Galería") { mostrarGaleria = true }
            Button("Cancelar", role: .cancel) {}
        }
        .photosPicker(isPresented: $mostrarGaleria, selection: $seleccionGaleria, matching: .images)
        .sheet(isPresented: $mostrarCamara) {
            CameraPicker(alCapturar: onFoto)
        }
        .onChange(of: seleccionGaleria) { _, item in
            Task {
                if let item, let data = try? await item.loadTransferable(type: Data.self) {
                    onFoto(data)
                }
                seleccionGaleria = nil
            }
        }
    }
}
