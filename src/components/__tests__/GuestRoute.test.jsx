import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GuestRoute from '../GuestRoute';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

const { useAuth } = require('../../context/AuthContext');

describe('GuestRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when user is not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <GuestRoute>
          <div>Public Content</div>
        </GuestRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });

  test('redirects to home when user is authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={(
              <GuestRoute>
                <div>Login Page</div>
              </GuestRoute>
            )}
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
