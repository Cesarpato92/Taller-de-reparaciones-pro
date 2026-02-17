import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ClienteConsulta from './views/ClienteConsulta';

/**
 * App Component
 * Orquestador principal de rutas y navegación global.
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

        {/* BARRA DE NAVEGACIÓN GLOBAL */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-[30px] py-3">
          <div className="flex justify-between items-center px-1">

            {/* LOGO */}
            <Link to="/" className="group flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:rotate-12 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic">
                PCEL <span className="text-blue-600 italic">MEDIC</span>
              </span>
            </Link>

            {/* ENLACES */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                Consulta de Clientes
              </Link>

              <Link
                to="/admin"
                className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
              >
                Acceso Admin
              </Link>
            </div>
          </div>
        </nav>

        {/* CONTENEDOR DE VISTAS (PÁGINAS) */}
        <main className="w-full p-[30px]">
          <Routes>
            {/* Ruta Pública: Donde el cliente busca su equipo */}
            <Route path="/" element={<ClienteConsulta />} />

            {/* Ruta Privada: El Portero (ProtectedRoute) decide si dejas pasar al Admin */}
            <Route path="/admin" element={<ProtectedRoute />} />

            {/* Opcional: Ruta 404 para errores de escritura */}
            <Route path="*" element={
              <div className="text-center mt-20">
                <h2 className="text-4xl font-black">404</h2>
                <p className="text-slate-500">Parece que este rincón del taller no existe.</p>
                <Link to="/" className="text-blue-600 underline font-bold mt-4 inline-block">Volver al inicio</Link>
              </div>
            } />
          </Routes>
        </main>

        {/* FOOTER SIMPLE */}
        <footer className="py-10 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} PCELMEDIC - Cesar Patiño - Todos los derechos reservados. <br />
          <span className="text-slate-500">"Reparando tu mundo, un equipo a la vez."</span>
        </footer>
      </div>
    </Router>
  );
}

export default App;