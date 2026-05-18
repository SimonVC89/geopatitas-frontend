import { useState, useEffect } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import {
  MapContainer, TileLayer, Marker, Popup, GeoJSON, Circle, Polyline, useMapEvents, useMap,
} from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Joyride, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import type { EventData, Step } from 'react-joyride'; // Step se usa dentro del componente
import 'leaflet/dist/leaflet.css';
import { MapPin, SlidersHorizontal, Search, ChevronDown, Upload, CheckCircle, PawPrint } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import Footer from '../components/Footer';
import './Map.css';

// ─── Iconos ──────────────────────────────────────────────────────

const pawIcon = new DivIcon({
  html: '<div class="paw-marker-icon">🐾</div>',
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const lupaIcon = new DivIcon({
  html: '<div class="lupa-marker-icon">🔍</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const foundMarkerIcon = new DivIcon({
  html: `<div class="status-marker status-marker--found"><div class="status-marker__circle">!</div><div class="status-marker__tip"></div></div>`,
  className: '',
  iconSize: [32, 44],
  iconAnchor: [16, 44],
});

const lostMarkerIcon = new DivIcon({
  html: `<div class="status-marker status-marker--lost"><div class="status-marker__circle">?</div><div class="status-marker__tip"></div></div>`,
  className: '',
  iconSize: [32, 44],
  iconAnchor: [16, 44],
});

// ─── Constantes ──────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [-33.04, -71.52];
const DEFAULT_ZOOM = 11;

// ─── Máscara inversa ─────────────────────────────────────────────
const WORLD: [number, number][] = [[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]];
const COVERAGE_ZONE: [number, number][] = [
  [-71.720, -32.940],
  [-71.555, -32.930],
  [-71.430, -32.958],
  [-71.375, -33.015],
  [-71.375, -33.098],
  [-71.445, -33.148],
  [-71.720, -33.112],
  [-71.720, -32.940],
];
const inverseMask = {
  type: 'Feature' as const,
  geometry: { type: 'Polygon' as const, coordinates: [WORLD, COVERAGE_ZONE] },
  properties: {},
};

const mockMyReports = [
  { id: 'm1', type: 'found' as const, status: 'active' as const, position: [-33.055, -71.61] as [number,number], petName: 'Desconocido', description: 'Perro blanco con mancha negra' },
];

// ─── Emoji por especie ───────────────────────────────────────────
const especieEmoji = (e: string) =>
  ({ Perro: '🐶', Gato: '🐱', Ave: '🐦', Conejo: '🐰' }[e] ?? '🐾');

// ─── Tipo de display normalizado ─────────────────────────────────
type ReportDisplay = {
  id: string;
  type: 'found' | 'lost';
  status: 'active' | 'resolved';
  especie: string;
  color: string;
  tamano: string;
  fecha: string;
  contactoName: string;
  contacto: string;
  contactoPhone: string;
  position: [number, number];
  petName: string;
  description: string;
  fotos: string[];
};

const normalizeWord = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

const normalizeApiPet = (r: any): ReportDisplay => ({
  id: String(r.id),
  type: r.tipoReporte === 'ENCONTRADO' ? 'found' : 'lost',
  status: r.estado === 'ACTIVO' ? 'active' : 'resolved',
  especie: r.especie ? normalizeWord(r.especie) : 'Desconocido',
  color: r.color ? normalizeWord(r.color) : 'Desconocido',
  tamano: r.tamano ? normalizeWord(r.tamano) : 'Desconocido',
  fecha: r.fechaReporte
    ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(r.fechaReporte))
    : 'Sin fecha',
  contactoName: r.contactoNombre ?? r.user?.nombre ?? '',
  contacto: r.contactoEmail ?? r.user?.email ?? '',
  contactoPhone: r.contactoTelefono ?? r.user?.telefono ?? '',
  position: [r.latitud, r.longitud],
  petName: r.nombre || 'Desconocido',
  description: r.descripcion ?? '',
  fotos: r.fotos ?? [],
});

// ─── Opciones de filtros ─────────────────────────────────────────
const ESPECIES = ['Todos', 'Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];
const FECHAS   = ['Cualquier fecha', 'Hoy', 'Esta semana', 'Este mes'];
const TAMANOS  = ['Todos', 'Pequeño', 'Mediano', 'Grande'];
const COLORES  = ['Todos', 'Blanco', 'Negro', 'Marrón', 'Amarillo', 'Gris', 'Naranja', 'Multicolor'];
const ESTADOS  = ['Activo', 'Resuelto'];


// ─── Title Case automático ───────────────────────────────────────
const toTitleCase = (str: string) =>
  str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ─── MapClickHandler (debe estar dentro de MapContainer) ─────────
function MapClickHandler({ active, onPlace }: { active: boolean; onPlace: (pos: [number,number]) => void }) {
  useMapEvents({
    click(e) {
      if (active) onPlace([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// ─── FitBounds (ajusta la vista para mostrar ambos puntos) ────────
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [80, 80], maxZoom: 16 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─── Tipo para modo vista de coincidencia ─────────────────────────
type MatchViewData = {
  myPet: {
    id: string; tipoReporte: string; nombre: string | null; especie: string;
    raza: string | null; color: string | null; tamano: string | null;
    descripcion: string; fotos: string[]; latitud: number; longitud: number;
    estado: string; fechaReporte: string;
  };
  matchedPet: {
    id: string; tipoReporte: string; nombre: string | null; especie: string;
    raza: string | null; color: string | null; tamano: string | null;
    descripcion: string; fotos: string[]; latitud?: number; longitud?: number;
    distanciaKm?: number; porcentajeSimilitud?: number;
    contactoNombre?: string; contactoEmail?: string; contactoTelefono?: string;
  };
};

// ─── Icono "mi reporte" en match view ────────────────────────────
const myPetMatchIcon = new DivIcon({
  html: '<div class="match-my-marker">👤</div>',
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// ─── Badge de distancia en el punto medio ────────────────────────
const makeDistanceIcon = (label: string) => new DivIcon({
  html: `<div class="match-distance-badge">↔ ${label}</div>`,
  className: '',
  iconSize: [110, 30],
  iconAnchor: [55, 15],
});

// ─── Haversine (distancia en km entre dos coordenadas) ───────────
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Componente principal ────────────────────────────────────────
export default function Map() {
  const { isAuthenticated } = useAuth();
  const navigate        = useNavigate();
  const routerLocation  = useRouterLocation();

  // Pasos Joyride según rol (definidos aquí para acceder a isAuthenticated)
  const STEP_FORM = isAuthenticated ? 1 : 0;
  const JOYRIDE_STEPS: Step[] = [
    ...(isAuthenticated ? [{
      target: '.sidebar-radius',
      title: '📏 Radio de búsqueda',
      content: 'Ajusta el área de búsqueda alrededor del punto que marcaste. Haz clic en Siguiente cuando estés listo.',
      placement: 'right' as const,
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['primary', 'skip'] as any,
    }] : []),
    {
      target: '.sidebar-report-form',
      title: '📋 Datos del animal',
      content: 'Completa los datos de la mascota. Sube una foto si puedes, ayuda mucho.',
      placement: 'right' as const,
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: [] as any,
    },
  ];

  // Paw & radius
  const [isPlacingPaw, setIsPlacingPaw] = useState(false);
  const [pawPosition,  setPawPosition]  = useState<[number,number]|null>(null);
  const [radius,       setRadius]       = useState(1);

  // Filtros
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [filterTipo,    setFilterTipo]    = useState<'all'|'lost'|'found'>('all');
  const [filterEspecie, setFilterEspecie] = useState('Todos');
  const [filterNombre,  setFilterNombre]  = useState('');
  const [filterFecha,   setFilterFecha]   = useState('Cualquier fecha');
  const [filterTamano,  setFilterTamano]  = useState('Todos');
  const [filterColor,   setFilterColor]   = useState('Todos');
  const [filterEstado,  setFilterEstado]  = useState('Activo');

  // Mis reportes
  const [showMyReports, setShowMyReports] = useState(false);
  const [guestMessage,  setGuestMessage]  = useState(false);

  // Modo exploración
  const [exploreMode,      setExploreMode]      = useState(false);
  const [filtersApplied,   setFiltersApplied]   = useState(false);

  // Guías de sidebar
  const [showExploreGuide, setShowExploreGuide] = useState(false);
  const [showReportGuide,  setShowReportGuide]  = useState(false);

  // Joyride & flujo de reporte
  const [showGuestInfo,  setShowGuestInfo]  = useState(false);
  const [joyrideRun,     setJoyrideRun]     = useState(false);
  const [joyrideStep,    setJoyrideStep]    = useState(0);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportForm,     setReportForm]     = useState({
    tipo: 'found' as 'found' | 'lost',
    nombreDesconocido: true,
    nombre: '', especie: '', color: '', tamano: '', raza: '', sexo: '', descripcion: '', foto: null as File|null, email: '',
  });
  const [reportSuccess,     setReportSuccess]     = useState(false);
  const [submittingReport,  setSubmittingReport]  = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDisplay | null>(null);
  const [lightboxSrc,   setLightboxSrc]   = useState<string | null>(null);

  // Modo selector de ubicación (desde /reportar)
  const [locationPickerMode,   setLocationPickerMode]   = useState(false);
  const [showLocationConfirm,  setShowLocationConfirm]  = useState(false);

  // Modo vista de coincidencia (desde /mis-reportes → match)
  const [matchViewData, setMatchViewData] = useState<MatchViewData | null>(null);

  useEffect(() => {
    const state = routerLocation.state as { pickingLocation?: boolean; matchView?: MatchViewData } | null;
    if (state?.pickingLocation) {
      setLocationPickerMode(true);
      setIsPlacingPaw(true);
    }
    if (state?.matchView) {
      setMatchViewData(state.matchView);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reportes reales desde la API (el backend ya filtra por radio y demás parámetros)
  const [apiReports,    setApiReports]    = useState<ReportDisplay[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError,   setSearchError]   = useState<string | null>(null);

  // Solo filtra por nombre en cliente (el resto va al backend)
  const filteredExplore = (exploreMode && filtersApplied)
    ? apiReports.filter(r =>
        !filterNombre || r.petName.toLowerCase().includes(filterNombre.toLowerCase())
      )
    : [];

  // ── Handlers ─────────────────────────────────────────────────
  const handleFabClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowReportGuide(false);
    setExploreMode(false);
    setFiltersApplied(false);
    setPawPosition(null);
    setReportFormOpen(false);
    setJoyrideRun(false);
    setJoyrideStep(0);
    if (!isAuthenticated) {
      setShowGuestInfo(true); // modal custom — no Joyride
    } else {
      setIsPlacingPaw(true);  // registrado: directo al banner del mapa
    }
  };

  const handleGuestInfoContinue = () => {
    setShowGuestInfo(false);
    setIsPlacingPaw(true);    // ahora sí activa el banner del mapa
  };

  const handleMapPlace = (pos: [number,number]) => {
    setPawPosition(pos);
    setIsPlacingPaw(false);
    if (locationPickerMode) { setShowLocationConfirm(true); return; }
    if (exploreMode) return;
    setReportFormOpen(true);
    setJoyrideStep(STEP_FORM);
    setJoyrideRun(true);
  };

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, action, index } = data;

    if (
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED  ||
      action === ACTIONS.CLOSE
    ) {
      setJoyrideRun(false);
      setReportFormOpen(false);
      setIsPlacingPaw(false);
      setJoyrideStep(0);
      return;
    }
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      if (isAuthenticated && index === 0) setReportFormOpen(true);
      setJoyrideStep(index + 1);
    }
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
      if (isAuthenticated && index === STEP_FORM) setReportFormOpen(false);
      setJoyrideStep(index - 1);
    }
  };

  const handleCancelReport = () => {
    setReportFormOpen(false);
    setJoyrideRun(false);
    setIsPlacingPaw(false);
    setJoyrideStep(0);
  };

  const handleSearch = async () => {
    if (!pawPosition) return;
    setLoadingSearch(true);
    setSearchError(null);
    try {
      const params: Record<string, string | number> = {
        lat: pawPosition[0],
        lng: pawPosition[1],
        radius: Math.round(radius * 1000),
      };
      if (filterTipo !== 'all')       params.tipoReporte = filterTipo === 'found' ? 'ENCONTRADO' : 'PERDIDO';
      if (filterEspecie !== 'Todos')  params.especie     = filterEspecie;
      if (filterEstado === 'Activo')  params.estado      = 'ACTIVO';
      if (filterEstado === 'Resuelto') params.estado     = 'RESUELTO';
      if (filterColor !== 'Todos')    params.color       = filterColor;
      if (filterTamano !== 'Todos')   params.tamano      = filterTamano;

      const { data } = await api.get('/pets/nearby', { params });
      setApiReports((data as any[]).map(normalizeApiPet));
      setFiltersApplied(true);
    } catch {
      setSearchError('No se pudo conectar con el servidor. Intenta nuevamente.');
      setApiReports([]);
      setFiltersApplied(true);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportForm.especie) { alert('Por favor selecciona la especie.'); return; }
    if (!reportForm.descripcion.trim()) { alert('Por favor agrega una descripción.'); return; }
    if (!isAuthenticated && !reportForm.email.trim()) { alert('Por favor ingresa tu email de contacto.'); return; }

    setSubmittingReport(true);
    try {
      let fotosUrls: string[] = [];
      if (reportForm.foto && isAuthenticated) {
        try {
          const fd = new FormData();
          fd.append('file', reportForm.foto);
          const { data: up } = await api.post('/pets/upload-image', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (up?.url) fotosUrls = [up.url];
        } catch { /* continúa sin foto si falla el upload */ }
      }

      const base = {
        tipoReporte: (isAuthenticated ? reportForm.tipo : 'found') === 'found' ? 'ENCONTRADO' : 'PERDIDO',
        nombre: reportForm.nombreDesconocido ? null : reportForm.nombre || null,
        especie: reportForm.especie,
        color: reportForm.color || null,
        tamano: reportForm.tamano || null,
        raza: reportForm.raza || null,
        sexo: reportForm.sexo || null,
        descripcion: reportForm.descripcion,
        fotos: fotosUrls,
        latitud: pawPosition?.[0] ?? null,
        longitud: pawPosition?.[1] ?? null,
      };

      if (isAuthenticated) {
        await api.post('/pets', base);
      } else {
        await api.post('/pets/guest', { ...base, contactoEmail: reportForm.email });
      }

      setJoyrideRun(false);
      setReportFormOpen(false);
      setJoyrideStep(0);
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 5000);
    } catch (err: any) {
      setJoyrideRun(false);
      setJoyrideStep(0);
      setReportFormOpen(false);
      const msg = err.response?.data?.message ?? 'Error al enviar el reporte. Intenta nuevamente.';
      alert(msg);
    } finally {
      setSubmittingReport(false);
    }
  };

  // ── Datos derivados del match view (calculados antes del render) ──
  const matchView = (() => {
    if (!matchViewData || matchViewData.matchedPet.latitud == null || matchViewData.matchedPet.longitud == null) return null;
    const myPos:    [number, number] = [matchViewData.myPet.latitud,      matchViewData.myPet.longitud];
    const matchPos: [number, number] = [matchViewData.matchedPet.latitud!, matchViewData.matchedPet.longitud!];
    const midPos:   [number, number] = [(myPos[0] + matchPos[0]) / 2,     (myPos[1] + matchPos[1]) / 2];
    const km = matchViewData.matchedPet.distanciaKm
      ?? haversineKm(myPos[0], myPos[1], matchPos[0], matchPos[1]);
    const distLabel = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

    const myPetDisplay: ReportDisplay = {
      id:           matchViewData.myPet.id,
      type:         matchViewData.myPet.tipoReporte === 'ENCONTRADO' ? 'found' : 'lost',
      status:       matchViewData.myPet.estado === 'ACTIVO' ? 'active' : 'resolved',
      especie:      matchViewData.myPet.especie,
      color:        matchViewData.myPet.color  ? normalizeWord(matchViewData.myPet.color)  : 'Desconocido',
      tamano:       matchViewData.myPet.tamano ? normalizeWord(matchViewData.myPet.tamano) : 'Desconocido',
      fecha:        matchViewData.myPet.fechaReporte
        ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(matchViewData.myPet.fechaReporte))
        : 'Sin fecha',
      contactoName: 'Tu reporte',
      contacto:     '',
      contactoPhone:'',
      position:     myPos,
      petName:      matchViewData.myPet.nombre ?? 'Desconocido',
      description:  matchViewData.myPet.descripcion,
      fotos:        matchViewData.myPet.fotos,
    };

    const matchedPetDisplay: ReportDisplay = {
      id:           matchViewData.matchedPet.id,
      type:         matchViewData.matchedPet.tipoReporte === 'ENCONTRADO' ? 'found' : 'lost',
      status:       'active',
      especie:      matchViewData.matchedPet.especie,
      color:        matchViewData.matchedPet.color  ? normalizeWord(matchViewData.matchedPet.color)  : 'Desconocido',
      tamano:       matchViewData.matchedPet.tamano ? normalizeWord(matchViewData.matchedPet.tamano) : 'Desconocido',
      fecha:        'Sin fecha',
      contactoName: matchViewData.matchedPet.contactoNombre  ?? '',
      contacto:     matchViewData.matchedPet.contactoEmail   ?? '',
      contactoPhone:matchViewData.matchedPet.contactoTelefono ?? '',
      position:     matchPos,
      petName:      matchViewData.matchedPet.nombre ?? 'Desconocido',
      description:  matchViewData.matchedPet.descripcion,
      fotos:        matchViewData.matchedPet.fotos,
    };

    return { myPos, matchPos, midPos, distLabel, myPetDisplay, matchedPetDisplay };
  })();

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <Joyride
        steps={JOYRIDE_STEPS}
        run={joyrideRun}
        stepIndex={joyrideStep}
        continuous
        scrollToFirstStep={false}
        onEvent={handleJoyrideCallback}
        options={{ primaryColor: '#78B864', zIndex: 10000 }}
        locale={{ back: 'Atrás', close: 'Cerrar', last: 'Finalizar', next: 'Siguiente', skip: 'Cancelar' }}
      />

      {showGuestInfo && (
        <div className="guest-info-overlay">
          <div className="guest-info-card">
            <div className="guest-info-icon">👤</div>
            <h3 className="guest-info-title">Estás navegando como invitado</h3>
            <p className="guest-info-body">
              Como invitado solo puedes reportar mascotas <strong>encontradas</strong>.
              Para reportar una mascota perdida, necesitas{' '}
              <a href="/register" className="guest-info-link">registrarte</a>.
            </p>
            <div className="guest-info-actions">
              <button className="guest-info-btn-primary" onClick={handleGuestInfoContinue}>
                Entendido, continuar
              </button>
              <button className="guest-info-btn-cancel" onClick={() => setShowGuestInfo(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationConfirm && pawPosition && (
        <div className="location-confirm-overlay">
          <div className="location-confirm-card">
            <div className="location-confirm-icon">📍</div>
            <h3 className="location-confirm-title">¿Confirmas esta ubicación?</h3>
            <p className="location-confirm-body">
              El reporte quedará asociado al punto que marcaste en el mapa.
            </p>
            <div className="location-confirm-actions">
              <button
                className="location-confirm-btn-yes"
                onClick={() => navigate('/reportar', { state: { lat: pawPosition[0], lng: pawPosition[1] } })}
              >
                Sí, es correcta
              </button>
              <button
                className="location-confirm-btn-no"
                onClick={() => { setShowLocationConfirm(false); setPawPosition(null); setIsPlacingPaw(true); }}
              >
                No, elegir otra
              </button>
            </div>
          </div>
        </div>
      )}

      {showExploreGuide && (
        <div className="explore-guide-overlay" onClick={() => setShowExploreGuide(false)} />
      )}

      {showReportGuide && (
        <>
          <div className="report-guide-overlay" onClick={() => setShowReportGuide(false)} />
          <div className="report-guide-paw">🐾</div>
        </>
      )}

      {selectedReport && (
        <div className="report-detail-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-detail-card" onClick={e => e.stopPropagation()}>

            {/* Foto / placeholder */}
            <div
              className="report-detail-photo"
              style={{ background: selectedReport.type === 'found' ? '#EBF4FF' : '#FFFFF0' }}
            >
              {selectedReport.fotos.length > 0 ? (
                <img
                  src={selectedReport.fotos[0]}
                  alt={selectedReport.petName}
                  className="report-detail-photo__clickable"
                  onClick={e => { e.stopPropagation(); setLightboxSrc(selectedReport.fotos[0]); }}
                />
              ) : (
                <span className="report-detail-photo__emoji">{especieEmoji(selectedReport.especie)}</span>
              )}
            </div>

            {/* Cabecera con badges y cierre */}
            <div className="report-detail-header">
              <div className="report-detail-badges">
                <span className={`report-detail-badge report-detail-badge--${selectedReport.type}`}>
                  {selectedReport.type === 'found' ? '! Encontrado' : '? Perdido'}
                </span>
                <span className={`report-detail-badge report-detail-badge--${selectedReport.status}`}>
                  {selectedReport.status === 'active' ? '⚠ Activo' : '✓ Resuelto'}
                </span>
              </div>
              <button className="report-detail-close" onClick={() => setSelectedReport(null)}>✕</button>
            </div>

            <div className="report-detail-body">
              <h2 className="report-detail-name">{selectedReport.petName}</h2>

              <div className="report-detail-grid">
                <div className="report-detail-field">
                  <span className="report-detail-field__label">Especie</span>
                  <span className="report-detail-field__value">{selectedReport.especie}</span>
                </div>
                <div className="report-detail-field">
                  <span className="report-detail-field__label">Color</span>
                  <span className="report-detail-field__value">{selectedReport.color}</span>
                </div>
                <div className="report-detail-field">
                  <span className="report-detail-field__label">Tamaño</span>
                  <span className="report-detail-field__value">{selectedReport.tamano}</span>
                </div>
                <div className="report-detail-field">
                  <span className="report-detail-field__label">Fecha reporte</span>
                  <span className="report-detail-field__value">{selectedReport.fecha}</span>
                </div>
              </div>

              <div className="report-detail-desc">{selectedReport.description}</div>

              <div className="report-detail-contact">
                <span className="report-detail-contact__icon">✉</span>
                <div>
                  <div className="report-detail-contact__label">Contactar al reportante</div>
                  {selectedReport.contactoName && (
                    <div className="report-detail-contact__email" style={{ fontWeight: 600, color: '#374151' }}>
                      {selectedReport.contactoName}
                    </div>
                  )}
                  {selectedReport.contacto && (
                    <a
                      href={`mailto:${selectedReport.contacto}`}
                      className="report-detail-contact__email"
                      onClick={e => e.stopPropagation()}
                    >
                      {selectedReport.contacto}
                    </a>
                  )}
                  {selectedReport.contactoPhone && (
                    <a
                      href={`tel:${selectedReport.contactoPhone}`}
                      className="report-detail-contact__email"
                      style={{ display: 'block', marginTop: '2px' }}
                      onClick={e => e.stopPropagation()}
                    >
                      📞 {selectedReport.contactoPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <button className="lightbox-close" onClick={e => { e.stopPropagation(); setLightboxSrc(null); }}>✕</button>
          <img
            src={lightboxSrc}
            alt="Foto de mascota"
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {reportSuccess && (
        <div className="report-success-toast">
          <CheckCircle size={18} />
          ¡Reporte enviado! Te avisaremos si encontramos una coincidencia.
        </div>
      )}

      <div className={`map-page${isPlacingPaw ? ' placing-paw' : ''}`}>

        {/* ── HEADER ── */}
        <div className="map-header">
          <h1 className="map-header__title">Mapa de Reportes</h1>
        </div>

        {/* ── LAYOUT ── */}
        <div className="map-layout">

          {/* ── SIDEBAR ── */}
          <aside className={`map-sidebar${showExploreGuide ? ' map-sidebar--guide' : ''}`}>

            {reportFormOpen ? (

              /* MODO FORMULARIO */
              <div className="sidebar-report-form">
                <div className="sidebar-form-title">
                  <span>🐾</span> Nuevo reporte
                </div>

                {isAuthenticated && (
                  <div className="sidebar-field">
                    <label className="sidebar-label">Tipo de reporte</label>
                    <div className="sidebar-type-toggle">
                      <button
                        className={`sidebar-type-btn${reportForm.tipo === 'found' ? ' sidebar-type-btn--active-green' : ''}`}
                        onClick={() => setReportForm(f => ({ ...f, tipo: 'found', nombreDesconocido: true, nombre: '' }))}
                        type="button"
                      >
                        ✅ Encontrado
                      </button>
                      <button
                        className={`sidebar-type-btn${reportForm.tipo === 'lost' ? ' sidebar-type-btn--active-yellow' : ''}`}
                        onClick={() => setReportForm(f => ({ ...f, tipo: 'lost', nombreDesconocido: false }))}
                        type="button"
                      >
                        🔍 Perdido
                      </button>
                    </div>
                  </div>
                )}

                {reportForm.tipo === 'found' ? (
                  <div className="sidebar-field">
                    <label className="sidebar-unknown-name">
                      <input
                        type="checkbox"
                        checked={reportForm.nombreDesconocido}
                        onChange={e => setReportForm(f => ({
                          ...f,
                          nombreDesconocido: e.target.checked,
                          nombre: e.target.checked ? '' : f.nombre,
                        }))}
                      />
                      <span>No sé el nombre de esta mascota</span>
                    </label>
                    {!reportForm.nombreDesconocido && (
                      <div className="sidebar-name-reveal">
                        <label className="sidebar-label">Nombre de la mascota</label>
                        <input
                          type="text"
                          className="sidebar-input"
                          placeholder="ej: aparece en su placa o collar"
                          value={reportForm.nombre}
                          onChange={e => setReportForm(f => ({ ...f, nombre: toTitleCase(e.target.value) }))}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sidebar-field">
                    <label className="sidebar-label">Nombre de la mascota</label>
                    <input
                      type="text"
                      className="sidebar-input"
                      placeholder="ej: Sara Connor"
                      value={reportForm.nombre}
                      onChange={e => setReportForm(f => ({ ...f, nombre: toTitleCase(e.target.value) }))}
                    />
                  </div>
                )}

                <div className="sidebar-field">
                  <label className="sidebar-label">Especie</label>
                  <select className="sidebar-select" value={reportForm.especie} onChange={e => setReportForm(f => ({ ...f, especie: e.target.value }))}>
                    <option value="">Selecciona...</option>
                    {ESPECIES.filter(x => x !== 'Todos').map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">
                    Color principal{' '}
                    <span className="sidebar-label-hint">Opcional (ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <select className="sidebar-select" value={reportForm.color} onChange={e => setReportForm(f => ({ ...f, color: e.target.value }))}>
                    <option value="">Selecciona...</option>
                    {COLORES.filter(x => x !== 'Todos').map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">
                    Tamaño{' '}
                    <span className="sidebar-label-hint">Opcional (ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <select className="sidebar-select" value={reportForm.tamano} onChange={e => setReportForm(f => ({ ...f, tamano: e.target.value }))}>
                    <option value="">Selecciona...</option>
                    {TAMANOS.filter(x => x !== 'Todos').map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">
                    Raza{' '}
                    <span className="sidebar-label-hint">Opcional (ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <input
                    type="text"
                    className="sidebar-input"
                    placeholder="ej: Labrador"
                    value={reportForm.raza}
                    onChange={e => setReportForm(f => ({ ...f, raza: e.target.value }))}
                  />
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">
                    Sexo{' '}
                    <span className="sidebar-label-hint">Opcional (ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <select className="sidebar-select" value={reportForm.sexo} onChange={e => setReportForm(f => ({ ...f, sexo: e.target.value }))}>
                    <option value="">Selecciona...</option>
                    <option>Macho</option>
                    <option>Hembra</option>
                    <option>No sé</option>
                  </select>
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">Descripción detallada *</label>
                  <textarea
                    className="sidebar-textarea"
                    rows={3}
                    placeholder="Collar, rasgos especiales, comportamiento, señas particulares..."
                    value={reportForm.descripcion}
                    onChange={e => setReportForm(f => ({ ...f, descripcion: e.target.value }))}
                  />
                  <p className="sidebar-field-hint">
                    La IA usa solo este texto para buscar coincidencias — no los campos de arriba. Descríbela con todos los detalles posibles: color, tamaño, raza, comportamiento, collar, señas particulares...
                  </p>
                </div>

                <div className="sidebar-field">
                  <label className="sidebar-label">Foto del animal</label>
                  <label className="sidebar-upload">
                    <Upload size={15} />
                    <span>{reportForm.foto ? reportForm.foto.name : 'Subir foto...'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => setReportForm(f => ({ ...f, foto: e.target.files?.[0] ?? null }))}
                    />
                  </label>
                </div>

                {!isAuthenticated && (
                  <div className="sidebar-field report-email">
                    <label className="sidebar-label">Tu email de contacto</label>
                    <input
                      type="email"
                      className="sidebar-input"
                      placeholder="tucorreo@email.com"
                      value={reportForm.email}
                      onChange={e => setReportForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                )}

                <button className="sidebar-submit-btn" onClick={handleReportSubmit} disabled={submittingReport}>
                  {submittingReport ? 'Enviando...' : '✓ Enviar reporte'}
                </button>
                <button className="sidebar-cancel-btn" onClick={handleCancelReport}>
                  Cancelar
                </button>
              </div>

            ) : (

              /* SIDEBAR NORMAL */
              <div className="sidebar-sections">

                {/* Card 1 — Explorar zona */}
                <div
                  className="sidebar-intro sidebar-intro--explore"
                  role="button"
                  tabIndex={0}
                  onClick={() => { setExploreMode(true); setFiltersApplied(false); setShowExploreGuide(true); }}
                  onKeyDown={e => e.key === 'Enter' && (setExploreMode(true), setFiltersApplied(false), setShowExploreGuide(true))}
                >
                  <div className="sidebar-intro__header">
                    <MapPin size={14} color="#78B864" />
                    <p className="sidebar-intro__title">Explora tu zona</p>
                  </div>
                  <p className="sidebar-intro__text">
                    Ubícate en el mapa para ver los casos activos de búsqueda y perdidos dentro de tu sector.
                  </p>
                </div>

                {/* Card 2 — Crear reporte */}
                <div
                  className="sidebar-intro sidebar-intro--report"
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowReportGuide(true)}
                  onKeyDown={e => e.key === 'Enter' && setShowReportGuide(true)}
                >
                  <div className="sidebar-intro__header">
                    <PawPrint size={14} color="#D4A843" />
                    <p className="sidebar-intro__title sidebar-intro__title--yellow">¿Quieres crear un reporte?</p>
                  </div>
                  <p className="sidebar-intro__text sidebar-intro__text--yellow">
                    Reporta una mascota perdida o encontrada y ayuda a reunir familias.
                  </p>
                </div>

                {/* 1. Ubícame */}
                <div className={`sidebar-section${showExploreGuide ? ' sidebar-section--lit' : ''}`}>
                  <button
                    className={`sidebar-btn sidebar-btn--primary${isPlacingPaw ? ' sidebar-btn--active' : ''}`}
                    onClick={() => { setShowExploreGuide(false); setExploreMode(true); if (!joyrideRun) setIsPlacingPaw(v => !v); }}
                  >
                    <MapPin size={15} />
                    Ubícame en el mapa
                  </button>
                  {pawPosition && !isPlacingPaw && (
                    <p className="sidebar-hint">📍 Posición establecida</p>
                  )}
                </div>

                {/* 2. Radio */}
                <div className={`sidebar-section sidebar-radius${!pawPosition ? ' sidebar-section--disabled' : ''}${showExploreGuide ? ' sidebar-section--lit' : ''}`}>
                  <div className="sidebar-radius-header">
                    <SlidersHorizontal size={13} color="#718096" />
                    <span>Radio de búsqueda</span>
                    <span className="sidebar-radius-value">{radius.toFixed(1)} km</span>
                  </div>
                  <input
                    type="range"
                    min={0.1} max={10} step={0.1}
                    value={radius}
                    disabled={!pawPosition}
                    onChange={e => setRadius(Number(e.target.value))}
                    className="sidebar-slider"
                  />
                </div>

                {/* 3. Filtros */}
                <div className={`sidebar-section${showExploreGuide ? ' sidebar-section--lit' : ''}`}>
                  <button className="sidebar-section-toggle" onClick={() => setFiltersOpen(o => !o)}>
                    <div className="sidebar-toggle-label">
                      <SlidersHorizontal size={13} color="#718096" />
                      <span>Filtros</span>
                    </div>
                    <ChevronDown
                      size={13}
                      style={{ transition: 'transform 0.2s', transform: filtersOpen ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>

                  {filtersOpen && (
                    <div className="sidebar-filters">
                      <div className="sidebar-field">
                        <label className="sidebar-label">Tipo</label>
                        <select className="sidebar-select" value={filterTipo} onChange={e => setFilterTipo(e.target.value as 'all'|'lost'|'found')}>
                          <option value="all">Todos</option>
                          <option value="lost">Perdido</option>
                          <option value="found">Encontrado</option>
                        </select>
                      </div>
                      <div className="sidebar-field">
                        <label className="sidebar-label">Especie</label>
                        <select className="sidebar-select" value={filterEspecie} onChange={e => setFilterEspecie(e.target.value)}>
                          {ESPECIES.map(x => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div className="sidebar-field">
                        <label className="sidebar-label">Nombre de mascota</label>
                        <input
                          type="text"
                          className="sidebar-input"
                          placeholder="ej: Sara Connor"
                          value={filterNombre}
                          onChange={e => setFilterNombre(toTitleCase(e.target.value))}
                        />
                      </div>
                      <div className="sidebar-field">
                        <label className="sidebar-label">Fecha</label>
                        <select className="sidebar-select" value={filterFecha} onChange={e => setFilterFecha(e.target.value)}>
                          {FECHAS.map(x => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div className="sidebar-field">
                        <label className="sidebar-label">Tamaño</label>
                        <select className="sidebar-select" value={filterTamano} onChange={e => setFilterTamano(e.target.value)}>
                          {TAMANOS.map(x => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div className="sidebar-field">
                        <label className="sidebar-label">Color</label>
                        <select className="sidebar-select" value={filterColor} onChange={e => setFilterColor(e.target.value)}>
                          {COLORES.map(x => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div className="sidebar-field">
                        <label className="sidebar-label">Estado</label>
                        <select className="sidebar-select" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                          {ESTADOS.map(x => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3b. Buscar en zona (solo en modo exploración con patita colocada) */}
                {exploreMode && pawPosition && (
                  <div className="sidebar-section sidebar-section--search">
                    <button
                      className="sidebar-apply-btn"
                      onClick={handleSearch}
                      disabled={loadingSearch}
                    >
                      <Search size={15} />
                      {loadingSearch ? 'Buscando...' : filtersApplied ? 'Actualizar resultados' : 'Buscar en esta zona'}
                    </button>
                    {filtersApplied && !loadingSearch && (
                      <p className="sidebar-hint">
                        {searchError
                          ? searchError
                          : filteredExplore.length === 0
                          ? 'Sin resultados con estos filtros'
                          : `${filteredExplore.length} reporte${filteredExplore.length !== 1 ? 's' : ''} encontrado${filteredExplore.length !== 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. Mis reportes */}
                <div className="sidebar-section">
                  {isAuthenticated ? (
                    <button
                      className={`sidebar-btn${showMyReports ? ' sidebar-btn--active' : ''}`}
                      onClick={() => setShowMyReports(v => !v)}
                    >
                      <Search size={15} />
                      {showMyReports ? 'Ocultar mis reportes' : 'Mis reportes'}
                    </button>
                  ) : (
                    <>
                      <button
                        className="sidebar-btn sidebar-btn--ghost"
                        onClick={() => setGuestMessage(v => !v)}
                      >
                        <Search size={15} />
                        Mis reportes
                      </button>
                      {guestMessage && (
                        <p className="sidebar-guest-msg">
                          <a href="/login" className="sidebar-guest-link">Inicia sesión</a> para ver tus reportes anteriores en el mapa.
                        </p>
                      )}
                    </>
                  )}
                </div>

              </div>
            )}
          </aside>

          {/* ── MAPA ── */}
          <div className="map-container-wrap">

            {isPlacingPaw && (
              <div className="map-placing-hint">
                <span className="map-placing-hint__icon">
                  {locationPickerMode ? '📍' : exploreMode ? '🔍' : '🐾'}
                </span>
                <span className="map-placing-hint__text">
                  {locationPickerMode
                    ? 'Haz clic en el mapa para marcar el lugar donde se vio la mascota'
                    : exploreMode
                    ? 'Haz clic en el mapa para elegir el centro de la zona que quieres explorar'
                    : 'Haz clic en el mapa para marcar la posición donde quieres generar tu reporte'}
                </span>
              </div>
            )}

            {matchView && (
              <div className="match-view-banner">
                <span className="match-view-banner__text">
                  🐾 Mostrando coincidencia — <strong>{matchViewData!.myPet.nombre || matchViewData!.myPet.especie}</strong>
                  {' '}↔ <strong>{matchViewData!.matchedPet.nombre || matchViewData!.matchedPet.especie}</strong>
                  {matchViewData!.matchedPet.porcentajeSimilitud != null && (
                    <> · {Math.round(matchViewData!.matchedPet.porcentajeSimilitud)}% de coincidencia</>
                  )}
                </span>
                <button
                  className="match-view-banner__btn"
                  onClick={() => setMatchViewData(null)}
                >
                  ✕ Salir
                </button>
              </div>
            )}

            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="map-leaflet">
              <MapClickHandler active={isPlacingPaw} onPlace={handleMapPlace} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON
                data={inverseMask as any}
                style={{ fillColor: '#1a2035', fillOpacity: 0.58, color: 'transparent', weight: 0 }}
              />

              {pawPosition && (
                <>
                  <Marker position={pawPosition} icon={pawIcon} />
                  <Circle
                    center={pawPosition}
                    radius={radius * 1000}
                    pathOptions={{ color: '#78B864', fillColor: '#78B864', fillOpacity: 0.12, weight: 2 }}
                  />
                </>
              )}

              {!matchView && filtersApplied && filteredExplore.map(r => (
                <Marker
                  key={r.id}
                  position={r.position}
                  icon={r.type === 'found' ? foundMarkerIcon : lostMarkerIcon}
                  eventHandlers={{ click: () => setSelectedReport(r) }}
                />
              ))}

              {!matchView && showMyReports && mockMyReports.map(r => (
                <Marker key={r.id} position={r.position} icon={lupaIcon}>
                  <Popup>
                    <div className="map-popup">
                      <span className="map-popup__badge">✅ Encontrado — <strong>Tu reporte</strong></span>
                      <p className="map-popup__name">{r.petName}</p>
                      <p className="map-popup__desc">{r.description}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {matchView && (
                <>
                  <FitBounds positions={[matchView.myPos, matchView.matchPos]} />
                  <Polyline
                    positions={[matchView.myPos, matchView.matchPos]}
                    pathOptions={{ color: '#78B864', weight: 3, dashArray: '10, 7', opacity: 0.9 }}
                  />
                  <Marker
                    position={matchView.midPos}
                    icon={makeDistanceIcon(matchView.distLabel)}
                  />
                  <Marker
                    position={matchView.myPos}
                    icon={myPetMatchIcon}
                    eventHandlers={{ click: () => setSelectedReport(matchView.myPetDisplay) }}
                  />
                  <Marker
                    position={matchView.matchPos}
                    icon={matchView.matchedPetDisplay.type === 'found' ? foundMarkerIcon : lostMarkerIcon}
                    eventHandlers={{ click: () => setSelectedReport(matchView.matchedPetDisplay) }}
                  />
                </>
              )}
            </MapContainer>

            <a href="#" className={`map-fab${showReportGuide ? ' map-fab--glow' : ''}`} onClick={handleFabClick}>
              + Reportar
            </a>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
