import { Link } from 'react-router-dom';

export default function MyReports() {
  // TODO: Cargar reportes del usuario desde el backend
  const mockReports = [
    {
      id: '1',
      type: 'lost',
      petName: 'Max',
      species: 'Perro',
      breed: 'Labrador',
      city: 'Valparaíso',
      status: 'active',
      createdAt: '2024-01-15',
      matches: 2,
    },
    {
      id: '2',
      type: 'found',
      petName: 'Desconocido',
      species: 'Gato',
      breed: 'Mestizo',
      city: 'Viña del Mar',
      status: 'active',
      createdAt: '2024-01-20',
      matches: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Activo</span>;
      case 'resolved':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">Resuelto</span>;
      case 'closed':
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">Cerrado</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'lost') {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">🔍 Perdido</span>;
    }
    return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">✅ Encontrado</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Mis Reportes</h1>
          <p className="text-gray-600">Administra tus reportes de mascotas perdidas y encontradas</p>
        </div>

        {/* Botón Crear Reporte */}
        <div className="mb-6">
          <Link
            to="/reportar"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            + Crear Nuevo Reporte
          </Link>
        </div>

        {/* Lista de Reportes */}
        {mockReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No tienes reportes aún</p>
            <Link
              to="/reportar"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Crear Primer Reporte
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mockReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* Info Principal */}
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeBadge(report.type)}
                      {getStatusBadge(report.status)}
                      {report.matches > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {report.matches} {report.matches === 1 ? 'match' : 'matches'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                      {report.petName || 'Desconocido'}
                    </h3>

                    <div className="text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Especie:</span> {report.species}
                        {report.breed && ` - ${report.breed}`}
                      </p>
                      <p>
                        <span className="font-semibold">Ciudad:</span> {report.city}
                      </p>
                      <p className="text-sm text-gray-500">
                        Creado el {new Date(report.createdAt).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold">
                      Ver Detalles
                    </button>
                    {report.matches > 0 && (
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors font-semibold">
                        Ver Matches
                      </button>
                    )}
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition-colors font-semibold">
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {mockReports.filter(r => r.type === 'lost').length}
            </div>
            <p className="text-gray-600">Mascotas Perdidas</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">
              {mockReports.filter(r => r.type === 'found').length}
            </div>
            <p className="text-gray-600">Mascotas Encontradas</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-yellow-500 mb-2">
              {mockReports.reduce((acc, r) => acc + r.matches, 0)}
            </div>
            <p className="text-gray-600">Matches Encontrados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
