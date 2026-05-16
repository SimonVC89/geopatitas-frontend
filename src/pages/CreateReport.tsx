import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

export default function CreateReport() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const routeLocation  = useLocation();

  const [formData, setFormData] = useState({
    type: searchParams.get('type') === 'found' ? 'found' : 'lost',
    petName: '',
    species: 'dog',
    breed: '',
    color: '',
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

  const [locationPicked, setLocationPicked] = useState(false);
  const [loading,        setLoading]        = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationPicked) {
      alert('Por favor selecciona la ubicación en el mapa antes de continuar.');
      return;
    }
    setLoading(true);
    try {
      console.log('Creando reporte:', formData);
      setTimeout(() => {
        alert('¡Reporte creado exitosamente!');
        navigate('/mis-reportes');
      }, 1000);
    } catch (error) {
      console.error('Error creando reporte:', error);
      alert('Error al crear el reporte. Intenta nuevamente.');
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
                  <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">Raza (opcional)</label>
                  <input
                    id="breed" name="breed" type="text" value={formData.breed} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="ej: Labrador"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    id="color" name="color" type="text" value={formData.color} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="ej: Dorado"
                  />
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
                  placeholder="Describe características distintivas, comportamiento, collar, etc."
                />
              </div>

              <div className="mt-4">
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de la Mascota
                </label>
                <input
                  id="photo" name="photo" type="file" accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Ubicación */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Ubicación</h2>
              <p className="text-sm text-gray-500 mb-4">
                Indica en el mapa el lugar donde se vio la mascota por última vez.
              </p>

              {!locationPicked ? (
                <button
                  type="button"
                  onClick={handleGoToMapPicker}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  🗺️ Seleccionar ubicación en el mapa
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 text-xl">✓</span>
                  <div className="flex-1">
                    <p className="text-green-800 font-semibold text-sm">Ubicación marcada en el mapa</p>
                    <p className="text-green-600 text-xs mt-0.5">
                      {parseFloat(formData.latitude).toFixed(5)}, {parseFloat(formData.longitude).toFixed(5)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoToMapPicker}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Cambiar
                  </button>
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

            {/* Información de Contacto */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Información de Contacto</h2>
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
