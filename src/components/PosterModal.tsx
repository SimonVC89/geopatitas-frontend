import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'leaflet/dist/leaflet.css';
import logoGeopatitas from '../assets/Logo Geopatitas.png';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Pet = {
  nombre: string | null;
  especie: string;
  raza: string | null;
  color: string | null;
  tamano: string | null;
  sexo: string | null;
  descripcion: string;
  fechaReporte: string;
  fotos: string[];
  latitud: number;
  longitud: number;
};

type ContactEntry = { type: 'phone' | 'email' | 'other'; value: string };

interface Props {
  pet: Pet;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMOJI: Record<string, string> = {
  Perro: '🐶', Gato: '🐱', Ave: '🐦', Conejo: '🐰',
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(iso));

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PosterModal({ pet, onClose }: Props) {
  const posterRef = useRef<HTMLDivElement>(null);

  const [desc,            setDesc]            = useState(pet.descripcion);
  const [contacts,        setContacts]        = useState<ContactEntry[]>([]);
  const [address,         setAddress]         = useState<string>('');
  const [city,            setCity]            = useState<string>('');
  const [addressLoading,  setAddressLoading]  = useState(true);
  const [downloading,     setDownloading]     = useState(false);
  const [downloadError,   setDownloadError]   = useState<string | null>(null);
  const [capturing,       setCapturing]       = useState(false);
  const [photoPos,        setPhotoPos]        = useState({ x: 50, y: 30 });
  const [photoDragging,   setPhotoDragging]   = useState(false);

  // refs para el drag
  const isDragging  = useRef(false);
  const lastMouse   = useRef({ x: 0, y: 0 });
  const currentPos  = useRef({ x: 50, y: 30 });

  // refs para el canvas de la foto (evitan objectFit/objectPosition en html2canvas)
  const photoCanvasRef  = useRef<HTMLCanvasElement>(null);
  const photoWrapperRef = useRef<HTMLDivElement>(null);
  const photoImageRef   = useRef<HTMLImageElement | null>(null);
  const photoPosRef     = useRef({ x: 50, y: 30 });

  const emoji = EMOJI[pet.especie] ?? '🐾';

  // Dibuja la foto en el canvas respetando cover + position
  const drawPhoto = () => {
    const canvas = photoCanvasRef.current;
    const img    = photoImageRef.current;
    if (!canvas || !img || canvas.width === 0 || canvas.height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = photoPosRef.current;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const sw = img.naturalWidth  * scale;
    const sh = img.naturalHeight * scale;
    const ox = (x / 100) * Math.max(0, sw - cw);
    const oy = (y / 100) * Math.max(0, sh - ch);

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, -ox, -oy, sw, sh);
  };

  // Carga la imagen al montar el modal
  useEffect(() => {
    if (!pet.fotos?.[0]) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { photoImageRef.current = img; drawPhoto(); };
    img.src = pet.fotos[0];
  }, []);

  // Redibuja cuando cambia la posición
  useEffect(() => {
    photoPosRef.current = photoPos;
    drawPhoto();
  }, [photoPos]);

  // Mantiene las dimensiones del canvas iguales al wrapper (con 2× para calidad)
  useEffect(() => {
    const wrapper = photoWrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const canvas = photoCanvasRef.current;
      if (!canvas || width === 0 || height === 0) return;
      canvas.width  = Math.round(width  * 2);
      canvas.height = Math.round(height * 2);
      drawPhoto();
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  // Reverse geocoding — precarga dirección y ciudad, ambas editables
  useEffect(() => {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pet.latitud}&lon=${pet.longitud}&accept-language=es`,
    )
      .then(r => r.json())
      .then(d => {
        setAddress(d.display_name ?? `${pet.latitud.toFixed(5)}, ${pet.longitud.toFixed(5)}`);
        const a = d.address ?? {};
        setCity(a.city ?? a.town ?? a.municipality ?? a.village ?? '');
      })
      .catch(() => setAddress(`${pet.latitud.toFixed(5)}, ${pet.longitud.toFixed(5)}`))
      .finally(() => setAddressLoading(false));
  }, [pet.latitud, pet.longitud]);

  // Drag-to-reposition foto
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current  = true;
    lastMouse.current   = { x: e.clientX, y: e.clientY };
    currentPos.current  = { ...photoPos };
    setPhotoDragging(true);

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = ev.clientX - lastMouse.current.x;
      const dy = ev.clientY - lastMouse.current.y;
      lastMouse.current = { x: ev.clientX, y: ev.clientY };
      currentPos.current = {
        x: Math.max(0, Math.min(100, currentPos.current.x - dx / 4)),
        y: Math.max(0, Math.min(100, currentPos.current.y - dy / 3)),
      };
      photoPosRef.current = { ...currentPos.current };
      drawPhoto();
      setPhotoPos({ ...currentPos.current });
    };

    const onUp = () => {
      isDragging.current = false;
      setPhotoDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Contactos
  const addContact    = () => setContacts(prev => [...prev, { type: 'phone', value: '' }]);
  const removeContact = (i: number) => setContacts(prev => prev.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: keyof ContactEntry, val: string) =>
    setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  // Descarga PDF
  const handleDownload = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    setDownloadError(null);
    setCapturing(true);
    try {
      // Dar tiempo a que los tiles del mapa y la foto carguen
      await new Promise(r => setTimeout(r, 900));

      const canvas = await html2canvas(posterRef.current, {
        useCORS:         true,
        allowTaint:      false,
        scale:           2,
        backgroundColor: '#ffffff',
        logging:         false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = pdf.internal.pageSize.getHeight();

      // Ajustar proporciones al tamaño carta sin deformar
      const ratio     = Math.min(pdfW / canvas.width, pdfH / canvas.height);
      const imgW      = canvas.width  * ratio;
      const imgH      = canvas.height * ratio;
      const marginX   = (pdfW - imgW) / 2;
      const marginY   = (pdfH - imgH) / 2;

      pdf.addImage(imgData, 'PNG', marginX, marginY, imgW, imgH);
      pdf.save(`poster-${(pet.nombre ?? 'mascota').toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch {
      setDownloadError('Error al generar el PDF. Intenta nuevamente.');
    } finally {
      setCapturing(false);
      setDownloading(false);
    }
  };

  const pinIcon = new DivIcon({
    html: `<div style="width:14px;height:14px;background:#dc2626;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
    className:  '',
  });

  const filledContacts = contacts.filter(c => c.value.trim());
  const details: [string, string | null][] = [
    ['Especie', pet.especie],
    ['Raza',    pet.raza],
    ['Color',   pet.color],
    ['Tamaño',  pet.tamano],
    ['Sexo',    pet.sexo],
    ['Ciudad',  city || null],
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[4000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header del modal ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Generar póster "Se busca"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">

          {/* ══ Columna izquierda: formulario editable ══ */}
          <div className="lg:w-72 flex-shrink-0 p-6 border-r border-gray-100 space-y-5">

            {/* Descripción */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Descripción</label>
              <p className="text-xs text-gray-400 mb-2">
                Personaliza el texto que aparecerá en el póster
              </p>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={7}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Describe a tu mascota…"
              />
            </div>

            {/* Última vez visto — editable */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Última vez visto/a</label>
              <p className="text-xs text-gray-400 mb-2">
                Precargada desde las coordenadas del reporte — corrígela si no es exacta
              </p>
              {addressLoading ? (
                <div className="text-xs text-gray-400 py-2">Cargando dirección…</div>
              ) : (
                <>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    placeholder="Ej: Cerro Alegre, Valparaíso"
                  />
                  <label className="text-xs font-semibold text-gray-600 block mt-2 mb-1">Ciudad</label>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    placeholder="Ej: Valparaíso"
                  />
                </>
              )}
            </div>

            {/* Contacto */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Contacto</label>
              <p className="text-xs text-gray-400 mb-3">
                Agrega los medios por los que quieres ser contactado
              </p>

              <div className="space-y-2">
                {contacts.map((c, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <select
                      value={c.type}
                      onChange={e => updateContact(i, 'type', e.target.value as ContactEntry['type'])}
                      className="border border-gray-300 rounded-lg px-1.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-400"
                    >
                      <option value="phone">📞</option>
                      <option value="email">📧</option>
                      <option value="other">💬</option>
                    </select>
                    <input
                      value={c.value}
                      onChange={e => updateContact(i, 'value', e.target.value)}
                      placeholder={
                        c.type === 'phone'  ? '+56 9 1234 5678'
                        : c.type === 'email' ? 'correo@ejemplo.com'
                        : 'Instagram, WhatsApp, etc.'
                      }
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                    <button
                      onClick={() => removeContact(i)}
                      className="text-red-300 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addContact}
                className="mt-2.5 text-sm text-green-600 hover:text-green-700 font-semibold"
              >
                + Agregar contacto
              </button>
            </div>

            {/* Botón descarga */}
            <div className="pt-1">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Download size={17} />
                {downloading ? 'Generando PDF…' : 'Descargar PDF'}
              </button>

              {downloadError && (
                <p className="text-xs text-red-500 text-center mt-2">{downloadError}</p>
              )}

              <p className="text-[11px] text-gray-400 text-center mt-2">
                Tamaño carta · Listo para imprimir
              </p>
            </div>
          </div>

          {/* ══ Columna derecha: póster capturable ══ */}
          <div className="flex-1 p-6 overflow-auto flex flex-col items-center bg-gray-50">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-4">
              Previsualización del póster
            </p>

            {/*
              Este div es lo que captura html2canvas.
              Todos los estilos son inline para asegurar que se capturen correctamente.
            */}
            <div
              ref={posterRef}
              style={{
                width:           '540px',
                backgroundColor: '#ffffff',
                fontFamily:      '"Helvetica Neue", Arial, Helvetica, sans-serif',
                border:          '1px solid #d1d5db',
                borderRadius:    '4px',
                overflow:        'hidden',
                flexShrink:      0,
                boxShadow:       '0 4px 24px rgba(0,0,0,.10)',
              }}
            >
              {/* ── Header "¡SE BUSCA!" ── */}
              <div style={{
                background:  'linear-gradient(135deg,#b91c1c 0%,#dc2626 100%)',
                padding:     '18px 28px',
                textAlign:   'center',
              }}>
                <div style={{ color: '#fca5a5', fontSize: '11px', letterSpacing: '5px', marginBottom: '2px', fontWeight: '600' }}>
                  MASCOTA PERDIDA
                </div>
                <div style={{ color: '#ffffff', fontSize: '46px', fontWeight: '900', letterSpacing: '3px', lineHeight: '1' }}>
                  ¡SE BUSCA!
                </div>
                <div style={{ color: '#fecaca', fontSize: '11px', marginTop: '5px' }}>
                  Si la encuentras, por favor comunícate con su dueño
                </div>
              </div>

              {/* ── Foto portrait + Datos (layout volante clásico) ── */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', minHeight: '340px' }}>

                {/* Foto portrait arrastrable */}
                <div
                  ref={photoWrapperRef}
                  onMouseDown={pet.fotos?.[0] ? startDrag : undefined}
                  style={{
                    width: '210px', flexShrink: 0, alignSelf: 'stretch',
                    cursor: pet.fotos?.[0] ? (photoDragging ? 'grabbing' : 'grab') : 'default',
                    overflow: 'hidden', position: 'relative', userSelect: 'none',
                    borderRight: '1px solid #f3f4f6', backgroundColor: '#f1f5f9',
                  }}
                >
                  {pet.fotos?.[0] ? (
                    <>
                      {/* Canvas: dibuja la foto con recorte correcto para que html2canvas lo capture bien */}
                      <canvas
                        ref={photoCanvasRef}
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: '100%', height: '100%',
                          display: 'block', pointerEvents: 'none',
                        }}
                      />
                      {!photoDragging && !capturing && (
                        <div style={{
                          position: 'absolute', bottom: '8px', left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0,0,0,0.5)', color: '#fff', whiteSpace: 'nowrap',
                          fontSize: '9px', padding: '3px 8px', borderRadius: '99px',
                          pointerEvents: 'none',
                        }}>
                          ✥ Arrastra para encuadrar
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px',
                    }}>
                      {emoji}
                    </div>
                  )}
                </div>

                {/* Columna derecha: nombre + datos + descripción */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                  {/* Nombre y fecha */}
                  <div style={{ padding: '14px 16px 10px' }}>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#111827', lineHeight: '1.15' }}>
                      {pet.nombre ?? 'Desconocido'} {emoji}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                      Reportado el {fmt(pet.fechaReporte)}
                    </div>
                  </div>

                  {/* Detalles en lista */}
                  <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    {details.filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'baseline' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '800', color: '#9ca3af',
                          letterSpacing: '1.5px', minWidth: '58px', flexShrink: 0,
                        }}>
                          {k.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '12.5px', color: '#1f2937', fontWeight: '500' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Descripción (en la columna derecha) */}
                  <div style={{ padding: '10px 16px', flex: 1, backgroundColor: '#fafafa' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', letterSpacing: '3px', marginBottom: '5px' }}>
                      DESCRIPCIÓN
                    </div>
                    <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {desc || 'Sin descripción.'}
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Última vez visto + mapa ── */}
              <div style={{ padding: '13px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', letterSpacing: '3px', marginBottom: '6px' }}>
                    ÚLTIMA VEZ VISTO/A
                  </div>
                  {addressLoading ? (
                    <div style={{ fontSize: '12px', color: '#d1d5db' }}>Cargando dirección…</div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>
                      {address || `${pet.latitud.toFixed(5)}, ${pet.longitud.toFixed(5)}`}
                    </div>
                  )}
                </div>

                {/* Mini mapa */}
                <div style={{
                  width: '170px', height: '120px', flexShrink: 0,
                  borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb',
                }}>
                  <MapContainer
                    center={[pet.latitud, pet.longitud]}
                    zoom={15}
                    style={{ width: '170px', height: '120px' }}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      crossOrigin="anonymous"
                    />
                    <Marker position={[pet.latitud, pet.longitud]} icon={pinIcon} />
                  </MapContainer>
                </div>
              </div>

              {/* ── Contacto (solo si hay entradas) ── */}
              {filledContacts.length > 0 && (
                <div style={{ padding: '13px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fffbeb' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#92400e', letterSpacing: '3px', marginBottom: '8px' }}>
                    CONTACTO
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {filledContacts.map((c, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#78350f', fontWeight: '600' }}>
                        {c.type === 'phone' ? '📞' : c.type === 'email' ? '📧' : '💬'} {c.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Footer GeoPatitas ── */}
              <div style={{
                padding:         '11px 20px',
                backgroundColor: '#f9fafb',
                borderTop:       '1px solid #f3f4f6',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             '10px',
              }}>
                <img
                  src={logoGeopatitas}
                  alt="GeoPatitas"
                  style={{ height: '26px', objectFit: 'contain' }}
                />
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Reporte publicado en <strong style={{ color: '#374151' }}>GeoPatitas</strong>
                </div>
              </div>

            </div>
            {/* fin posterRef */}
          </div>

        </div>
      </div>
    </div>
  );
}
