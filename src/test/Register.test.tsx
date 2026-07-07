import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';

const mockRegister = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isAuthenticated: false,
    isGuest: false,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
}

async function fillForm({
  name = 'Juan Pérez',
  email = 'juan@example.com',
  password = 'segura123',
  confirm = 'segura123',
  acceptTerms = true,
}: {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  acceptTerms?: boolean;
} = {}) {
  await userEvent.type(screen.getByLabelText(/nombre completo/i), name);
  await userEvent.type(screen.getByLabelText(/correo electrónico/i), email);
  await userEvent.type(screen.getByLabelText(/^contraseña$/i), password);
  await userEvent.type(screen.getByLabelText(/confirmar contraseña/i), confirm);
  if (acceptTerms) {
    await userEvent.click(screen.getByRole('checkbox'));
  }
}

describe('CP-01 — Register: registro exitoso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockResolvedValue(undefined);
  });

  it('envía el formulario con datos válidos y navega a /mapa', async () => {
    renderRegister();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('Juan Pérez', 'juan@example.com', 'segura123', undefined),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/mapa'));
  });
});

describe('CP-02 — Register: validación de contraseñas que no coinciden', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra error cuando las contraseñas no coinciden', async () => {
    renderRegister();
    await fillForm({ password: 'abc123', confirm: 'xyz999' });
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument(),
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('muestra error cuando la contraseña tiene menos de 6 caracteres', async () => {
    renderRegister();
    await fillForm({ password: '12345', confirm: '12345' });
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument(),
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });
});

describe('CP-03 — Register: error del backend', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra mensaje de error del servidor al fallar el registro', async () => {
    mockRegister.mockRejectedValue({
      response: { data: { message: 'El correo ya está registrado.' } },
    });
    renderRegister();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(screen.getByText(/el correo ya está registrado/i)).toBeInTheDocument(),
    );
  });

  it('muestra error genérico cuando el backend no devuelve mensaje', async () => {
    mockRegister.mockRejectedValue(new Error('Network Error'));
    renderRegister();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() =>
      expect(screen.getByText(/error al registrar usuario/i)).toBeInTheDocument(),
    );
  });
});

describe('CP-22 — Register: aceptación de términos y condiciones', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bloquea el envío si no se aceptan los términos', async () => {
    renderRegister();
    await fillForm({ acceptTerms: false });
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    // El mensaje aparece tanto en el banner general como junto al checkbox
    await waitFor(() =>
      expect(screen.getAllByText(/debes aceptar los términos/i).length).toBeGreaterThan(0),
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('abre el modal de términos al hacer clic en "Ver términos completos"', async () => {
    renderRegister();
    await userEvent.click(screen.getByRole('button', { name: /ver términos completos/i }));
    expect(screen.getByText(/términos y condiciones de uso/i)).toBeInTheDocument();
  });

  it('cierra el modal de términos al hacer clic en "Entendido"', async () => {
    renderRegister();
    await userEvent.click(screen.getByRole('button', { name: /ver términos completos/i }));
    await userEvent.click(screen.getByRole('button', { name: /entendido/i }));
    expect(screen.queryByText(/términos y condiciones de uso/i)).not.toBeInTheDocument();
  });
});
