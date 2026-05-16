import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Brain, Bell, PawPrint, Search, Mail,
  Heart, Shield, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { colors, gradientDivider } from '../styles/theme';
import logo from '../assets/Logo Geopatitas.png';
import Footer from '../components/Footer';
import './Home.css';

// ─── Pasos del carrusel ──────────────────────────────────────────
const HOW_STEPS = [
  {
    Icon: PawPrint,
    color: colors.yellow,
    bg: 'rgba(239,191,92,0.13)',
    title: 'Reporta a tu mascota',
    desc: 'Sube una foto, escribe una descripción con sus características y marca en el mapa el lugar exacto donde lo viste por última vez.',
  },
  {
    Icon: Brain,
    color: colors.blue,
    bg: 'rgba(120,187,230,0.13)',
    title: 'La IA analiza tu reporte',
    desc: 'Nuestro motor de HuggingFace convierte la descripción en un vector semántico y lo almacena en la base de datos con pgvector.',
  },
  {
    Icon: Search,
    color: colors.green,
    bg: 'rgba(120,184,100,0.13)',
    title: 'Cruzamos datos en tiempo real',
    desc: 'PostGIS busca reportes en un radio de 5 km y la IA compara descripciones para encontrar coincidencias, aunque uses palabras distintas.',
  },
  {
    Icon: Mail,
    color: '#C084B8',
    bg: 'rgba(192,132,184,0.13)',
    title: 'Te avisamos al instante',
    desc: 'Cuando la similitud entre reportes supera el 85%, recibes un correo automático con los datos de contacto del otro usuario.',
  },
];

// ─── GeoJSON: máscara inversa ────────────────────────────────────
// Polígono CONVEXO — garantiza cero concavidades y cero gaps.
const WORLD: [number, number][] = [[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]];

const COVERAGE_ZONE: [number, number][] = [
  [-71.720, -32.940],  // NW
  [-71.555, -32.930],  // N  (costa Viña del Mar)
  [-71.430, -32.958],  // NE (norte Quilpué)
  [-71.375, -33.015],  // E
  [-71.375, -33.098],  // SE
  [-71.445, -33.148],  // S  (sur Quilpué)
  [-71.720, -33.112],  // SW (sur Valparaíso)
  [-71.720, -32.940],  // cierra
];

const inverseMask = {
  type: 'Feature' as const,
  geometry: { type: 'Polygon' as const, coordinates: [WORLD, COVERAGE_ZONE] },
  properties: {},
};

