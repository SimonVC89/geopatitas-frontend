import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Términos y Condiciones de Uso</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4">
          <p>
            Al registrarte en <strong>GeoPatitas</strong>, aceptas que tus datos de contacto
            —incluyendo nombre, correo electrónico y número de teléfono (si lo proporcionas)—
            podrán ser compartidos con otros usuarios registrados de la plataforma.
          </p>
          <p>
            Este intercambio de información es <strong>necesario para el funcionamiento de la app</strong>:
            GeoPatitas conecta a dueños de mascotas perdidas con personas que las han encontrado,
            por lo que para coordinar la reunificación de una mascota es indispensable que ambas
            partes puedan contactarse entre sí.
          </p>
          <p>
            Tu información <strong>no será vendida ni cedida a terceros</strong> fuera de la
            plataforma. Solo se mostrará a otros usuarios cuando exista un reporte de mascota
            relevante que requiera contacto directo (por ejemplo, al hacer match entre un reporte
            de mascota perdida y uno de mascota encontrada).
          </p>
          <p>
            Puedes dejar de usar la plataforma en cualquier momento. Si deseas eliminar tu cuenta
            y tus datos, contacta al administrador de la aplicación.
          </p>
          <p className="text-xs text-gray-500">
            Versión 1.0 — Junio 2025. GeoPatitas es un proyecto académico desarrollado en DuocUC.
          </p>
        </div>
        <div className="px-6 py-4 border-t text-right">
          <button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.phone || undefined);
      navigate('/mapa');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Error al registrar usuario. Intenta nuevamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Crear Cuenta
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Juan Pérez"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="+56 9 1234 5678"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-green-600 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer leading-snug">
                Acepto que mis datos de contacto (nombre, correo y teléfono) puedan ser compartidos
                con otros usuarios de GeoPatitas para facilitar la reunificación de mascotas perdidas.{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-green-600 hover:text-green-700 underline font-medium"
                >
                  Ver términos completos
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-gray-800">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
