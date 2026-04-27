import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CreateReport() {
  const [searchParams] = useSearchParams();
  const reportTypeFromUrl = searchParams.get('type');

  const [formData, setFormData] = useState({
    type: reportTypeFromUrl === 'found' ? 'found' : 'lost',
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

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        photo: e.target.files[0],
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('No se pudo obtener la ubicación. Verifica los permisos del navegador.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implementar envío al backend
      console.log('Creando reporte:', formData);

      // Simulación
      setTimeout(() => {
        alert('Reporte creado exitosamente!');
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="lost"
                    checked={formData.type === 'lost'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Mascota Perdida</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="found"
                    checked={formData.type === 'found'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Mascota Encontrada</span>
                </label>
              </div>
            </div>

            {/* Información de la Mascota */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Información de la Mascota
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre {formData.type === 'found' && '(opcional)'}
                  </label>
                  <input
                    id="petName"
                    name="petName"
                    type="text"
                    value={formData.petName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Max"
                  />
                </div>

                {/* Especie */}
                <div>
                  <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">
                    Especie
                  </label>
                  <select
                    id="species"
                    name="species"
                    value={formData.species}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="dog">Perro</option>
                    <option value="cat">Gato</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {/* Raza */}
                <div>
                  <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
                    Raza (opcional)
                  </label>
                  <input
                    id="breed"
                    name="breed"
                    type="text"
                    value={formData.breed}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Labrador"
                  />
                </div>

                {/* Color */}
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    id="color"
                    name="color"
                    type="text"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Dorado"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Detallada *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Describe características distintivas, comportamiento, etc."
                />
              </div>

              {/* Foto */}
              <div className="mt-4">
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de la Mascota
                </label>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Ubicación */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Ubicación
              </h2>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📍 Usar mi ubicación actual
              </button>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitud *
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="text"
                    required
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="-33.0472"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitud *
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="text"
                    required
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="-71.6127"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección o Referencia
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Cerca del parque Italia"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <select
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Información de Contacto
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
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