// ─── Fotos de mascotas ───────────────────────────────────────────
const PET_IMGS = [
  { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80', alt: 'Golden retriever' },
  { url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80', alt: 'Perro labrador' },
  { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80', alt: 'Gato callejero' },
];

// ─── Componente ──────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % HOW_STEPS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const { Icon: StepIcon, color, bg, title, desc } = HOW_STEPS[step];

  return (
    <div className="home">

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="home-hero__inner">

          <div className="home-hero__content">
            <span className="coverage-badge">
              <Shield size={12} /> Valparaíso · Viña del Mar · Quilpué — V Región
            </span>

            <h1 className="home-hero__title">
              Juntos es más fácil{' '}
              <span className="home-hero__gradient-text">encontrar a tu mascota</span>
            </h1>

            <p className="home-hero__subtitle">
              Plataforma con <strong>inteligencia artificial y geolocalización</strong> para
              reunir familias con sus mascotas perdidas en la V Región de Chile.
            </p>

            <div>
              <Link to="/reportar" className="btn-primary">
                <Heart size={20} fill="white" /> Perdí a mi mascota
              </Link>
            </div>

            <div className="home-hero__ctas">
              <Link to="/reportar?type=found" className="btn-outline-green">
                <Search size={15} /> Encontré una mascota
              </Link>
              <Link to="/mapa" className="btn-outline-blue">
                <MapPin size={15} /> Ver Mapa
              </Link>
            </div>
          </div>

          <div className="home-hero__image">
            <img src={logo} alt="GeoPatitas" className="home-hero__img" />
          </div>

        </div>
      </section>

      {/* ── ESTADÍSTICAS ── */}
      <section className="home-stats">
        <div className="home-stats__grid">
          {[
            { Icon: MapPin,   value: '3',    label: 'Comunas cubiertas',    color: colors.blue   },
            { Icon: Bell,     value: '24/7', label: 'Monitoreo activo',     color: colors.green  },
            { Icon: Brain,    value: '85%',  label: 'Precisión de alertas', color: colors.yellow },
          ].map(({ Icon, value, label, color }) => (
            <div key={label} className="home-stats__item">
              <Icon size={20} color={color} />
              <span className="home-stats__value" style={{ color }}>{value}</span>
              <span className="home-stats__label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CARACTERÍSTICAS ── */}
      <section className="home-features">
        <div className="home-features__inner">
          <h2 className="section-title">Tecnología al servicio del reencuentro</h2>
          <div style={gradientDivider} />

          <div className="home-features__cards">
            {[
              { Icon: MapPin, color: colors.green,  bg: 'rgba(120,184,100,0.1)',  title: 'Georreferenciación',      desc: 'Marca exactamente dónde viste la mascota. El sistema monitorea automáticamente un radio de 5 km.' },
              { Icon: Brain,  color: colors.blue,   bg: 'rgba(120,187,230,0.1)',  title: 'Inteligencia Artificial', desc: 'La IA compara descripciones semánticamente, encontrando coincidencias aunque se usen palabras distintas.' },
              { Icon: Bell,   color: colors.yellow, bg: 'rgba(239,191,92,0.1)',   title: 'Alertas Inmediatas',      desc: 'Recibes un correo automático cuando detectamos una coincidencia mayor al 85%, sin tener que estar pendiente.' },
            ].map(({ Icon, color, bg, title, desc }) => (
              <div key={title} className="feature-card" style={{ borderTop: `4px solid ${color}` }}>
                <div className="feature-card__icon" style={{ background: bg }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 className="feature-card__title">{title}</h3>
                <p className="feature-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARRUSEL "¿CÓMO FUNCIONA?" ── */}
      <section className="home-how">
        <div className="home-how__inner">
          <h2 className="home-how__title">¿Cómo funciona?</h2>
          <div style={gradientDivider} />

          <div className="carousel">
            <div className="carousel__content" key={step}>
              <div className="carousel__icon-wrap" style={{ background: bg }}>
                <StepIcon size={34} color={color} />
              </div>
              <div className="carousel__step-label" style={{ color }}>
                Paso {step + 1} de {HOW_STEPS.length}
              </div>
              <h3 className="carousel__title">{title}</h3>
              <p className="carousel__desc">{desc}</p>
            </div>
          </div>

          <div className="carousel__controls">
            <button className="carousel__arrow" onClick={() => setStep(s => (s - 1 + HOW_STEPS.length) % HOW_STEPS.length)}>
              <ChevronLeft size={17} />
            </button>
            {HOW_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`carousel__dot ${i === step ? 'carousel__dot--active' : 'carousel__dot--inactive'}`}
              />
            ))}
            <button className="carousel__arrow" onClick={() => setStep(s => (s + 1) % HOW_STEPS.length)}>
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* ── MAPA DE COBERTURA ── */}
      <section className="home-map">
        <div className="home-map__inner">
          <h2 className="section-title">Cobertura activa en la V Región</h2>
          <p className="section-subtitle">
            Las zonas fuera del área de cobertura aparecen oscurecidas temporalmente.
          </p>

          <div className="home-map__container">
            <MapContainer
              center={[-33.04, -71.52]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <GeoJSON
                data={inverseMask as any}
                style={{ fillColor: '#1a2035', fillOpacity: 0.58, color: 'transparent', weight: 0 }}
              />
            </MapContainer>
          </div>

          <div className="home-map__cta">
            <Link to="/mapa" className="home-map__cta-btn">
              Explorar el mapa completo <MapPin size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOTOS MASCOTAS ── */}
      <section className="home-pets">
        <div className="home-pets__inner">
          <h2 className="section-title">Cada mascota cuenta</h2>
          <p className="section-subtitle">
            Sabemos lo difícil que es. Estamos aquí para ayudarte a reencontrarte con quien más quieres.
          </p>

          <div className="home-pets__grid">
            {PET_IMGS.map((img, i) => (
              <div key={i} className="home-pets__img-wrap">
                <img src={img.url} alt={img.alt} className="home-pets__img" loading="lazy" />
                <div className="home-pets__overlay">
                  <PawPrint size={30} color="white" />
                  <span className="home-pets__overlay-text">
                    ¿La conoces?<br />Ayúdanos a encontrarla
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
