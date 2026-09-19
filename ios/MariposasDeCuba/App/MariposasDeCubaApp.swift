import SwiftUI

@main
struct MariposasDeCubaApp: App {
    @StateObject private var almacen = Almacen.shared

    var body: some Scene {
        WindowGroup {
            CatalogoView()
                .environmentObject(almacen)
                .preferredColorScheme(nil)   // sigue el ajuste del sistema
        }
    }
}
