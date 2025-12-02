import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const { useAuth } = require('../../context/AuthContext');

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
  });

  test('shows login/register links when user is not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, logout: jest.fn() });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });

  test('shows authenticated navigation and sign out button', async () => {
    const mockLogout = jest.fn();
    const user = userEvent.setup();

    useAuth.mockReturnValue({ isAuthenticated: true, logout: mockLogout });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
    expect(signOutButton).toBeInTheDocument();

    await user.click(signOutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
