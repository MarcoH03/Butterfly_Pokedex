import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import Salvavidas from './components/Salvavidas'
import './index.css'

/*
  Punto de entrada. React toma el control del <div id="root">.

  basename: en GitHub Pages la app no vive en la raíz del dominio,
  así que el enrutador necesita saber el prefijo. Vite lo expone
  en import.meta.env.BASE_URL, que sale de `base` en vite.config.js.
*/
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* Contiene los fallos de renderizado: sin esto, un error deja
          la pantalla en blanco y hay que cerrar la app. */}
      <Salvavidas>
        <App />
      </Salvavidas>
    </BrowserRouter>
  </React.StrictMode>
)
