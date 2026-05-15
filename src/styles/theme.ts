import type { CSSProperties } from 'react';

// Paleta de colores oficial GeoPatitas
export const colors = {
  green:  '#78B864',
  blue:   '#78BBE6',
  yellow: '#EFBF5C',
  dark:   '#2D3748',
  bg:     '#F4F7F4',
} as const;

// Objetos de estilo reutilizables en JSX (para props que requieren JS, como Leaflet o Lucide)
export const card: CSSProperties = {
  background: 'white',
  borderRadius: '1.25rem',
  padding: '1.6rem',
  border: '1px solid #E8EBE8',
};

export const sectionTitle: CSSProperties = {
  textAlign: 'center',
  fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
  fontWeight: 800,
  color: colors.dark,
  marginBottom: '0.5rem',
};

export const sectionSubtitle: CSSProperties = {
  textAlign: 'center',
  color: '#718096',
  fontSize: '0.9rem',
  marginBottom: '1.75rem',
};

export const gradientDivider: CSSProperties = {
  width: 52,
  height: 4,
  borderRadius: 99,
  background: `linear-gradient(90deg, ${colors.green}, ${colors.blue})`,
  margin: '0 auto 1.25rem',
};
