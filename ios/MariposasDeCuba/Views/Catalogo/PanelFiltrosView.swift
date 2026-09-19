import SwiftUI

/// Hoja de filtros: cinco grupos (familia, subfamilia, zona, color,
/// tamaño). Usa el `.sheet` nativo de SwiftUI, que ya trae el asa,
/// las esquinas redondeadas y el velo — no hay que dibujar nada de
/// eso a mano como en la web.
struct PanelFiltrosView: View {
    @ObservedObject var vm: EspeciesViewModel
    @Environment(\.dismiss) private var dismiss

    private let muestras: [String: Color] = [
        "negro": Color(hex: "#1C1C1C"), "blanco": Color(hex: "#EFEFEA"),
        "amarillo": Color(hex: "#E0B932"), "naranja": Color(hex: "#D97A2B"),
        "pardo": Color(hex: "#7A5A3C"), "azul": Color(hex: "#3E62B8"),
        "verde": Color(hex: "#3C8A4A"), "rojo": Color(hex: "#BE3B2C"),
        "gris": Color(hex: "#8A8F8C"), "iridiscente": Color(hex: "#6FD6C0")
    ]

    private let ayudaTamano: [String: String] = [
        "pequeña": "hasta 35 mm", "mediana": "35 a 70 mm", "grande": "más de 70 mm"
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    grupo("Familia") {
                        flujo(vm.meta.familias, activos: vm.filtros.familias, cursiva: true) {
                            vm.alternarFiltro(\.familias, $0)
                        }
                    }
                    grupo("Subfamilia") {
                        flujo(vm.meta.subfamilias, activos: vm.filtros.subfamilias, cursiva: true) {
                            vm.alternarFiltro(\.subfamilias, $0)
                        }
                    }
                    grupo("Zona geográfica") {
                        flujo(vm.opcionesZonas, activos: vm.filtros.zonas, cursiva: false) {
                            vm.alternarFiltro(\.zonas, $0)
                        }
                    }
                    grupo("Color") {
                        FlowLayout(spacing: 8) {
                            ForEach(vm.meta.colores, id: \.self) { color in
                                let activa = vm.filtros.colores.contains(color)
                                Button {
                                    vm.alternarFiltro(\.colores, color)
                                } label: {
                                    HStack(spacing: 7) {
                                        Circle()
                                            .fill(muestras[color] ?? Paleta.atala)
                                            .frame(width: 13, height: 13)
                                            .overlay(Circle().strokeBorder(.black.opacity(0.28), lineWidth: 1))
                                        Text(color)
                                    }
                                }
                                .pildora(activa: activa)
                            }
                        }
                    }
                    grupo("Tamaño") {
                        FlowLayout(spacing: 8) {
                            ForEach(vm.meta.tamanos, id: \.self) { tam in
                                let activa = vm.filtros.tamanos.contains(tam)
                                Button {
                                    vm.alternarFiltro(\.tamanos, tam)
                                } label: {
                                    VStack(alignment: .leading, spacing: 0) {
                                        Text(tam)
                                        Text(ayudaTamano[tam] ?? "")
                                            .font(.system(size: 11))
                                            .foregroundStyle(activa ? Color.black.opacity(0.6) : Paleta.papelTenue)
                                    }
                                }
                                .pildora(activa: activa)
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Paleta.sombra)
            .navigationTitle("Filtros")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if vm.filtros.cuenta > 0 {
                        Button("Quitar todo") { vm.limpiarFiltros() }
                            .foregroundStyle(Paleta.papelMedio)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Ver \(vm.especies.count)") { dismiss() }
                        .fontWeight(.semibold)
                        .foregroundStyle(Paleta.onAccento)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 6)
                        .background(Paleta.atala)
                        .clipShape(Capsule())
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private func grupo<Contenido: View>(_ titulo: String, @ViewBuilder contenido: () -> Contenido) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(titulo).font(.serifTitulo(15))
            contenido()
        }
    }

    private func flujo(_ opciones: [String], activos: [String], cursiva: Bool, onTocar: @escaping (String) -> Void) -> some View {
        FlowLayout(spacing: 8) {
            ForEach(opciones, id: \.self) { o in
                let activa = activos.contains(o)
                Button(o) { onTocar(o) }
                    .font(cursiva ? .binomio(13) : .system(size: 13))
                    .pildora(activa: activa)
            }
        }
    }
}

/// Un flujo que envuelve línea a línea, como `flex-wrap: wrap` en la
/// web — SwiftUI no lo trae de fábrica antes de iOS 16's `Layout`.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, filaAlto: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 {
                x = 0; y += filaAlto + spacing; filaAlto = 0
            }
            x += size.width + spacing
            filaAlto = max(filaAlto, size.height)
        }
        return CGSize(width: width.isFinite ? width : x, height: y + filaAlto)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = bounds.minX, y: CGFloat = bounds.minY, filaAlto: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX; y += filaAlto + spacing; filaAlto = 0
            }
            subview.place(at: CGPoint(x: x, y: y), anchor: .topLeading, proposal: ProposedViewSize(size))
            x += size.width + spacing
            filaAlto = max(filaAlto, size.height)
        }
    }
}
