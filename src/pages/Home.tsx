import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FDFBF7 0%, #EFF8EC 50%, #E8F4FB 100%)',
          paddingTop: '6rem',
          paddingBottom: '8rem',
        }}
      >
        {/* Blobs decorativos */}
        <div
          style={{
            position: 'absolute', top: '-80px', right: '-80px',
            width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120,187,230,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-60px', left: '-60px',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120,184,100,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container mx-auto px-6 relative" style={{ zIndex: 1 }}>
          <div className="max-w-3xl mx-auto text-center">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white border border-green-200 shadow-sm"
              style={{ animation: 'pulse 3s ease-in-out infinite' }}
            >
              <span
                className="w-2 h-2 rounded-full bg-green-500"
                style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
              />
              <span className="text-xs font-bold text-green-700 tracking-widest uppercase">
                Monitoreo activo · V Región
              </span>
            </div>

            {/* Título */}
            <h1
              className="font-extrabold tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                lineHeight: 1.1,
                color: '#2D3748',
              }}
            >
              Juntos es más fácil{' '}
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #78B864, #78BBE6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                encontrar a tu mascota
              </span>
            </h1>

            {/* Subtítulo */}
            <p
              className="mb-10 leading-relaxed"
              style={{ fontSize: '1.2rem', color: '#4A5568', maxWidth: '38rem', margin: '0 auto 2.5rem' }}
            >
              Sabemos lo difícil que es perder a un amigo.{' '}
              <strong style={{ color: '#2D3748' }}>GeoPatitas</strong> usa inteligencia
              artificial y la comunidad para reunir familias en Valparaíso, Viña del Mar y Quilpué.
            </p>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/reportar"
                style={{
                  background: '#EFBF5C',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '1rem 2rem',
                  borderRadius: '1rem',
                  fontSize: '1.1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 25px rgba(239,191,92,0.35)',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 35px rgba(239,191,92,0.45)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(239,191,92,0.35)';
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Perdí a mi mascota
              </Link>

              <Link
                to="/reportar?type=found"
                style={{
                  background: '#fff',
                  color: '#78B864',
                  fontWeight: 700,
                  padding: '1rem 2rem',
                  borderRadius: '1rem',
                  fontSize: '1.1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '2px solid #78B864',
                  boxShadow: '0 4px 15px rgba(120,184,100,0.15)',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#78B864';
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = '#fff';
                  (e.currentTarget as HTMLElement).style.color = '#78B864';
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
                Encontré una mascota
              </Link>

              <Link
                to="/mapa"
                style={{
                  background: '#fff',
                  color: '#78BBE6',
                  fontWeight: 700,
                  padding: '1rem 2rem',
                  borderRadius: '1rem',
                  fontSize: '1.1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '2px solid #78BBE6',
                  boxShadow: '0 4px 15px rgba(120,187,230,0.15)',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#78BBE6';
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = '#fff';
                  (e.currentTarget as HTMLElement).style.color = '#78BBE6';
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ver Mapa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #F0F0F0', padding: '2.5rem 0' }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto text-center">
            {[
              { value: 'V Región', label: 'Cobertura activa', color: '#78B864' },
              { value: '24/7', label: 'Monitoreo continuo', color: '#78BBE6' },
              { value: '+85%', label: 'Precisión de la IA', color: '#EFBF5C' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.4rem', fontWeight: 500 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={{ background: '#FAFAFA', padding: '6rem 0' }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: '#2D3748',
                marginBottom: '0.75rem',
              }}
            >
              Tecnología al servicio del reencuentro
            </h2>
            <div
              style={{
                width: '64px', height: '4px', borderRadius: '99px',
                background: 'linear-gradient(90deg, #78B864, #78BBE6)',
                margin: '0 auto 1rem',
              }}
            />
            <p style={{ color: '#718096', fontSize: '1.05rem', maxWidth: '30rem', margin: '0 auto' }}>
              Herramientas pensadas para quienes más las necesitan, en el momento en que más las necesitan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: (
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                color: '#78B864',
                bg: 'rgba(120,184,100,0.1)',
                shadow: 'rgba(120,184,100,0.15)',
                title: 'Georreferenciación',
                desc: 'Marca exactamente dónde perdiste o encontraste a la mascota. El sistema monitorea automáticamente un radio de 5 km.',
              },
              {
                icon: (
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="13" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6M12 17v4" />
                    <circle cx="12" cy="10" r="2" />
                  </svg>
                ),
                color: '#78BBE6',
                bg: 'rgba(120,187,230,0.1)',
                shadow: 'rgba(120,187,230,0.15)',
                title: 'Inteligencia Artificial',
                desc: 'Nuestra IA compara fotos y descripciones buscando similitudes, aunque los detalles del reporte varíen.',
              },
              {
                icon: (
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                color: '#EFBF5C',
                bg: 'rgba(239,191,92,0.1)',
                shadow: 'rgba(239,191,92,0.15)',
                title: 'Alertas Inmediatas',
                desc: 'Te avisamos por correo apenas detectemos una coincidencia mayor al 85%, sin que tengas que estar pendiente.',
              },
            ].map(card => (
              <div
                key={card.title}
                style={{
                  background: '#fff',
                  borderRadius: '1.5rem',
                  padding: '2.5rem 2rem',
                  border: '1px solid #EFEFEF',
                  boxShadow: `0 4px 24px ${card.shadow}`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${card.shadow}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${card.shadow}`;
                }}
              >
                <div
                  style={{
                    width: '64px', height: '64px', borderRadius: '1rem',
                    background: card.bg, color: card.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  {card.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2D3748', marginBottom: '0.75rem' }}>
                  {card.title}
                </h3>
                <p style={{ color: '#4A5568', lineHeight: 1.7, fontSize: '0.95rem' }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            borderRadius: '2rem',
            background: 'linear-gradient(135deg, #2D3748 0%, #3D4E6A 100%)',
            padding: '4rem 3rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(45,55,72,0.3)',
          }}
        >
          {/* Blobs CTA */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(120,184,100,0.18)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(120,187,230,0.18)', filter: 'blur(60px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '1rem' }}>
              Actúa rápido,{' '}
              <span style={{ color: '#EFBF5C' }}>crea tu reporte ahora.</span>
            </h2>
            <p style={{ color: '#CBD5E0', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Puedes continuar como invitado si estás con prisa, o crear una cuenta gratuita para gestionar tus alertas.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
            <Link
              to="/register"
              style={{
                background: '#78B864',
                color: '#fff',
                fontWeight: 700,
                padding: '1rem 2.5rem',
                borderRadius: '0.875rem',
                fontSize: '1.05rem',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(120,184,100,0.4)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#68A554'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#78B864'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              Crear Cuenta Gratis
            </Link>
            <Link
              to="/login"
              style={{
                background: 'transparent',
                color: '#fff',
                fontWeight: 600,
                padding: '1rem 2.5rem',
                borderRadius: '0.875rem',
                fontSize: '1.05rem',
                textDecoration: 'none',
                textAlign: 'center',
                border: '1.5px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; }}
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
