import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { api } from '../services/api';
import Footer from '../components/Footer';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PetFromApi = {
  id: string;
  tipoReporte: 'PERDIDO' | 'ENCONTRADO';
  nombre: string | null;
  especie: string;
  raza: string | null;
  color: string | null;
  tamano: string | null;
  sexo: string | null;
  descripcion: string;
  estado: 'ACTIVO' | 'RESUELTO';
  fechaReporte: string;
  fotos: string[];
  latitud: number;
  longitud: number;
};

type MatchItem = {
  id: string;
  tipoReporte: 'PERDIDO' | 'ENCONTRADO';
  nombre: string | null;
  especie: string;
  raza: string | null;
  color: string | null;
  tamano: string | null;
  descripcion: string;
  fotos: string[];
  latitud?: number;
  longitud?: number;
  estado?: string;
  fechaReporte?: string;
  score?: number;
  porcentajeSimilitud?: number;
  distanciaKm?: number;
  // Contacto del reportante
  contactoNombre?: string;
  contactoEmail?: string;
  contactoTelefono?: string;
  user?: { nombre?: string; email?: string; telefono?: string };
};

type EditForm = {
  tipoReporte: 'PERDIDO' | 'ENCONTRADO';
  nombre: string;
  especie: string;
  raza: string;
  color: string;
  tamano: string;
  sexo: string;
  descripcion: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const COLORES  = ['Blanco', 'Negro', 'Marrón', 'Amarillo', 'Gris', 'Naranja', 'Multicolor'];
const TAMANOS  = ['Pequeño', 'Mediano', 'Grande'];
const ESPECIES = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];
const SEXOS    = ['Macho', 'Hembra', 'No sé'];

const RESOLVE_REASONS = [
  { value: 'match',       label: '🎉 Lo encontré gracias a un match en GeoPatitas' },
  { value: 'contact',     label: '📞 Me contactaron directamente a través del mapa' },
  { value: 'other_media', label: '📋 Lo encontré por otro medio (volante, redes sociales, etc.)' },
  { value: 'other',       label: '💬 Otro' },
];

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(iso));

const matchPct = (m: MatchItem): number | null => {
  if (m.porcentajeSimilitud != null) return Math.round(m.porcentajeSimilitud);
  if (m.score != null)               return Math.round(m.score * 100);
  return null;
};

const especieEmoji = (e: string) =>
  ({ Perro: '🐶', Gato: '🐱', Ave: '🐦', Conejo: '🐰' }[e] ?? '🐾');

