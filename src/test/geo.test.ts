import { describe, it, expect } from 'vitest';
import { isInsidePolygon, COVERAGE_ZONE, SEA_ZONE } from '../utils/geo';

describe('Validación de zona geográfica', () => {

  // CP-32 — punto válido en tierra firme
  it('CP-32: Quilpué (tierra + dentro de cobertura) es una ubicación válida', () => {
    const lat = -33.050, lng = -71.440;
    expect(isInsidePolygon(lat, lng, COVERAGE_ZONE)).toBe(true);
    expect(isInsidePolygon(lat, lng, SEA_ZONE)).toBe(false);
  });

  it('CP-32: Valparaíso centro (tierra + dentro de cobertura) es una ubicación válida', () => {
    const lat = -33.040, lng = -71.500;
    expect(isInsidePolygon(lat, lng, COVERAGE_ZONE)).toBe(true);
    expect(isInsidePolygon(lat, lng, SEA_ZONE)).toBe(false);
  });

  // CP-30 — fuera de la zona de cobertura
  it('CP-30: Santiago está fuera de la zona de cobertura', () => {
    const lat = -33.457, lng = -70.648;
    expect(isInsidePolygon(lat, lng, COVERAGE_ZONE)).toBe(false);
  });

  it('CP-30: punto al norte de la zona está fuera de cobertura', () => {
    const lat = -32.800, lng = -71.520;
    expect(isInsidePolygon(lat, lng, COVERAGE_ZONE)).toBe(false);
  });

  it('CP-30: punto al sur de la zona está fuera de cobertura', () => {
    const lat = -33.250, lng = -71.500;
    expect(isInsidePolygon(lat, lng, COVERAGE_ZONE)).toBe(false);
  });

  // CP-31 — en el Océano Pacífico
  it('CP-31: punto en el Océano Pacífico está dentro de COVERAGE_ZONE pero dentro de SEA_ZONE', () => {
    const lat = -33.020, lng = -71.700;
    expect(isInsidePolygon(lat, lng, COVERAGE_ZONE)).toBe(true);
    expect(isInsidePolygon(lat, lng, SEA_ZONE)).toBe(true);
  });

  it('CP-31: punto frente a la costa norte (zona de mar) está en SEA_ZONE', () => {
    const lat = -32.960, lng = -71.680;
    expect(isInsidePolygon(lat, lng, SEA_ZONE)).toBe(true);
  });

});
