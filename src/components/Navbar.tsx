import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/Logo Geopatitas.png';

export default function Navbar() {
  const { user, isAuthenticated, isGuest, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="GeoPatitas"
              className="h-24 w-auto"
            />
          </Link>

          {/* Mis Reportes — solo cuando hay sesión */}
          {isAuthenticated && (
            <Link
              to="/mis-reportes"
              className="hidden md:block text-gray-600 hover:text-green-600 font-medium text-sm transition-colors"
            >
              Mis Reportes
            </Link>
          )}

          {/* Acciones de usuario */}
          <div className="flex items-center gap-3">
            {!isAuthenticated && !isGuest ? (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold border-2 border-[#78B864] text-[#78B864] rounded-full px-5 py-2 whitespace-nowrap transition-all hover:bg-[#78B864] hover:text-white"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-bold bg-[#EFBF5C] text-white border-2 border-[#EFBF5C] rounded-full px-5 py-2 whitespace-nowrap transition-all shadow-md hover:bg-[#E5B24A] hover:border-[#E5B24A]"
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-500">
                  {isGuest ? 'Modo Invitado' : `Hola, ${user?.name}`}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-semibold border-2 border-red-500 text-red-500 rounded-full px-5 py-2 whitespace-nowrap transition-all bg-transparent cursor-pointer hover:bg-red-500 hover:text-white"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
