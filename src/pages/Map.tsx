import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en React
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Coordenadas por defecto: Valparaíso
const DEFAULT_CENTER: [number, number] = [-33.0472, -71.6127];
const DEFAULT_ZOOM = 12;

export default function Map() {
  // TODO: Cargar reportes reales desde el backend
  const mockReports = [
    {
      id: '1',
      type: 'lost',
      position: [-33.0472, -71.6127] as [number, number],
      petName: 'Max',
      description: 'Perro labrador color dorado',
    },
    {
      id: '2',
      type: 'found',
      position: [-33.0372, -71.6227] as [number, number],
      petName: 'Desconocido',
      description: 'Gato atigrado encontrado',
    },
  ];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header con filtros */}
      <div className="bg-white shadow-md p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Mapa de Reportes
          </h1>
          <div className="flex gap-2">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              Filtrar Perdidos
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              Filtrar Encontrados
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marcadores de reportes */}
          {mockReports.map((report) => (
            <Marker
              key={report.id}
              position={report.position}
              icon={defaultIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-1">
                    {report.type === 'lost' ? '🔍 Perdido' : '✅ Encontrado'}
                  </h3>
                  <p className="font-semibold">{report.petName}</p>
                  <p className="text-sm text-gray-600">{report.description}</p>
                  <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                    Ver detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Action Button - Crear Reporte */}
        <button className="absolute bottom-8 right-8 bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-full shadow-lg text-2xl z-[1000] transition-colors">
          + Reportar
        </button>
      </div>
    </div>
  );
}
