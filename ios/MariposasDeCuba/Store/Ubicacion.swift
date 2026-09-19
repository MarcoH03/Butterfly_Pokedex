import CoreLocation
import Combine

/// Una sola lectura de GPS bajo demanda — se pide al anotar un
/// avistamiento, no se seguimiento continuo en segundo plano.
@MainActor
final class Ubicacion: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var coordenada: CLLocationCoordinate2D?
    @Published var buscando = false
    @Published var error: String?

    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func pedir() {
        error = nil
        buscando = true
        let estado = manager.authorizationStatus
        switch estado {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            buscando = false
            error = "Sin permiso de ubicación. Actívalo en Ajustes → Privacidad → Localización."
        default:
            manager.requestLocation()
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
                manager.requestLocation()
            } else if manager.authorizationStatus == .denied {
                buscando = false
                error = "Sin permiso de ubicación."
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            buscando = false
            coordenada = locations.first?.coordinate
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError err: Error) {
        Task { @MainActor in
            buscando = false
            error = "No se pudo obtener la ubicación."
        }
    }
}
