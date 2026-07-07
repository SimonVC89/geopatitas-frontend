import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isInsidePolygon, COVERAGE_ZONE } from '../utils/geo';

const locationPinIcon = new DivIcon({
  html: '<div style="font-size:2rem;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35))">📍</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [10, 28],
});

const ESPECIE_MAP: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo', other: 'Otro',
};

export default function CreateReport() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const routeLocation  = useLocation();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    type: searchParams.get('type') === 'found' ? 'found' : 'lost',
    petName: '',
    species: 'dog',
    breed: '',
    color: '',
    tamano: '',
    sexo: '',
    description: '',
    photo: null as File | null,
    latitude: '',
    longitude: '',
    address: '',
    city: 'Valparaíso',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  const [locationPicked,        setLocationPicked]        = useState(false);
  const [gpsUsed,               setGpsUsed]               = useState(false);
  const [geoLoading,            setGeoLoading]            = useState(false);
  const [geoError,              setGeoError]              = useState<string | null>(null);
  const [loading,               setLoading]               = useState(false);
  const [forThirdParty,         setForThirdParty]         = useState(false);

  // Restaurar formulario + coordenadas al volver del mapa
  useEffect(() => {
    const state = routeLocation.state as { lat?: number; lng?: number } | null;
    if (!state?.lat) return;

    const saved = sessionStorage.getItem('geopatitas_report_form');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData({ ...parsed, photo: null, latitude: String(state.lat), longitude: String(state.lng ?? '') });
      } catch {
        setFormData(f => ({ ...f, latitude: String(state.lat), longitude: String(state.lng ?? '') }));
      }
      sessionStorage.removeItem('geopatitas_report_form');
    } else {
      setFormData(f => ({ ...f, latitude: String(state.lat), longitude: String(state.lng ?? '') }));
    }
    setLocationPicked(true);
    navigate(routeLocation.pathname + routeLocation.search, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFormData({ ...formData, photo: e.target.files[0] });
  };

  const handleGoToMapPicker = () => {
    sessionStorage.setItem('geopatitas_report_form', JSON.stringify({ ...formData, photo: null }));
    navigate('/mapa', { state: { pickingLocation: true } });
  };

  const handleGpsLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización. Selecciona el punto en el mapa.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGeoLoading(false);
        if (!isInsidePolygon(lat, lng, COVERAGE_ZONE)) {
          setGeoError('Tu ubicación está fuera del área de cobertura (Gran Valparaíso). Selecciona el punto manualmente en el mapa.');
          return;
        }
        // No validamos SEA_ZONE en GPS: la imprecisión de desktop puede caer en la costa
        setFormData(f => ({ ...f, latitude: String(lat), longitude: String(lng) }));
        setLocationPicked(true);
        setGpsUsed(true);
      },
      err => {
        setGeoLoading(false);
        setGeoError(
          err.code === 1
            ? 'Permiso de ubicación denegado. Selecciona el punto manualmente en el mapa.'
            : 'No se pudo obtener tu ubicación. Selecciona el punto manualmente en el mapa.',
        );
      },
      { timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!locationPicked) {
      alert('Por favor selecciona la ubicación en el mapa antes de continuar.');
      return;
    }
    setLoading(true);
    try {
      // 1. Subir foto si existe (solo usuarios autenticados)
      let fotosUrls: string[] = [];
      if (formData.photo && isAuthenticated) {
        const fd = new FormData();
        fd.append('file', formData.photo);
        const { data: up } = await api.post('/pets/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (up?.url) fotosUrls = [up.url];
      }

      // 2. Construir payload
      const base = {
        tipoReporte: formData.type === 'found' ? 'ENCONTRADO' : 'PERDIDO',
        nombre: formData.petName || null,
        especie: ESPECIE_MAP[formData.species] ?? formData.species,
        raza: formData.breed || null,
        color: formData.color || null,
        tamano: formData.tamano || null,
        sexo: formData.sexo || null,
        descripcion: formData.description,
        fotos: fotosUrls,
        latitud: parseFloat(formData.latitude),
        longitud: parseFloat(formData.longitude),
      };

      // 3. Enviar al endpoint correcto
      if (isAuthenticated) {
        const payload = {
          ...base,
          ...(forThirdParty && formData.contactName  ? { contactoNombre:   formData.contactName  } : {}),
          ...(forThirdParty && formData.contactEmail ? { contactoEmail:    formData.contactEmail } : {}),
          ...(forThirdParty && formData.contactPhone ? { contactoTelefono: formData.contactPhone } : {}),
        };
        await api.post('/pets', payload);
      } else {
        if (!formData.contactEmail) {
          alert('Por favor ingresa tu email de contacto.');
          return;
        }
        await api.post('/pets/guest', { ...base, contactoEmail: formData.contactEmail });
      }

      alert('¡Reporte creado exitosamente!');
      navigate('/mapa');
    } catch (error: any) {
      console.error('Error creando reporte:', error);
      const msg = error.response?.data?.message ?? 'Error al crear el reporte. Intenta nuevamente.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {formData.type === 'lost' ? 'Reportar Mascota Perdida' : 'Reportar Mascota Encontrada'}
          </h1>
          <p className="text-gray-600 mb-8">
            Completa el formulario con la mayor cantidad de detalles posible
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="type" value="lost" checked={formData.type === 'lost'} onChange={handleChange} className="mr-2" />
                  <span>Mascota Perdida</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="type" value="found" checked={formData.type === 'found'} onChange={handleChange} className="mr-2" />
                  <span>Mascota Encontrada</span>
                </label>
              </div>
            </div>

            {/* Información de la Mascota */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Información de la Mascota</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre {formData.type === 'found' && <span className="text-gray-400 font-normal">(opcional si no lo sabes)</span>}
                  </label>
                  <input
                    id="petName" name="petName" type="text"
                    value={formData.petName} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder={formData.type === 'found' ? 'ej: aparece en su placa o collar' : 'ej: Max'}
                  />
                </div>

                <div>
                  <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">Especie</label>
                  <select
                    id="species" name="species" value={formData.species} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="dog">Perro</option>
                    <option value="cat">Gato</option>
                    <option value="bird">Ave</option>
                    <option value="rabbit">Conejo</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                    Raza <span className="text-gray-400 font-normal text-xs">(Opcional — ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <input
                    id="breed" name="breed" type="text" value={formData.breed} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="ej: Labrador"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Color principal <span className="text-gray-400 font-normal text-xs">(Opcional — ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <select
                    id="color" name="color" value={formData.color} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecciona...</option>
                    {['Blanco', 'Negro', 'Marrón', 'Amarillo', 'Gris', 'Naranja', 'Multicolor'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tamano" className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño <span className="text-gray-400 font-normal text-xs">(Opcional — ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <select
                    id="tamano" name="tamano" value={formData.tamano} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Pequeño">Pequeño</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grande">Grande</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo <span className="text-gray-400 font-normal text-xs">(Opcional — ayuda a otros usuarios a filtrar el mapa)</span>
                  </label>
                  <select
                    id="sexo" name="sexo" value={formData.sexo} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecciona...</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                    <option value="No sé">No sé</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Detallada *
                </label>
                <textarea
                  id="description" name="description" required
                  value={formData.description} onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Describe características distintivas, comportamiento, collar, señas particulares..."
                />
                <p className="text-xs text-blue-500 mt-1.5">
                  La IA usa solo este texto para buscar coincidencias — no los campos de arriba. Descríbela con todos los detalles posibles: color, tamaño, raza, comportamiento, collar, señas particulares...
                </p>
              </div>

            </div>

            {/* Ubicación */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Ubicación</h2>
              <p className="text-sm text-gray-500 mb-4">
                Indica en el mapa el lugar donde se vio la mascota por última vez.
              </p>

              {!locationPicked ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleGoToMapPicker}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      🗺️ Seleccionar ubicación en el mapa
                    </button>
                    <button
                      type="button"
                      onClick={handleGpsLocation}
                      disabled={geoLoading}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      {geoLoading ? '📡 Obteniendo…' : '📍 Usar mi ubicación actual'}
                    </button>
                  </div>
                  {geoError && (
                    <p className="text-red-600 text-sm flex items-start gap-1.5">
                      <span>⚠</span><span>{geoError}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 text-xl">✓</span>
                  <div className="flex-1">
                    <p className="text-green-800 font-semibold text-sm">
                      {gpsUsed ? 'Ubicación GPS obtenida' : 'Ubicación marcada en el mapa'}
                    </p>
                    {gpsUsed && (
                      <p className="text-amber-600 text-xs mt-0.5">
                        ⚠ Posición aproximada basada en tu dispositivo
                      </p>
                    )}
                    <p className="text-green-600 text-xs mt-0.5">
                      {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLocationPicked(false); setGpsUsed(false); setGeoError(null); }}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {locationPicked && formData.latitude && formData.longitude && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 180 }}>
                  <MapContainer
                    center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                    zoom={15}
                    scrollWheelZoom={false}
                    dragging={false}
                    zoomControl={false}
                    touchZoom={false}
                    doubleClickZoom={false}
                    keyboard={false}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker
                      position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                      icon={locationPinIcon}
                    />
                  </MapContainer>
                </div>
              )}

              <div className="mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección o Referencia (opcional)
                </label>
                <input
                  id="address" name="address" type="text" value={formData.address} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="ej: Cerca del parque Italia"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                <select
                  id="city" name="city" required value={formData.city} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Valparaíso">Valparaíso</option>
                  <option value="Viña del Mar">Viña del Mar</option>
                  <option value="Quilpué">Quilpué</option>
                </select>
              </div>
            </div>

            {/* Foto */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Foto de la Mascota</h2>
              <input
                id="photo" name="photo" type="file" accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {formData.photo
                ? <p className="text-xs text-green-600 mt-2">✓ {formData.photo.name}</p>
                : <p className="text-xs text-gray-400 mt-2">Selecciona primero la ubicación en el mapa y luego sube la foto.</p>
              }
            </div>

            {/* Información de Contacto */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Información de Contacto</h2>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={forThirdParty}
                      onChange={e => setForThirdParty(e.target.checked)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Registrar para alguien más</p>
                      <p className="text-xs text-gray-500 mt-0.5">Activa esto si estás reportando en nombre de otra persona (familiar, vecino, etc.)</p>
                    </div>
                  </label>

                  {forThirdParty && (
                    <div className="space-y-4 pl-1">
                      <div>
                        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">Nombre de contacto</label>
                        <input
                          id="contactName" name="contactName" type="text"
                          value={formData.contactName} onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="ej: Luis Martínez"
                        />
                      </div>
                      <div>
                        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">Teléfono de contacto</label>
                        <input
                          id="contactPhone" name="contactPhone" type="tel"
                          value={formData.contactPhone} onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                      <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">Email de contacto</label>
                        <input
                          id="contactEmail" name="contactEmail" type="email"
                          value={formData.contactEmail} onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="ej: luis@email.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input
                      id="contactName" name="contactName" type="text" required
                      value={formData.contactName} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input
                      id="contactPhone" name="contactPhone" type="tel" required
                      value={formData.contactPhone} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      id="contactEmail" name="contactEmail" type="email" required
                      value={formData.contactEmail} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Reporte'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
