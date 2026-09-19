import SwiftUI

private struct EstadioInfo: Identifiable {
    let clave: String
    let titulo: String
    let campo: KeyPath<Ciclo, String>?
    var id: String { clave }
}

private let ESTADIOS: [EstadioInfo] = [
    EstadioInfo(clave: "huevo", titulo: "Huevo", campo: \Ciclo.huevo),
    EstadioInfo(clave: "larva", titulo: "Larva (oruga)", campo: \Ciclo.larva),
    EstadioInfo(clave: "pupa", titulo: "Pupa (crisálida)", campo: \Ciclo.pupa),
    EstadioInfo(clave: "hospedera", titulo: "Planta hospedera", campo: nil)
]

/// Todo sobre una especie. Secciones apiladas: en un teléfono es más
/// rápido desplazarse que buscar la pestaña correcta.
struct FichaView: View {
    let especie: Especie

    @EnvironmentObject private var almacen: Almacen
    @Environment(\.dismiss) private var dismiss
    @State private var vista = "lamina"
    @State private var hojaAbierta = false
    @State private var visor: (imagenes: [ImagenVisor], indice: Int)?
    @State private var mensaje: String?
    @State private var version = 0

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                imagenPrincipal

                HStack {
                    MiniSegmento(
                        opciones: [("lamina", "Ejemplar vivo"), ("montado", "Montado")],
                        seleccion: $vista
                    )
                    Spacer()
                }
                .padding(.horizontal, 16).padding(.top, 12)

                encabezado

