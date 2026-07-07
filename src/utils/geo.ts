// Polígono de cobertura — Gran Valparaíso [lng, lat]
export const COVERAGE_ZONE: [number, number][] = [
  [-71.720, -32.940],
  [-71.555, -32.930],
  [-71.430, -32.958],
  [-71.375, -33.015],
  [-71.375, -33.098],
  [-71.445, -33.148],
  [-71.720, -33.112],
  [-71.720, -32.940],
];

// Línea de costa — delimita el Océano Pacífico dentro de COVERAGE_ZONE [lng, lat]
export const SEA_ZONE: [number, number][] = [
  [-71.720, -32.940],
  [-71.520, -32.918],
  [-71.537, -32.953],
  [-71.552, -32.968],
  [-71.562, -32.984],
  [-71.578, -33.003],
  [-71.590, -33.015],
  [-71.638, -33.029],
  [-71.662, -33.042],
  [-71.660, -33.060],
  [-71.683, -33.118],
  [-71.720, -33.112],
  [-71.720, -32.940],
];

// Ray casting — devuelve true si el punto (lat, lng) está dentro del polígono [lng, lat]
export function isInsidePolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
