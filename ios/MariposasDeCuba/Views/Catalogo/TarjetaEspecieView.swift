import SwiftUI

/// Una celda de la cuadrícula principal: la foto ocupa toda la
/// tarjeta, el nombre va encima sobre un degradado. En modo
/// selección, tocar marca en vez de abrir la ficha.
struct TarjetaEspecieView: View {
    let especie: Especie
    let vista: EspeciesViewModel.Vista
    let modoSeleccion: Bool
    let marcada: Bool
    let avistamientos: Int
    let onMarcar: () -> Void

    var body: some View {
        let ruta = vista == .montados ? especie.imagenes.montado : especie.imagenes.lamina
        let colorFam = Paleta.familia(especie.familia)

        ZStack(alignment: .topLeading) {
            Lamina(ruta: ruta, relacion: vista == .montados ? 4.0/3.0 : 1)

            // Franja de familia
            colorFam
                .frame(width: 3, height: 34)

            // Pie: nombre sobre degradado
            VStack {
                Spacer()
                ZStack(alignment: .bottomLeading) {
                    LinearGradient(
                        colors: [Color.black.opacity(0.94), .clear],
                        startPoint: .bottom, endPoint: .top
                    )
                    .frame(height: 56)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(especie.nombre)
                            .font(.binomio(13))
                            .foregroundStyle(.white)
                            .lineLimit(1)
                        Text(especie.nombresAlternos.first ?? especie.subfamilia)
                            .font(.system(size: 11))
                            .foregroundStyle(.white.opacity(0.65))
                            .lineLimit(1)
                    }
                    .padding(.horizontal, 10)
                    .padding(.bottom, 8)
                }
            }

            // Conteo de avistamientos
            if avistamientos > 0 {
                Text("\(avistamientos)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Paleta.onAccento)
                    .frame(minWidth: 20)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 1)
                    .background(Paleta.polen)
                    .clipShape(Capsule())
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(6)
            }

            // Marca de selección
            if modoSeleccion {
                ZStack {
                    Circle()
                        .fill(marcada ? Paleta.atala : Color.black.opacity(0.72))
                        .overlay {
                            if !marcada { Circle().strokeBorder(Paleta.papelTenue, lineWidth: 1) }
                        }
                    if marcada {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Paleta.onAccento)
                    }
                }
                .frame(width: 22, height: 22)
                .padding(6)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: Forma.panel, style: .continuous)
                .strokeBorder(marcada ? Paleta.atala : Paleta.linea, lineWidth: marcada ? 2 : 1)
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onMarcar)
    }
}