                Divider().overlay(Paleta.linea)
                identificacion
                Divider().overlay(Paleta.linea)
                distribucion
                Divider().overlay(Paleta.linea)
                cicloDeVida
                Divider().overlay(Paleta.linea)
                misAvistamientos
                Divider().overlay(Paleta.linea)
                GaleriaView(especieId: especie.id) { clave in abrirVisor(clave) }
                Divider().overlay(Paleta.linea)
                NotasView(especieId: especie.id)
            }
            .padding(.bottom, 100)
        }
        .background(Paleta.sombra)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text(especie.numero)
                    .font(.system(size: 12))
                    .foregroundStyle(Paleta.papelTenue)
                    .monospacedDigit()
            }
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 0) {
                if let mensaje {
                    Text(mensaje)
                        .font(.system(size: 13))
                        .foregroundStyle(Paleta.onAccento)
                        .padding(.horizontal, 14).padding(.vertical, 10)
                        .background(Paleta.polen)
                        .clipShape(RoundedRectangle(cornerRadius: Forma.panel, style: .continuous))
                        .padding(.horizontal, 16).padding(.bottom, 8)
                }
                Button("Anotar avistamiento") { hojaAbierta = true }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Paleta.onAccento)
                    .frame(maxWidth: .infinity)
                    .padding(14)
                    .background(Paleta.atala)
                    .clipShape(RoundedRectangle(cornerRadius: Forma.control, style: .continuous))
                    .padding(.horizontal, 16).padding(.top, 8)
            }
            .background(.bar)
        }
        .sheet(isPresented: $hojaAbierta) {
            HojaAvistamientoView(especie: especie) { texto in
                version += 1
                if let texto { mostrarMensaje(texto) }
            }
        }
        .fullScreenCover(item: Binding(
            get: { visor.map { VisorEnvoltorio(imagenes: $0.imagenes, indice: $0.indice) } },
            set: { if $0 == nil { visor = nil } }
        )) { envoltorio in
            VisorView(imagenes: envoltorio.imagenes, indice: envoltorio.indice) { visor = nil }
        }
    }

    private func mostrarMensaje(_ texto: String) {
        mensaje = texto
        Task {
            try? await Task.sleep(nanoseconds: 2_600_000_000)
            mensaje = nil
        }
    }

    // MARK: - Imagen principal

    private var imagenPrincipal: some View {
        let ruta = vista == "montado" ? especie.imagenes.montado : especie.imagenes.lamina
        return Button {
            abrirVisor(vista == "montado" ? "montado" : "lamina")
        } label: {
            ZStack(alignment: .bottomTrailing) {
                Lamina(ruta: ruta, relacion: 4.0/3.0)
                if ruta != nil {
                    Text("Ampliar")
                        .font(.system(size: 11))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 9).padding(.vertical, 4)
                        .background(.black.opacity(0.6), in: Capsule())
                        .padding(10)
                }
            }
        }
        .buttonStyle(.tactil)
    }

    // MARK: - Encabezado

    private var encabezado: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(especie.nombre)
                .font(.binomio(27))
            if !especie.autoria.isEmpty {
                Text(especie.autoria)
                    .font(.system(size: 13, design: .serif))
                    .foregroundStyle(Paleta.papelTenue)
            }
            HStack(spacing: 8) {
                Insignia(texto: especie.familia, color: Paleta.familia(especie.familia))
                Insignia(texto: especie.subfamilia)
                if especie.endemica { Insignia(texto: "Endémica", color: Paleta.grana) }
            }
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
    }

    // MARK: - Identificación

    private var identificacion: some View {
        Seccion("Identificación") {
            VStack(alignment: .leading, spacing: 0) {
                Dato(
                    etiqueta: "Envergadura",
                    valor: especie.tamanoMM.max > 0 ? "\(Int(especie.tamanoMM.min))–\(Int(especie.tamanoMM.max)) mm" : "",
                    pendiente: especie.tamanoMM.max == 0
                )
                if !especie.nombresAlternos.isEmpty {
                    Dato(etiqueta: "Otros nombres", valor: especie.nombresAlternos.joined(separator: " · "))
                }
                if !especie.colores.isEmpty {
                    Dato(etiqueta: "Colores", valor: especie.colores.joined(separator: ", "))
                }
                Parrafo(texto: especie.descripcion).padding(.top, 10)
                if !especie.anverso.isEmpty { subDato("Anverso", especie.anverso) }
                if !especie.reverso.isEmpty { subDato("Reverso", especie.reverso) }
                if !especie.rasgos.isEmpty { subDato("Rasgos distintivos", especie.rasgos) }
            }
        }
    }

    private func subDato(_ etiqueta: String, _ texto: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Etiquetita(texto: etiqueta)
            Parrafo(texto: texto)
        }
        .padding(.top, 12)
    }

    // MARK: - Distribución

    private var distribucion: some View {
        Seccion("Distribución") {
            VStack(alignment: .leading, spacing: 12) {
                MapaZonasView(zonasElegidas: Set(especie.distribucion.zonas))
                if !especie.distribucion.zonas.isEmpty {
                    FlowLayout(spacing: 6) {
                        ForEach(especie.distribucion.zonas, id: \.self) { id in
                            Text(Catalogo.zonaPorId[id]?.nombre ?? id)
                                .font(.system(size: 12))
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(Paleta.atalaHondo)
                                .foregroundStyle(Paleta.papel)
                                .clipShape(Capsule())
                        }
                    }
                    Text("Provincias alcanzadas: \(Catalogo.provinciasDe(especie).joined(separator: ", "))")
                        .font(.system(size: 11)).foregroundStyle(Paleta.papelTenue)
                } else {
                    Text("Sin zonas asignadas todavía.")
                        .font(.system(size: 13)).foregroundStyle(Paleta.papelMedio)
                }
                if !especie.distribucion.nota.isEmpty {
                    Parrafo(texto: especie.distribucion.nota)
                }
            }
        }
    }

    // MARK: - Ciclo de vida

    private var cicloDeVida: some View {
        Seccion("Ciclo de vida") {
            VStack(alignment: .leading, spacing: 16) {
                if !especie.ciclo.hospederas.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Etiquetita(texto: "Plantas hospederas")
                        ForEach(especie.ciclo.hospederas, id: \.self) { h in
                            Text(h)
                                .font(.binomio(15))
                                .foregroundStyle(Paleta.atala)
                                .padding(.leading, 10)
                                .overlay(alignment: .leading) {
                                    Rectangle().fill(Paleta.atalaHondo).frame(width: 2)
                                }
                        }
                    }
                } else {
                    VStack(alignment: .leading, spacing: 4) {
                        Etiquetita(texto: "Plantas hospederas")
                        Text("Por documentar").font(.system(size: 13)).foregroundStyle(Paleta.papelTenue)
                    }
                }

                ForEach(ESTADIOS) { estadio in
                    HStack(alignment: .top, spacing: 12) {
                        RanuraFotoView(
                            archivoPropio: almacen.fotoEstadio(especie.id, estadio.clave),
                            rutaCatalogo: rutaCatalogoEstadio(estadio.clave),
                            onFoto: { data in almacen.guardarFotoEstadio(especie.id, estadio.clave, data: data); version += 1 },
                            onBorrar: almacen.fotoEstadio(especie.id, estadio.clave) != nil
                                ? { almacen.borrarFotoEstadio(especie.id, estadio.clave); version += 1 } : nil,
                            onAbrir: { abrirVisor(estadio.clave) }
                        )
                        VStack(alignment: .leading, spacing: 2) {
                            Etiquetita(texto: estadio.titulo)
                            Text(textoEstadio(estadio))
                                .font(.system(size: 13))
                                .foregroundStyle(especie.ciclo.notaHospederas.isEmpty && estadio.campo == nil ? Paleta.papelTenue : Paleta.papel)
                        }
                    }
                }

                Text("El punto amarillo marca las fotos que añadiste tú. Las que tomes en el campo se guardan en el teléfono y sustituyen a la del catálogo.")
                    .font(.system(size: 11)).foregroundStyle(Paleta.papelTenue)
            }
        }
        .id(version)
    }

    private func textoEstadio(_ e: EstadioInfo) -> String {
        let texto = e.campo != nil ? especie.ciclo[keyPath: e.campo!] : especie.ciclo.notaHospederas
        return texto.isEmpty ? "Por documentar" : texto
    }

    private func rutaCatalogoEstadio(_ clave: String) -> String? {
        switch clave {
        case "larva": return especie.imagenes.larva
        case "pupa": return especie.imagenes.pupa
        case "hospedera": return especie.imagenes.hospedera
        default: return nil
        }
    }

    // MARK: - Mis avistamientos

    private var misAvistamientos: some View {
        let avistamientos = almacen.avistamientosDe(especie.id)
        let lugares = almacen.conteoPorLugar(especie.id)

        return Seccion("Mis avistamientos", accion: {
            if !avistamientos.isEmpty {
                Text("\(avistamientos.count) en total")
                    .font(.system(size: 12)).foregroundStyle(Paleta.polen).monospacedDigit()
            }
        }) {
            if avistamientos.isEmpty {
                Text("Todavía no has anotado esta especie. Cuando la veas, usa el botón de abajo.")
                    .font(.system(size: 13)).foregroundStyle(Paleta.papelMedio)
            } else {
                VStack(alignment: .leading, spacing: 20) {
                    MapaAvistamientosView(avistamientos: avistamientos)

                    if !lugares.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Etiquetita(texto: "Por zona")
                            ForEach(lugares) { l in
                                HStack {
                                    Text(l.lugar).font(.system(size: 13))
                                    if let p = l.provincia, p != l.lugar {
                                        Text("· \(p)").font(.system(size: 13)).foregroundStyle(Paleta.papelTenue)
                                    }
                                    Spacer()
                                    Text("\(l.veces)")
                                        .font(.system(size: 12, weight: .semibold)).monospacedDigit()
                                        .foregroundStyle(Paleta.onAccento)
                                        .padding(.horizontal, 8).padding(.vertical, 1)
                                        .background(Paleta.polen).clipShape(Capsule())
                                }
                                .padding(.vertical, 6)
                                .overlay(alignment: .bottom) { Divider().overlay(Paleta.linea) }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Etiquetita(texto: "Registro")
                        ForEach(avistamientos) { a in
                            EtiquetaAvistamientoView(avistamiento: a,
                                onAbrirFoto: { abrirVisor("avist:\(a.id.uuidString)") },
                                onBorrar: { almacen.borrarAvistamiento(a.id); version += 1 })
                        }
                    }
                }
            }
        }
        .id(version)
    }

    // MARK: - Visor

    private func abrirVisor(_ clave: String) {
        var lista: [ImagenVisor] = []
        if let l = especie.imagenes.lamina { lista.append(ImagenVisor(id: "lamina", ruta: l, archivo: nil, pie: "Ejemplar vivo")) }
        if let m = especie.imagenes.montado { lista.append(ImagenVisor(id: "montado", ruta: m, archivo: nil, pie: "Ejemplar montado")) }
        for e in ESTADIOS {
            let propio = almacen.fotoEstadio(especie.id, e.clave)
            if let propio {
                lista.append(ImagenVisor(id: e.clave, ruta: nil, archivo: propio, pie: e.titulo))
            } else if let ruta = rutaCatalogoEstadio(e.clave) {
                lista.append(ImagenVisor(id: e.clave, ruta: ruta, archivo: nil, pie: e.titulo))
            }
        }
        for f in almacen.galeriaDe(especie.id) {
            lista.append(ImagenVisor(id: "galeria:\(f.id.uuidString)", ruta: nil, archivo: f.archivo, pie: f.pie.isEmpty ? "Foto tuya" : f.pie))
        }
        for a in almacen.avistamientosDe(especie.id) where a.fotoArchivo != nil {
            lista.append(ImagenVisor(id: "avist:\(a.id.uuidString)", ruta: nil, archivo: a.fotoArchivo, pie: a.lugar.isEmpty ? "Avistamiento" : a.lugar))
        }
        if let i = lista.firstIndex(where: { $0.id == clave }) {
            visor = (lista, i)
        }
    }
}