// Extrae contacto normalizado de un MatchItem
const getContacto = (m: MatchItem) => ({
  nombre:   m.contactoNombre  ?? m.user?.nombre   ?? null,
  email:    m.contactoEmail   ?? m.user?.email    ?? null,
  telefono: m.contactoTelefono ?? m.user?.telefono ?? null,
});

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MyReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState<PetFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Modal: Ver detalles
  const [detailModal, setDetailModal] = useState<PetFromApi | null>(null);

  // Modal: Modificar reporte
  const [editModal,    setEditModal]    = useState<PetFromApi | null>(null);
  const [editForm,     setEditForm]     = useState<EditForm | null>(null);
  const [editNewPhoto, setEditNewPhoto] = useState<File | null>(null);
  const [savingEdit,   setSavingEdit]   = useState(false);

  // Modal: Marcar como resuelto (flow directo)
  const [resolveModal,    setResolveModal]    = useState<PetFromApi | null>(null);
  const [resolveReason,   setResolveReason]   = useState('');
  const [resolvingDirect, setResolvingDirect] = useState(false);

  // Modal: Match de reportes
  const [matchModal,     setMatchModal]     = useState<PetFromApi | null>(null);
  const [matches,        setMatches]        = useState<MatchItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [confirmedMatch, setConfirmedMatch] = useState<MatchItem | null>(null);
  const [resolving,      setResolving]      = useState(false);

  // Lightbox de foto (dentro del modal de match)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Modal: Contacto del reportante de un match
  const [contactModal,   setContactModal]   = useState<MatchItem | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFetched, setContactFetched] = useState<{
    nombre: string | null; email: string | null; telefono: string | null;
  } | null>(null);

  // ── Cargar ─────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/users/me/pets');
      setReports(data);
    } catch {
      setError('No se pudieron cargar tus reportes. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Editar ─────────────────────────────────────────────────────────────────

  const openEdit = (pet: PetFromApi) => {
    setEditForm({
      tipoReporte: pet.tipoReporte,
      nombre:      pet.nombre      || '',
      especie:     pet.especie     || 'Perro',
      raza:        pet.raza        || '',
      color:       pet.color       || '',
      tamano:      pet.tamano      || '',
      sexo:        pet.sexo        || '',
      descripcion: pet.descripcion || '',
    });
    setEditNewPhoto(null);
    setEditModal(pet);
  };

  const closeEdit = () => { setEditModal(null); setEditNewPhoto(null); };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    if (!editModal || !editForm) return;
    setSavingEdit(true);
    try {
      let fotos = editModal.fotos;
      if (editNewPhoto) {
        const fd = new FormData();
        fd.append('file', editNewPhoto);
        const { data: up } = await api.post('/pets/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (up?.url) fotos = [up.url];
      }
      await api.put(`/pets/${editModal.id}`, { ...editModal, ...editForm, fotos });
      setReports(prev =>
        prev.map(r => r.id === editModal.id ? { ...r, ...editForm, fotos } : r),
      );
      closeEdit();
    } catch {
      alert('Error al guardar los cambios. Intenta nuevamente.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Resolver (directo) ─────────────────────────────────────────────────────

  const openResolve = (pet: PetFromApi) => {
    setResolveReason('');
    setResolveModal(pet);
  };

  const handleResolveDirect = async () => {
    if (!resolveModal) return;
    setResolvingDirect(true);
    try {
      await api.put(`/pets/${resolveModal.id}`, { ...resolveModal, estado: 'RESUELTO' });
      setReports(prev =>
        prev.map(r => r.id === resolveModal.id ? { ...r, estado: 'RESUELTO' } : r),
      );
      setResolveModal(null);
    } catch {
      alert('Error al actualizar el reporte. Intenta nuevamente.');
    } finally {
      setResolvingDirect(false);
    }
  };

  // ── Matches ────────────────────────────────────────────────────────────────

  const openMatches = async (pet: PetFromApi) => {
    setMatchModal(pet);
    setMatches([]);
    setConfirmedMatch(null);
    setLoadingMatches(true);
    try {
      const { data } = await api.get('/pets/match', {
        params: {
          q:           pet.descripcion,
          tipoOpuesto: pet.tipoReporte === 'PERDIDO' ? 'ENCONTRADO' : 'PERDIDO',
          especie:     pet.especie,
          color:       pet.color,
          sexo:        pet.sexo,
          tamano:      pet.tamano,
          lat:         pet.latitud,
          lng:         pet.longitud,
        },
      });
      const filtered = (data as MatchItem[])
        .filter(m => m.id !== pet.id)
        .filter(m => m.tipoReporte !== pet.tipoReporte);
      setMatches(filtered);
    } catch {
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const closeMatchModal = () => {
    setMatchModal(null);
    setConfirmedMatch(null);
    setMatches([]);
  };

  const openContactModal = async (m: MatchItem) => {
    setContactModal(m);
    setContactFetched(null);
    // Si el item ya trae datos de contacto, úsalos directamente
    const existing = getContacto(m);
    if (existing.nombre || existing.email || existing.telefono) {
      setContactFetched(existing);
      return;
    }
    // Si no, busca el reporte completo por ID
    setContactLoading(true);
    try {
      const { data } = await api.get(`/pets/${m.id}`);
      setContactFetched({
        nombre:   data.contactoNombre   ?? data.user?.nombre   ?? null,
        email:    data.contactoEmail    ?? data.user?.email    ?? null,
        telefono: data.contactoTelefono ?? data.user?.telefono ?? null,
      });
    } catch {
      setContactFetched({ nombre: null, email: null, telefono: null });
    } finally {
      setContactLoading(false);
    }
  };

  const handleResolveFromMatch = async () => {
    if (!matchModal || !confirmedMatch) return;
    setResolving(true);
    try {
      await api.put(`/pets/${matchModal.id}`, { ...matchModal, estado: 'RESUELTO' });
      setReports(prev =>
        prev.map(r => r.id === matchModal.id ? { ...r, estado: 'RESUELTO' } : r),
      );
      closeMatchModal();
    } catch {
      alert('Error al marcar como resuelto. Intenta nuevamente.');
    } finally {
      setResolving(false);
    }
  };

  const handleVerEnMapa = (matchedPet: MatchItem) => {
    if (!matchModal) return;
    closeMatchModal();
    navigate('/mapa', {
      state: {
        matchView: {
          myPet: {
            id:          matchModal.id,
            tipoReporte: matchModal.tipoReporte,
            nombre:      matchModal.nombre,
            especie:     matchModal.especie,
            raza:        matchModal.raza,
            color:       matchModal.color,
            tamano:      matchModal.tamano,
            descripcion: matchModal.descripcion,
            fotos:       matchModal.fotos,
            latitud:     matchModal.latitud,
            longitud:    matchModal.longitud,
            estado:      matchModal.estado,
            fechaReporte: matchModal.fechaReporte,
          },
          matchedPet: {
            id:          matchedPet.id,
            tipoReporte: matchedPet.tipoReporte,
            nombre:      matchedPet.nombre,
            especie:     matchedPet.especie,
            raza:        matchedPet.raza,
            color:       matchedPet.color,
            tamano:      matchedPet.tamano,
            descripcion: matchedPet.descripcion,
            fotos:       matchedPet.fotos,
            latitud:     matchedPet.latitud,
            longitud:    matchedPet.longitud,
            distanciaKm: matchedPet.distanciaKm,
            porcentajeSimilitud: matchedPet.porcentajeSimilitud ?? (matchedPet.score != null ? matchedPet.score * 100 : undefined),
            contactoNombre:   matchedPet.contactoNombre  ?? matchedPet.user?.nombre,
            contactoEmail:    matchedPet.contactoEmail   ?? matchedPet.user?.email,
            contactoTelefono: matchedPet.contactoTelefono ?? matchedPet.user?.telefono,
          },
        },
      },
    });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const activos   = reports.filter(r => r.estado === 'ACTIVO').length;
  const resueltos = reports.filter(r => r.estado === 'RESUELTO').length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Mis Reportes</h1>
            <p className="text-gray-600">Administra tus reportes de mascotas perdidas y encontradas</p>
          </div>

          <div className="mb-6">
            <Link
              to="/reportar"
              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              + Crear Nuevo Reporte
            </Link>
          </div>

          {loading && (
            <div className="text-center py-16 text-gray-400 text-lg">Cargando tus reportes...</div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg mb-6 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={load} className="text-sm font-semibold underline ml-4">Reintentar</button>
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No tienes reportes aún</p>
              <Link
                to="/reportar"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Crear Primer Reporte
              </Link>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <>
              <div className="space-y-4 mb-12">
                {reports.map(r => (
                  <div
                    key={r.id}
                    className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${r.estado === 'RESUELTO' ? 'opacity-75' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                      {/* Miniatura */}
                      <div className="flex gap-4 flex-1">
                        {r.fotos?.[0] ? (
                          <img
                            src={r.fotos[0]}
                            alt={r.nombre ?? 'Mascota'}
                            className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                            {especieEmoji(r.especie)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {r.tipoReporte === 'PERDIDO'
                              ? <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">🔍 Perdido</span>
                              : <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">✅ Encontrado</span>
                            }
                            {r.estado === 'ACTIVO'
                              ? <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">⚠ Activo</span>
                              : <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-semibold">✓ Resuelto</span>
                            }
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">{r.nombre || 'Desconocido'}</h3>
                          <p className="text-sm text-gray-500">
                            {r.especie}{r.raza ? ` — ${r.raza}` : ''}
                            {r.color ? ` · ${r.color}` : ''}
                            {r.tamano ? ` · ${r.tamano}` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.fechaReporte)}</p>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2 min-w-[170px]">
                        <button
                          onClick={() => setDetailModal(r)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-semibold text-sm"
                        >
                          Ver detalles
                        </button>

                        {r.estado === 'ACTIVO' && (
                          <>
                            <button
                              onClick={() => openEdit(r)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg transition-colors font-semibold text-sm"
                            >
                              Modificar reporte
                            </button>
                            <button
                              onClick={() => openMatches(r)}
                              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-300 px-4 py-2 rounded-lg transition-colors font-semibold text-sm"
                            >
                              🔍 Match de reportes
                            </button>
                            <button
                              onClick={() => openResolve(r)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-bold text-sm"
                            >
                              ✓ Caso resuelto
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Estadísticas */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="text-4xl font-bold text-gray-700 mb-2">{reports.length}</div>
                  <p className="text-gray-500">Reportes totales</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="text-4xl font-bold text-yellow-500 mb-2">{activos}</div>
                  <p className="text-gray-500">Activos</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{resueltos}</div>
                  <p className="text-gray-500">Resueltos</p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MODAL — Ver detalles
      ════════════════════════════════════════════════ */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {detailModal.fotos.length > 0 ? (
              <img
                src={detailModal.fotos[0]}
                alt={detailModal.nombre ?? 'Mascota'}
                className="w-full h-52 object-cover rounded-t-2xl"
              />
            ) : (
              <div className="w-full h-36 rounded-t-2xl bg-gray-100 flex items-center justify-center text-5xl">
                {especieEmoji(detailModal.especie)}
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${detailModal.tipoReporte === 'PERDIDO' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    {detailModal.tipoReporte === 'PERDIDO' ? '🔍 Perdido' : '✅ Encontrado'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${detailModal.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {detailModal.estado === 'ACTIVO' ? '⚠ Activo' : '✓ Resuelto'}
                  </span>
                </div>
                <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-700 ml-4 flex-shrink-0">
                  <X size={20} />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">{detailModal.nombre || 'Desconocido'}</h2>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
                <div><dt className="font-semibold text-gray-500 mb-0.5">Especie</dt><dd className="text-gray-800">{detailModal.especie}</dd></div>
                {detailModal.raza   && <div><dt className="font-semibold text-gray-500 mb-0.5">Raza</dt><dd className="text-gray-800">{detailModal.raza}</dd></div>}
                {detailModal.color  && <div><dt className="font-semibold text-gray-500 mb-0.5">Color</dt><dd className="text-gray-800">{detailModal.color}</dd></div>}
                {detailModal.tamano && <div><dt className="font-semibold text-gray-500 mb-0.5">Tamaño</dt><dd className="text-gray-800">{detailModal.tamano}</dd></div>}
                {detailModal.sexo   && <div><dt className="font-semibold text-gray-500 mb-0.5">Sexo</dt><dd className="text-gray-800">{detailModal.sexo}</dd></div>}
                <div className="col-span-2">
                  <dt className="font-semibold text-gray-500 mb-0.5">Fecha reporte</dt>
                  <dd className="text-gray-800">{formatDate(detailModal.fechaReporte)}</dd>
                </div>
              </dl>

              {detailModal.descripcion && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                  {detailModal.descripcion}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL — Modificar reporte
      ════════════════════════════════════════════════ */}
      {editModal && editForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4"
          onClick={closeEdit}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Modificar reporte</h2>
                <button onClick={closeEdit} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
              </div>

              <div className="space-y-4">

                {/* Foto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto de la mascota</label>
                  {editModal.fotos[0] && !editNewPhoto && (
                    <img
                      src={editModal.fotos[0]}
                      alt="Foto actual"
                      className="w-full h-40 object-cover rounded-xl mb-2"
                    />
                  )}
                  {editNewPhoto && (
                    <div className="mb-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span className="text-sm text-green-700 truncate">✓ {editNewPhoto.name}</span>
                      <button
                        onClick={() => setEditNewPhoto(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 underline ml-2 flex-shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setEditNewPhoto(e.target.files?.[0] ?? null)}
                    />
                    📷 {editModal.fotos[0] ? 'Cambiar foto' : 'Subir foto'}
                  </label>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de reporte</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tipoReporte" value="PERDIDO"
                        checked={editForm.tipoReporte === 'PERDIDO'} onChange={handleEditChange} />
                      <span className="text-sm">🔍 Perdido</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tipoReporte" value="ENCONTRADO"
                        checked={editForm.tipoReporte === 'ENCONTRADO'} onChange={handleEditChange} />
                      <span className="text-sm">✅ Encontrado</span>
                    </label>
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre {editForm.tipoReporte === 'ENCONTRADO' && <span className="text-gray-400 font-normal">(opcional)</span>}
                  </label>
                  <input name="nombre" type="text" value={editForm.nombre} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="ej: Max" />
                </div>

                {/* Especie + Raza */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
                    <select name="especie" value={editForm.especie} onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                      {ESPECIES.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raza <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input name="raza" type="text" value={editForm.raza} onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="ej: Labrador" />
                  </div>
                </div>

                {/* Color + Tamaño */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <select name="color" value={editForm.color} onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                      <option value="">Selecciona...</option>
                      {COLORES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <select name="tamano" value={editForm.tamano} onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                      <option value="">Selecciona...</option>
                      {TAMANOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <select name="sexo" value={editForm.sexo} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                    <option value="">Selecciona...</option>
                    {SEXOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea name="descripcion" value={editForm.descripcion} onChange={handleEditChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    placeholder="Describe la mascota con todos los detalles posibles..." />
                  <p className="text-xs text-blue-500 mt-1">
                    La IA usa solo este texto para buscar coincidencias — sé lo más detallado posible.
                  </p>
                </div>

              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditSubmit}
                  disabled={savingEdit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button onClick={closeEdit}
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL — Caso resuelto (flow directo)
      ════════════════════════════════════════════════ */}
      {resolveModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4"
          onClick={() => setResolveModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">¡Caso resuelto!</h2>
              <button onClick={() => setResolveModal(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              Qué buena noticia. Cuéntanos cómo se resolvió el caso de{' '}
              <strong>{resolveModal.nombre || resolveModal.especie}</strong>:
            </p>

            <div className="space-y-2 mb-6">
              {RESOLVE_REASONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    resolveReason === opt.value
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolveReason"
                    value={opt.value}
                    checked={resolveReason === opt.value}
                    onChange={e => setResolveReason(e.target.value)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResolveDirect}
                disabled={!resolveReason || resolvingDirect}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resolvingDirect ? 'Guardando...' : 'Confirmar y cerrar caso'}
              </button>
              <button
                onClick={() => setResolveModal(null)}
                className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL — Match de reportes
      ════════════════════════════════════════════════ */}
      {matchModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4"
          onClick={closeMatchModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Match de reportes</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Coincidencias para <strong>{matchModal.nombre || matchModal.especie}</strong> — ordenadas por relevancia
                </p>
              </div>
              <button onClick={closeMatchModal} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Banner de confirmación + botón resolver */}
            {confirmedMatch && (
              <div className="mx-6 mt-4 bg-green-50 border border-green-300 rounded-xl p-4 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      ✓ Confirmaste a <strong>{confirmedMatch.nombre || confirmedMatch.especie}</strong> como la coincidencia
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Si estás 100% seguro, marca el caso como resuelto. Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <button
                    onClick={handleResolveFromMatch}
                    disabled={resolving}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                  >
                    {resolving ? 'Guardando...' : '✓ Marcar resuelto'}
                  </button>
                </div>
              </div>
            )}

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-0">

              {loadingMatches && (
                <div className="text-center py-10 text-gray-400">Buscando coincidencias con IA...</div>
              )}

              {!loadingMatches && matches.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500 mb-1">No se encontraron coincidencias</p>
                  <p className="text-gray-400 text-sm">
                    Intenta agregar una descripción más detallada al reporte para mejorar los resultados.
                  </p>
                </div>
              )}

              {!loadingMatches && matches.map((m, i) => {
                const pct         = matchPct(m);
                const isConfirmed = confirmedMatch?.id === m.id;
                const hasMap      = m.latitud != null && m.longitud != null;

                return (
                  <div
                    key={m.id}
                    className={`border rounded-xl p-4 transition-all ${
                      isConfirmed
                        ? 'border-green-400 bg-green-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Foto clickeable */}
                      {m.fotos?.[0] ? (
                        <button
                          className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-400 cursor-zoom-in"
                          onClick={() => setLightboxSrc(m.fotos[0])}
                          title="Ver foto en tamaño completo"
                        >
                          <img
                            src={m.fotos[0]}
                            alt={m.nombre ?? 'Mascota'}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </button>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
                          {especieEmoji(m.especie)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.tipoReporte === 'PERDIDO' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                            {m.tipoReporte === 'PERDIDO' ? '🔍 Perdido' : '✅ Encontrado'}
                          </span>
                          {pct != null ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                              {pct}% coincidencia
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              #{i + 1} en relevancia
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-800 text-sm">{m.nombre || 'Desconocido'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.especie}
                          {m.raza   ? ` — ${m.raza}`   : ''}
                          {m.color  ? ` · ${m.color}`  : ''}
                          {m.tamano ? ` · ${m.tamano}` : ''}
                        </p>
                        {m.descripcion && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{m.descripcion}</p>
                        )}
                        {m.distanciaKm != null && (
                          <p className="text-xs text-gray-400 mt-1">
                            📍 {m.distanciaKm < 1
                              ? `${Math.round(m.distanciaKm * 1000)} m de tu reporte`
                              : `${m.distanciaKm.toFixed(1)} km de tu reporte`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 justify-end">

                      {/* Ver en mapa */}
                      {hasMap && (
                        <button
                          onClick={() => handleVerEnMapa(m)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          🗺 Ver en mapa
                        </button>
                      )}

                      {/* Contactar con usuario — siempre visible */}
                      <button
                        onClick={() => openContactModal(m)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        📞 Contactar reportante
                      </button>

                      {/* Esta es mi mascota / Seleccionado */}
                      {isConfirmed ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-green-700">✓ Seleccionado</span>
                          <button
                            onClick={() => setConfirmedMatch(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                          >
                            Cambiar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmedMatch(m)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                        >
                          {matchModal.tipoReporte === 'PERDIDO'
                            ? '¡Esta es mi mascota!'
                            : '¡El dueño la encontró!'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL — Contacto del reportante
      ════════════════════════════════════════════════ */}
      {contactModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[4000] p-4"
          onClick={() => { setContactModal(null); setContactFetched(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Contactar reportante</h2>
              <button
                onClick={() => { setContactModal(null); setContactFetched(null); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Información de quien reportó{' '}
              <strong>{contactModal.nombre || contactModal.especie}</strong>:
            </p>

            {/* Estado: cargando */}
            {contactLoading && (
              <div className="text-center py-6 text-gray-400 text-sm">Cargando datos...</div>
            )}

            {/* Estado: datos cargados */}
            {!contactLoading && contactFetched && (
              <div className="space-y-3">
                {!contactFetched.nombre && !contactFetched.email && !contactFetched.telefono ? (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-xl flex-shrink-0">ℹ️</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Sin datos de contacto</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        El reportante no compartió información de contacto pública.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {contactFetched.nombre && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-lg">👤</span>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nombre</p>
                          <p className="text-sm font-semibold text-gray-800">{contactFetched.nombre}</p>
                        </div>
                      </div>
                    )}
                    {contactFetched.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-lg">✉️</span>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Correo</p>
                          <a
                            href={`mailto:${contactFetched.email}`}
                            className="text-sm font-semibold text-green-600 hover:text-green-800 underline"
                          >
                            {contactFetched.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {contactFetched.telefono && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-lg">📞</span>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Teléfono</p>
                          <a
                            href={`tel:${contactFetched.telefono}`}
                            className="text-sm font-semibold text-green-600 hover:text-green-800 underline"
                          >
                            {contactFetched.telefono}
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => { setContactModal(null); setContactFetched(null); }}
              className="w-full mt-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          LIGHTBOX — Foto en tamaño completo
      ════════════════════════════════════════════════ */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[5000] p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            ✕
          </button>
          <img
            src={lightboxSrc}
            alt="Foto de mascota"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </>
  );
}
