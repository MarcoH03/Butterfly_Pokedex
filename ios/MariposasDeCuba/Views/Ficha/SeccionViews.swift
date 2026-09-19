import SwiftUI

/// Una sección apilada de la ficha: título serif + acción opcional a
/// la derecha, y su contenido debajo.
struct Seccion<Contenido: View, Accion: View>: View {
    let titulo: String
    @ViewBuilder var accion: () -> Accion
    @ViewBuilder var contenido: () -> Contenido

    init(_ titulo: String, @ViewBuilder accion: @escaping () -> Accion = { EmptyView() }, @ViewBuilder contenido: @escaping () -> Contenido) {
        self.titulo = titulo
        self.accion = accion
        self.contenido = contenido
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(titulo).font(.serifTitulo(17))
                Spacer()
                accion()
            }
            contenido()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 20)
    }
}

struct Insignia: View {
    let texto: String
    var color: Color? = nil

    var body: some View {
        Text(texto)
            .font(.binomio(12))
            .padding(.horizontal, 10).padding(.vertical, 3)
            .foregroundStyle(color != nil ? Paleta.onAccento : Paleta.papel)
            .background(color ?? Paleta.sombraAlt)
            .clipShape(Capsule())
            .overlay {
                if color == nil { Capsule().strokeBorder(Paleta.linea, lineWidth: 1) }
            }
    }
}

struct Dato: View {
    let etiqueta: String
    let valor: String
    var pendiente: Bool = false

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 16) {
            Text(etiqueta)
                .font(.system(size: 13))
                .foregroundStyle(Paleta.papelMedio)
                .frame(minWidth: 104, alignment: .leading)
            Spacer()
            Text(pendiente ? "Por documentar" : valor)
                .font(.system(size: 15))
                .foregroundStyle(pendiente ? Paleta.papelTenue : Paleta.papel)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 8)
        .overlay(alignment: .bottom) { Divider().overlay(Paleta.linea) }
    }
}

struct Etiquetita: View {
    let texto: String
    var body: some View {
        Text(texto).font(.system(size: 13)).foregroundStyle(Paleta.papelMedio)
    }
}

struct Parrafo: View {
    let texto: String
    var body: some View {
        if texto.isEmpty {
            Text("Por documentar").font(.system(size: 13)).foregroundStyle(Paleta.papelTenue)
        } else {
            Text(texto).font(.system(size: 15)).lineSpacing(5).foregroundStyle(Paleta.papel)
        }
    }
}

struct MiniSegmento: View {
    let opciones: [(clave: String, titulo: String)]
    @Binding var seleccion: String

    var body: some View {
        HStack(spacing: 2) {
            ForEach(opciones, id: \.clave) { op in
                let activa = seleccion == op.clave
                Button(op.titulo) { seleccion = op.clave }
                    .font(.system(size: 12, weight: activa ? .semibold : .regular))
                    .foregroundStyle(activa ? Paleta.papel : Paleta.papelMedio)
                    .padding(.horizontal, 13).padding(.vertical, 6)
                    .background(activa ? Paleta.segmentoActivo : .clear)
                    .clipShape(Capsule())
            }
        }
        .padding(2)
        .background(Paleta.sombraAlt)
        .clipShape(Capsule())
    }
}
