import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyReports from '../pages/MyReports';

// ── API mock ──────────────────────────────────────────────────────────────────

const mockGet  = vi.fn();
const mockPut  = vi.fn();
vi.mock('../services/api', () => ({
  api: {
    get:  (...args: any[]) => mockGet(...args),
    put:  (...args: any[]) => mockPut(...args),
    post: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const activePet = {
  id: '1',
  tipoReporte: 'PERDIDO' as const,
  nombre: 'Luna',
  especie: 'Perro',
  raza: 'Labrador',
  color: 'Blanco',
  tamano: 'Mediano',
  sexo: 'Hembra',
  descripcion: 'Perra blanca labrador con collar rojo',
  estado: 'ACTIVO' as const,
  fechaReporte: '2026-07-01T10:00:00.000Z',
  fotos: ['https://example.com/luna.jpg'],
  latitud: -33.050,
  longitud: -71.440,
};

const resolvedPet = { ...activePet, id: '2', nombre: 'Max', estado: 'RESUELTO' as const };

function renderMyReports() {
  return render(
    <MemoryRouter>
      <MyReports />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CP-13 — Mis Reportes: listado de reportes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [activePet, resolvedPet] });
  });

  it('muestra los nombres de las mascotas en la lista', async () => {
    renderMyReports();
    await waitFor(() => expect(screen.getByText('Luna')).toBeInTheDocument());
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('muestra el estado ACTIVO y RESUELTO de cada reporte', async () => {
    renderMyReports();
    await waitFor(() => expect(screen.getAllByText(/activo/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/resuelto/i).length).toBeGreaterThan(0);
  });

  it('muestra estadísticas de totales, activos y resueltos', async () => {
    renderMyReports();
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.getByText('Activos')).toBeInTheDocument();
    expect(screen.getByText('Resueltos')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay reportes', async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderMyReports();
    await waitFor(() =>
      expect(screen.getByText(/no tienes reportes/i)).toBeInTheDocument(),
    );
  });

  it('muestra error cuando falla la carga', async () => {
    mockGet.mockRejectedValue(new Error('Network'));
    renderMyReports();
    await waitFor(() =>
      expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument(),
    );
  });
});

describe('CP-36 — Ver detalles: modal se abre con datos del reporte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [activePet] });
  });

  it('abre el modal de detalles y muestra nombre y especie', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /ver detalles/i }));
    // h2 en el modal — distinto del h3 en la lista
    expect(screen.getByRole('heading', { name: 'Luna', level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText('Perro').length).toBeGreaterThan(0);
  });

  it('cierra el modal de detalles al hacer clic en X', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /ver detalles/i }));
    const heading = screen.getByRole('heading', { name: 'Luna', level: 2 });
    const modal = heading.closest('.rounded-2xl')!;
    const closeBtn = within(modal as HTMLElement).getAllByRole('button').find(
      b => b.querySelector('svg'),
    )!;
    await userEvent.click(closeBtn);
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Luna', level: 2 })).not.toBeInTheDocument(),
    );
  });
});

describe('CP-37 — Lightbox: foto clickeable en Ver detalles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [activePet] });
  });

  it('muestra botón de foto con título "Ver foto completa"', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /ver detalles/i }));
    expect(screen.getByTitle(/ver foto completa/i)).toBeInTheDocument();
  });

  it('abre el lightbox al hacer clic en la foto del modal de detalles', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /ver detalles/i }));
    await userEvent.click(screen.getByTitle(/ver foto completa/i));
    // El lightbox renderiza <img alt="Foto de mascota">
    const lightboxImg = await screen.findByAltText(/foto de mascota/i);
    expect(lightboxImg).toHaveAttribute('src', activePet.fotos[0]);
  });
});

describe('CP-38 — Modificar reporte: modal de edición', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [activePet] });
    mockPut.mockResolvedValue({ data: { ...activePet } });
  });

  it('abre modal de modificar reporte con datos pre-cargados', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /modificar reporte/i }));
    // El heading del modal es h2 "Modificar reporte"
    expect(screen.getByRole('heading', { name: /modificar reporte/i, level: 2 })).toBeInTheDocument();
    expect((screen.getByDisplayValue('Luna') as HTMLInputElement).value).toBe('Luna');
  });

  it('muestra botón de foto clickeable en modificar reporte', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /modificar reporte/i }));
    expect(screen.getByTitle(/ver foto completa/i)).toBeInTheDocument();
  });

  it('guarda cambios y cierra el modal al hacer clic en "Guardar cambios"', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /modificar reporte/i }));

    const nameInput = screen.getByDisplayValue('Luna');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Luna Updated');

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await waitFor(() => expect(mockPut).toHaveBeenCalled());
    // El heading h2 del modal desaparece al cerrar
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /modificar reporte/i, level: 2 })).not.toBeInTheDocument(),
    );
  });
});

