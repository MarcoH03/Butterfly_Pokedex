import { Routes, Route, Navigate } from 'react-router-dom'
import Laminas from './pages/Laminas'
import Ficha from './pages/Ficha'

/*
  Dos pantallas:
    /              -> catálogo (cuadrícula de láminas)
    /especie/:id   -> ficha de una especie

  Cualquier otra ruta vuelve al catálogo.
*/
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Laminas />} />
      <Route path="/especie/:id" element={<Ficha />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
