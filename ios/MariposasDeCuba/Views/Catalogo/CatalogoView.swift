import SwiftUI

/// Pantalla principal: cuadrícula de dos columnas con las fotos.
/// Arriba, buscador nativo, cambio de vista y filtros. Abajo, cuando
/// hace falta, la barra de selección manual.
struct CatalogoView: View {
    @EnvironmentObject private var almacen: Almacen
    @StateObject private var vm = EspeciesViewModel()
    @State private var filtrosAbiertos = false

    private let columnas = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]

    var body: some View {
        NavigationStack {
            ScrollView {
                cabeceraControles

                if vm.especies.isEmpty {
                    vacio
                } else {
                    LazyVGrid(columns: columnas, spacing: 8) {
                        ForEach(vm.especies) { especie in
                            if vm.modoSeleccion {
                                TarjetaEspecieView(
                                    especie: especie, vista: vm.vista,
                                    modoSeleccion: true,
                                    marcada: almacen.datos.seleccion.contains(especie.id),
                                    avistamientos: conteos[especie.id] ?? 0,
                                    onMarcar: { almacen.alternarSeleccion(especie.id) }
                                )
                            } else {
                                NavigationLink(value: especie.id) {
                                    TarjetaEspecieView(
                                        especie: especie, vista: vm.vista,
                                        modoSeleccion: false, marcada: false,
                                        avistamientos: conteos[especie.id] ?? 0,
                                        onMarcar: {}
                                    )
                                }
                                .buttonStyle(.tactil)
                            }
                        }
                    }
                    .padding(12)
                    .padding(.bottom, vm.modoSeleccion ? 80 : 0)
                }
            }
            .background(Paleta.sombra)
            .navigationTitle("Mariposas de Cuba")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $vm.consulta, placement: .navigationBarDrawer(displayMode: .always), prompt: "Buscar por nombre")
            .navigationDestination(for: Int.self) { id in
                if let especie = EspeciesViewModel.especiePorId(id) {
                    FichaView(especie: especie)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(vm.modoSeleccion ? "Listo" : "Escoger") {
                        vm.modoSeleccion.toggle()
                    }
                    .fontWeight(vm.modoSeleccion ? .semibold : .regular)
                    .tint(vm.modoSeleccion ? Paleta.atala : Paleta.papelMedio)
                }
            }
            .safeAreaInset(edge: .bottom) {
                if vm.modoSeleccion { barraSeleccion }
            }
            .sheet(isPresented: $filtrosAbiertos) {
                PanelFiltrosView(vm: vm)
            }
        }
    }

    private var conteos: [Int: Int] { almacen.conteoPorEspecie() }

    private var cabeceraControles: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                Picker("Vista", selection: $vm.vista) {
                    Text("Láminas").tag(EspeciesViewModel.Vista.laminas)
                    Text("Montados").tag(EspeciesViewModel.Vista.montados)
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 200)

                Spacer()

                Text(vm.especies.count == vm.total ? "\(vm.total) especies" : "\(vm.especies.count) de \(vm.total)")
                    .font(.system(size: 12))
                    .foregroundStyle(Paleta.papelTenue)
                    .monospacedDigit()

                Button {
                    filtrosAbiertos = true
                } label: {
                    Text(vm.filtros.cuenta > 0 ? "Filtrar · \(vm.filtros.cuenta)" : "Filtrar")
                        .font(.system(size: 13, weight: vm.filtros.cuenta > 0 ? .semibold : .regular))
                }
                .pildora(activa: vm.filtros.cuenta > 0)
            }

            if !vm.activos.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(vm.activos, id: \.valor) { filtro in
                            Button {
                                vm.quitarFiltro(clave: filtro.clave, valor: filtro.valor)
                            } label: {
                                HStack(spacing: 6) {
                                    Text(filtro.valor).font(.system(size: 12))
                                    Image(systemName: "xmark").font(.system(size: 9, weight: .bold)).opacity(0.7)
                                }
                                .foregroundStyle(Paleta.papel)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 5)
                                .background(Paleta.atalaHondo)
                                .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
    }

    private var vacio: some View {
        VStack(spacing: 12) {
            Text("Ninguna especie coincide")
                .font(.serifTitulo(17))
            Text(vm.consulta.isEmpty
                 ? "Los filtros activos no dejan pasar ninguna especie."
                 : "No hay resultados para «\(vm.consulta)». Prueba con el género o parte del nombre.")
                .font(.system(size: 13))
                .foregroundStyle(Paleta.papelMedio)
                .multilineTextAlignment(.center)
            Button("Quitar filtros") { vm.limpiarFiltros() }
                .font(.system(size: 13, weight: .semibold))
                .pildora(activa: true)
        }
        .padding(.horizontal, 32)
        .padding(.top, 80)
    }

    private var barraSeleccion: some View {
        HStack(spacing: 12) {
            Text(almacen.datos.seleccion.isEmpty
                 ? "Toca las especies que quieras reunir"
                 : "\(almacen.datos.seleccion.count) escogida\(almacen.datos.seleccion.count == 1 ? "" : "s")")
                .font(.system(size: 13))

            Spacer()

            if !almacen.datos.seleccion.isEmpty {
                Button("Vaciar") { almacen.limpiarSeleccion() }
                    .font(.system(size: 13))
                    .foregroundStyle(Paleta.papelMedio)

                Button(vm.soloSeleccion ? "Ver todas" : "Ver solo estas") {
                    vm.soloSeleccion.toggle()
                }
                .font(.system(size: 13, weight: .semibold))
                .pildora(activa: true)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.bar)
    }
}
