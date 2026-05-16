import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">

          <div>
            <div className="site-footer__brand-name">GeoPatitas</div>
            <p className="site-footer__brand-desc">
              Plataforma de geolocalización para mascotas perdidas en la V Región, Chile.
            </p>
          </div>

          <div>
            <div className="site-footer__nav-heading">Navegación</div>
            <div className="site-footer__nav-links">
              {[
                { to: '/',         label: 'Inicio'         },
                { to: '/mapa',     label: 'Mapa'           },
                { to: '/reportar', label: 'Reportar'       },
                { to: '/login',    label: 'Iniciar Sesión' },
                { to: '/register', label: 'Registrarse'    },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="site-footer__nav-link">{label}</Link>
              ))}
            </div>
          </div>

          <div className="site-footer__duoc">
            <div className="site-footer__duoc-badge">DuocUC</div>
            <p className="site-footer__duoc-text">Proyecto Educativo</p>
            <p className="site-footer__duoc-subtext">TPY1101 · DuocUC 2026</p>
          </div>

        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__credits">
            Creado por <strong>Simón Villar</strong> y <strong>Carlos Muñoz</strong>
          </p>
          <p className="site-footer__copy">© 2026 GeoPatitas</p>
        </div>
      </div>
    </footer>
  );
}
