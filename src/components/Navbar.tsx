import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/Logo Geopatitas.png';

export default function Navbar() {
  const { user, isAuthenticated, isGuest, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 py-2">
            <img
              src={logo}
              alt="GeoPatitas"
              className="h-12 w-auto max-w-[150px] object-contain drop-shadow-md hover:drop-shadow-lg transition-all"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/mapa"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              Mapa
            </Link>
            <Link
              to="/reportar"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              Reportar
            </Link>

            {isAuthenticated && (
              <Link
                to="/mis-reportes"
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                Mis Reportes
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {!isAuthenticated && !isGuest ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {isGuest ? (
                    <span className="text-gray-600 text-sm">Modo Invitado</span>
                  ) : (
                    <span className="text-gray-700 font-medium">
                      Hola, {user?.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
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
