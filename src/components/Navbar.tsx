import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import logo from '../assets/Logo Geopatitas.png';
import './Navbar.css';

type Notif = {
  id: string;
  petReportado: { id: string; nombre: string | null; especie: string };
  petCoincidencia: { id: string; nombre: string | null; especie: string };
  porcentajeSimilitud: number;
  distanciaKm?: number;
  leida: boolean;
  fechaCreacion: string;
};

export default function Navbar() {
  const { user, isAuthenticated, isGuest, logout } = useAuth();

  const [unreadCount,    setUnreadCount]    = useState(0);
  const [notifs,         setNotifs]         = useState<Notif[]>([]);
  const [bellOpen,       setBellOpen]       = useState(false);
  const [loadingNotifs,  setLoadingNotifs]  = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Cargar conteo de no leídas al iniciar sesión
  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    api.get('/notifications/unread-count')
      .then(({ data }) => setUnreadCount(data.count ?? 0))
      .catch(() => {});
  }, [isAuthenticated]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = async () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    if (!opening) return;
    setLoadingNotifs(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
    } catch {
      setNotifs([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkRead = async (notif: Notif) => {
    if (notif.leida) return;
    try {
      await api.put(`/notifications/${notif.id}/read`);
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const formatNotifDate = (iso: string) =>
    new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-[1000] border-b border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="GeoPatitas" className="h-24 w-auto" />
          </Link>

          {/* Centro: Mis Reportes + campanita */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/mis-reportes"
                className="text-gray-600 hover:text-green-600 font-medium text-sm transition-colors"
              >
                Mis Reportes
              </Link>

              {/* Campanita */}
              <div className="notif-bell-wrap" ref={bellRef}>
                <button
                  className="notif-bell-btn"
                  onClick={handleBellClick}
                  aria-label="Notificaciones"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {bellOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown__header">
                      <span className="notif-dropdown__title">Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="notif-dropdown__count">{unreadCount} nuevas</span>
                      )}
                    </div>

                    {loadingNotifs && (
                      <div className="notif-dropdown__empty">Cargando...</div>
                    )}

                    {!loadingNotifs && notifs.length === 0 && (
                      <div className="notif-dropdown__empty">No tienes notificaciones aún.</div>
                    )}

                    {!loadingNotifs && notifs.map(n => (
                      <button
                        key={n.id}
                        className={`notif-item${n.leida ? ' notif-item--read' : ''}`}
                        onClick={() => handleMarkRead(n)}
                      >
                        <div className="notif-item__body">
                          <p className="notif-item__text">
                            Tu mascota <strong>{n.petReportado.nombre || n.petReportado.especie}</strong> tiene una coincidencia del{' '}
                            <strong>{Math.round(n.porcentajeSimilitud)}%</strong> con{' '}
                            <strong>{n.petCoincidencia.nombre || n.petCoincidencia.especie}</strong>
                            {n.distanciaKm != null && (
                              <>, a <strong>{n.distanciaKm < 1
                                ? `${Math.round(n.distanciaKm * 1000)} m`
                                : `${n.distanciaKm.toFixed(1)} km`}</strong> de tu reporte</>
                            )}.
                          </p>
                          <p className="notif-item__date">{formatNotifDate(n.fechaCreacion)}</p>
                        </div>
                        {!n.leida && <span className="notif-item__dot" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