private struct VisorEnvoltorio: Identifiable {
    let imagenes: [ImagenVisor]
    let indice: Int
    var id: String { imagenes[safe: indice]?.id ?? "visor" }
}

private struct EtiquetaAvistamientoView: View {
    let avistamiento: Avistamiento
    var onAbrirFoto: () -> Void
    var onBorrar: () -> Void

    @EnvironmentObject private var almacen: Almacen

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if avistamiento.fotoArchivo != nil {
                Button(action: onAbrirFoto) {
                    if let archivo = avistamiento.fotoArchivo,
                       let ui = UIImage(contentsOfFile: almacen.rutaImagen(archivo).path) {
                        Image(uiImage: ui).resizable().aspectRatio(contentMode: .fill)
                            .frame(width: 52, height: 52).clipped()
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                    }
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(avistamiento.lugar.isEmpty ? (avistamiento.provincia ?? "Localidad sin especificar") : avistamiento.lugar)
                    .font(.system(size: 11, weight: .semibold))
                Text("\(avistamiento.fecha.formatted(date: .abbreviated, time: .shortened))")
                    .font(.system(size: 11)).foregroundStyle(.black.opacity(0.55))
                Text(avistamiento.capturada ? "Capturada" : "Observada")
                    .font(.system(size: 11)).foregroundStyle(.black.opacity(0.55))
                if !avistamiento.nota.isEmpty {
                    Text(avistamiento.nota).font(.system(size: 11)).foregroundStyle(.black.opacity(0.8))
                }
            }
            .foregroundStyle(Paleta.etiquetaTexto)
            Spacer()
            Button(action: onBorrar) {
                Image(systemName: "xmark").font(.system(size: 10)).foregroundStyle(.black.opacity(0.4))
            }
        }
        .padding(10)
        .background(Paleta.etiquetaFondo)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
