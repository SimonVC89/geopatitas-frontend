import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateReport from '../pages/CreateReport';

// ── Mocks de infraestructura ──────────────────────────────────────────────────

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="location-preview-map">{children}</div>
  ),
  TileLayer: () => null,
  Marker:    () => null,
}));

// DivIcon se instancia con `new` a nivel de módulo — debe ser un constructor real
vi.mock('leaflet', () => ({
  DivIcon: class {},
}));

vi.mock('../services/api', () => ({
  api: { post: vi.fn(), get: vi.fn(), put: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: '1', name: 'Test' } }),
}));

const mockNavigate    = vi.hoisted(() => vi.fn());
const mockUseLocation = vi.hoisted(() =>
  vi.fn(() => ({ state: null as any, pathname: '/reportar', search: '' })),
);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate:     () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useLocation:     mockUseLocation,
  };
});

// ── Helpers de geolocalización ────────────────────────────────────────────────

function setGeoSuccess(lat: number, lng: number) {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn(ok =>
        ok({ coords: { latitude: lat, longitude: lng, accuracy: 50 } }),
      ),
    },
    configurable: true,
    writable: true,
  });
}

function setGeoError(code: number) {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn((_ok, fail) => fail({ code, message: '' })),
    },
    configurable: true,
    writable: true,
  });
}

function renderCreateReport() {
  return render(
    <MemoryRouter>
      <CreateReport />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CP-43 — CreateReport: botones de ubicación visibles antes de elegir', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el botón de mapa y el de GPS cuando no hay ubicación elegida', () => {
    renderCreateReport();
    expect(screen.getByRole('button', { name: /seleccionar ubicación en el mapa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /usar mi ubicación actual/i })).toBeInTheDocument();
  });
});

describe('CP-44 — CreateReport GPS: éxito con coordenadas dentro de cobertura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGeoSuccess(-33.050, -71.440); // Quilpué — cobertura, tierra firme
  });

  it('muestra confirmación "Ubicación GPS obtenida" tras recibir coordenadas válidas', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() =>
      expect(screen.getByText(/ubicación gps obtenida/i)).toBeInTheDocument(),
    );
  });

  it('muestra aviso de posición aproximada al usar GPS', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() =>
      expect(screen.getByText(/posición aproximada/i)).toBeInTheDocument(),
    );
  });

  it('renderiza el mini-mapa de preview tras confirmar ubicación GPS', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() =>
      expect(screen.getByTestId('location-preview-map')).toBeInTheDocument(),
    );
  });
});

describe('CP-45 — CreateReport GPS: permiso de geolocalización denegado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGeoError(1); // PERMISSION_DENIED
  });

  it('muestra error de permiso denegado', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() =>
      expect(screen.getByText(/permiso de ubicación denegado/i)).toBeInTheDocument(),
    );
  });

  it('no marca la ubicación como confirmada si el permiso fue denegado', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() => screen.getByText(/permiso de ubicación denegado/i));
    expect(screen.queryByText(/ubicación gps obtenida/i)).not.toBeInTheDocument();
  });
});

describe('CP-46 — CreateReport GPS: coordenadas fuera del área de cobertura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGeoSuccess(-33.457, -70.648); // Santiago — fuera de COVERAGE_ZONE
  });

  it('muestra error de cobertura cuando el GPS está fuera del Gran Valparaíso', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() =>
      expect(screen.getByText(/fuera del área de cobertura/i)).toBeInTheDocument(),
    );
  });
});

describe('CP-47 — CreateReport GPS: zona costera no bloquea por imprecisión de desktop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGeoSuccess(-33.020, -71.700); // Dentro de COVERAGE_ZONE y SEA_ZONE (costa)
  });

  it('acepta la posición GPS aunque caiga en SEA_ZONE por imprecisión de escritorio', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() =>
      expect(screen.getByText(/ubicación gps obtenida/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/en el mar/i)).not.toBeInTheDocument();
  });
});

describe('CP-48 — CreateReport: mini-mapa aparece también con ubicación elegida en el mapa', () => {
  afterEach(() => {
    mockUseLocation.mockReturnValue({ state: null, pathname: '/reportar', search: '' });
    sessionStorage.clear();
  });

  it('muestra el mini-mapa de preview cuando la ubicación viene del selector del mapa', () => {
    mockUseLocation.mockReturnValue({
      state: { lat: -33.050, lng: -71.440 } as any,
      pathname: '/reportar',
      search: '',
    });
    renderCreateReport();
    expect(screen.getByTestId('location-preview-map')).toBeInTheDocument();
  });
});

describe('CP-49 — CreateReport GPS: botón "Cambiar" resetea la ubicación GPS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGeoSuccess(-33.050, -71.440);
  });

  it('"Cambiar" restaura los botones de selección de ubicación y oculta la confirmación GPS', async () => {
    renderCreateReport();
    await userEvent.click(screen.getByRole('button', { name: /usar mi ubicación actual/i }));
    await waitFor(() => screen.getByText(/ubicación gps obtenida/i));
    await userEvent.click(screen.getByRole('button', { name: /cambiar/i }));
    expect(screen.getByRole('button', { name: /usar mi ubicación actual/i })).toBeInTheDocument();
    expect(screen.queryByText(/ubicación gps obtenida/i)).not.toBeInTheDocument();
  });
});
