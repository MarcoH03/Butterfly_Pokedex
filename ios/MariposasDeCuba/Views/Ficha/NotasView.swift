import SwiftUI

/// Libreta de notas por especie: se toca y se escribe, se guarda
/// sola a los 500 ms de dejar de teclear.
struct NotasView: View {
    let especieId: Int

    @EnvironmentObject private var almacen: Almacen
    @State private var texto: String = ""
    @State private var guardado = false
    @State private var tarea: Task<Void, Never>?

    var body: some View {
        Seccion("Mis notas") {
            if guardado {
                Text("Guardado").font(.system(size: 12)).foregroundStyle(Paleta.atala)
            }
        } contenido: {
            TextEditor(text: $texto)
                .font(.system(size: 15))
                .frame(minHeight: 88)
                .padding(10)
                .scrollContentBackground(.hidden)
                .background(Paleta.sombraAlt)
                .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous).strokeBorder(Paleta.linea, lineWidth: 1))
        }
        .onAppear { texto = almacen.leerNota(especieId) }
        .onChange(of: texto) { _, nuevo in
            tarea?.cancel()
            tarea = Task {
                try? await Task.sleep(nanoseconds: 500_000_000)
                guard !Task.isCancelled else { return }
                almacen.guardarNota(especieId, nuevo)
                guardado = true
                try? await Task.sleep(nanoseconds: 1_600_000_000)
                guardado = false
            }
        }
    }
}
