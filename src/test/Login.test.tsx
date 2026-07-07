import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock useAuth
const mockLogin = vi.fn();
const mockContinueAsGuest = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    continueAsGuest: mockContinueAsGuest,
    user: null,
    isAuthenticated: false,
    isGuest: false,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('CP-04 — Login: campos y envío exitoso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  it('renderiza los campos de email y contraseña', () => {
    renderLogin();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('llama a login con email y password correctos y navega a /', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'secret123'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('botón muestra estado de carga al enviar', async () => {
    let resolve: () => void;
    mockLogin.mockReturnValue(new Promise<void>(r => { resolve = r; }));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
    resolve!();
  });
});

describe('CP-05 — Login: manejo de error de credenciales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockRejectedValue(new Error('401'));
  });

  it('muestra mensaje de error cuando el login falla', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'bad@email.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(screen.getByText(/error al iniciar sesión/i)).toBeInTheDocument(),
    );
  });

  it('no navega cuando el login falla', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(screen.getByText(/error al iniciar sesión/i)).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('CP-06: modo invitado llama continueAsGuest y navega a /mapa', async () => {
    vi.clearAllMocks();
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /continuar como invitado/i }));
    expect(mockContinueAsGuest).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/mapa');
  });
});
