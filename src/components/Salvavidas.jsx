import { Component } from 'react'

/* ══════════════════════════════════════════════════════════════
   Salvavidas — frontera de error.

   Sin esto, cualquier fallo al pintar deja el árbol de React
   desmontado: la pantalla se queda en blanco, no responde a nada y
   hay que cerrar la app. Ya pasó una vez, con un filtro que leía
   una lista que había dejado de existir.

   Con esto, el fallo se queda contenido: se ve qué pasó y hay un
   botón para volver. Los datos del teléfono no se tocan.

   Tiene que ser una clase: los hooks no pueden capturar errores de
   renderizado.
   ══════════════════════════════════════════════════════════════ */

export default class Salvavidas extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Queda en la consola de Safari, que es donde se puede leer
    // cuando pasa en el teléfono.
    console.error('Fallo al pintar:', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          padding: 'var(--e-6)',
          gap: 'var(--e-4)',
          maxWidth: 480, margin: '0 auto'
        }}
      >
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'var(--t-21)', fontWeight: 600 }}>
          Algo se rompió
        </h1>

        <p style={{ fontSize: 'var(--t-13)', color: 'var(--papel-medio)', lineHeight: 1.6 }}>
          Fue un fallo al dibujar la pantalla. Tus avistamientos, notas y fotos
          están intactos: viven aparte, en el teléfono.
        </p>

        <pre
          style={{
            fontSize: 'var(--t-11)',
            lineHeight: 1.5,
            color: 'var(--grana)',
            background: 'var(--sombra-alt)',
            padding: 'var(--e-3)',
            borderRadius: 'var(--r-panel)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 160,
            overflowY: 'auto'
          }}
        >
          {String(error?.message || error)}
        </pre>

        <div style={{ display: 'flex', gap: 'var(--e-2)' }}>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              flex: 1, padding: 13,
              fontSize: 'var(--t-13)', fontWeight: 600,
              color: 'var(--sombra)', background: 'var(--atala)',
              borderRadius: 'var(--r-control)'
            }}
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => { window.location.href = import.meta.env.BASE_URL }}
            style={{
              flex: 1, padding: 13,
              fontSize: 'var(--t-13)',
              color: 'var(--papel)', background: 'var(--sombra-alt)',
              borderRadius: 'var(--r-control)',
              boxShadow: 'inset 0 0 0 1px var(--linea)'
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }
}
