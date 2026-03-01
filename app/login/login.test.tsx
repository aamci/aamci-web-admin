import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock AuthProvider
const mockLogin = vi.fn();
vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// Import after mocks
import LoginPage from './page';

describe('LoginPage (web-admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders the admin login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Connexion administrateur')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    // fetch never resolves during this test
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(screen.getByRole('button', { name: 'Connexion…' })).toBeDisabled();
  });

  it('shows error message on failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Identifiants incorrects' }),
    } as Response);

    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'wrong@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'bad-password');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
    });
  });

  it('shows access denied for non-ADMIN role', async () => {
    const user = userEvent.setup();

    // Login fetch succeeds
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      } as Response)
      // /auth/me returns a DOCTOR
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', email: 'doc@test.com', role: 'DOCTOR' }),
      } as Response);

    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'doc@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByText('Accès refusé : compte non administrateur.')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to /dashboard for ADMIN role', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'admin-token' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', email: 'admin@test.com', role: 'ADMIN' }),
      } as Response);

    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
    expect(localStorage.getItem('token')).toBe('admin-token');
  });

  it('shows network error message on fetch exception', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByText('Erreur de connexion. Vérifiez votre réseau.')).toBeInTheDocument();
    });
  });
});
