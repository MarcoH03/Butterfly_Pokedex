import SwiftUI
import UIKit

/// Envoltorio mínimo de `UIImagePickerController` para poder tomar
/// una foto con la cámara — `PhotosPicker` (SwiftUI nativo) cubre la
/// galería, pero no dispara la cámara directamente.
struct CameraPicker: UIViewControllerRepresentable {
    var alCapturar: (Data) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let padre: CameraPicker
        init(_ padre: CameraPicker) { self.padre = padre }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let imagen = info[.originalImage] as? UIImage, let data = imagen.jpegData(compressionQuality: 0.8) {
                padre.alCapturar(data)
            }
            padre.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            padre.dismiss()
        }
    }
}
