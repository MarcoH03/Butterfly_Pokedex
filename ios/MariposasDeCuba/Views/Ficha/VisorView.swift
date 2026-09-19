import SwiftUI

struct ImagenVisor: Identifiable, Hashable {
    let id: String     // clave
    let ruta: String?  // ruta del catálogo…
    let archivo: String?  // …o nombre de archivo propio en Almacen
    let pie: String
}

/// Imagen a pantalla completa: pellizcar para acercar, doble toque
/// para 2,5×, arrastrar para mover o para cerrar. Desliza para pasar
/// a la siguiente imagen de la misma especie.
struct VisorView: View {
    let imagenes: [ImagenVisor]
    @State var indice: Int
    var onCerrar: () -> Void

    @EnvironmentObject private var almacen: Almacen
    @State private var arrastreCierre: CGFloat = 0

    var body: some View {
        ZStack {
            Color.black.opacity(1 - min(Double(abs(arrastreCierre)) / 400.0, 0.5)).ignoresSafeArea()

            TabView(selection: $indice) {
                ForEach(Array(imagenes.enumerated()), id: \.offset) { i, imagen in
                    ImagenZoom(imagen: imagen)
                        .tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .offset(y: arrastreCierre)
            .gesture(
                DragGesture()
                    .onChanged { v in
                        if v.translation.height > 0 { arrastreCierre = v.translation.height }
                    }
                    .onEnded { v in
                        if v.translation.height > 120 {
                            onCerrar()
                        } else {
                            withAnimation(.spring()) { arrastreCierre = 0 }
                        }
                    }
            )

            VStack {
                HStack {
                    Spacer()
                    Button(action: onCerrar) {
                        Image(systemName: "xmark")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(.black.opacity(0.5), in: Circle())
                    }
                    .padding()
                }
                Spacer()
                if let pie = imagenes[safe: indice]?.pie {
                    Text(pie)
                        .font(.system(size: 13))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .background(.black.opacity(0.5), in: Capsule())
                        .padding(.bottom, 24)
                }
            }
        }
        .statusBarHidden()
    }
}

private struct ImagenZoom: View {
    let imagen: ImagenVisor
    @EnvironmentObject private var almacen: Almacen
    @State private var escala: CGFloat = 1
    @State private var desplazamiento: CGSize = .zero

    var body: some View {
        GeometryReader { geo in
            contenidoImagen
                .frame(width: geo.size.width, height: geo.size.height)
                .scaleEffect(escala)
                .offset(desplazamiento)
                .gesture(
                    MagnificationGesture()
                        .onChanged { v in escala = max(1, min(v, 6)) }
                        .onEnded { _ in if escala < 1.05 { withAnimation(.spring()) { escala = 1; desplazamiento = .zero } } }
                )
                .simultaneousGesture(
                    DragGesture()
                        .onChanged { v in if escala > 1 { desplazamiento = v.translation } }
                        .onEnded { _ in if escala <= 1 { withAnimation(.spring()) { desplazamiento = .zero } } }
                )
                .onTapGesture(count: 2) {
                    withAnimation(.spring()) {
                        if escala > 1 { escala = 1; desplazamiento = .zero } else { escala = 2.5 }
                    }
                }
        }
    }

    @ViewBuilder
    private var contenidoImagen: some View {
        if let archivo = imagen.archivo,
           let data = try? Data(contentsOf: almacen.rutaImagen(archivo)),
           let ui = UIImage(data: data) {
            Image(uiImage: ui).resizable().aspectRatio(contentMode: .fit)
        } else if let ruta = imagen.ruta {
            Lamina(ruta: ruta, relacion: 1)
        } else {
            Silueta().stroke(Color.white, lineWidth: 1.4).padding(60).opacity(0.3)
        }
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