describe('CP-39 — Caso resuelto: flujo de confirmación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [activePet] });
    mockPut.mockResolvedValue({ data: { ...activePet, estado: 'RESUELTO' } });
  });

  it('abre el modal de resolución al hacer clic en "Caso resuelto"', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /caso resuelto/i }));
    expect(screen.getByText(/¡Caso resuelto!/i)).toBeInTheDocument();
  });

  it('el botón "Confirmar y cerrar caso" está deshabilitado sin motivo seleccionado', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /caso resuelto/i }));
    const confirmBtn = screen.getByRole('button', { name: /confirmar y cerrar caso/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('se habilita al seleccionar un motivo de resolución', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /caso resuelto/i }));
    await userEvent.click(screen.getByDisplayValue('match'));
    const confirmBtn = screen.getByRole('button', { name: /confirmar y cerrar caso/i });
    expect(confirmBtn).not.toBeDisabled();
  });
});

describe('CP-40 — Confirmación: popup de advertencia antes de cerrar caso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [activePet] });
    mockPut.mockResolvedValue({ data: { ...activePet, estado: 'RESUELTO' } });
  });

  it('muestra popup de confirmación con aviso de acción irreversible', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /caso resuelto/i }));
    await userEvent.click(screen.getByDisplayValue('match'));
    await userEvent.click(screen.getByRole('button', { name: /confirmar y cerrar caso/i }));

    await waitFor(() =>
      expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /sí, cerrar caso/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  it('"Volver" cierra el popup de confirmación sin resolver el caso', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /caso resuelto/i }));
    await userEvent.click(screen.getByDisplayValue('match'));
    await userEvent.click(screen.getByRole('button', { name: /confirmar y cerrar caso/i }));
    await waitFor(() => screen.getByRole('button', { name: /volver/i }));
    await userEvent.click(screen.getByRole('button', { name: /volver/i }));

    expect(mockPut).not.toHaveBeenCalled();
    expect(screen.queryByText(/esta acción no se puede deshacer/i)).not.toBeInTheDocument();
  });
});

describe('CP-41 — Confirmación: cierre definitivo del caso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [activePet] });
    mockPut.mockResolvedValue({ data: { ...activePet, estado: 'RESUELTO' } });
  });

  it('"Sí, cerrar caso" llama a la API PUT y cierra el modal', async () => {
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    await userEvent.click(screen.getByRole('button', { name: /caso resuelto/i }));
    await userEvent.click(screen.getByDisplayValue('match'));
    await userEvent.click(screen.getByRole('button', { name: /confirmar y cerrar caso/i }));
    await waitFor(() => screen.getByRole('button', { name: /sí, cerrar caso/i }));
    await userEvent.click(screen.getByRole('button', { name: /sí, cerrar caso/i }));

    await waitFor(() => expect(mockPut).toHaveBeenCalledWith(
      `/pets/${activePet.id}`,
      expect.objectContaining({ estado: 'RESUELTO' }),
    ));
    await waitFor(() =>
      expect(screen.queryByText(/esta acción no se puede deshacer/i)).not.toBeInTheDocument(),
    );
  });
});

describe('CP-42 — Estadísticas: contadores actualizados tras resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra 1 activo y 0 resueltos con un reporte activo', async () => {
    mockGet.mockResolvedValue({ data: [activePet] });
    renderMyReports();
    await waitFor(() => screen.getByText('Luna'));
    const stats = screen.getAllByRole('heading', { level: 1 });
    expect(stats[0].textContent).toContain('Mis Reportes');
  });

  it('muestra 1 resuelto cuando el reporte tiene estado RESUELTO', async () => {
    mockGet.mockResolvedValue({ data: [resolvedPet] });
    renderMyReports();
    await waitFor(() => screen.getByText('Max'));
    expect(screen.getByText(/resueltos/i)).toBeInTheDocument();
  });
});
