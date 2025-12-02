import { render, screen } from '@testing-library/react';
import { Input } from '../input';

describe('Input component', () => {
  test('renders input with default styling and props', () => {
    render(<Input placeholder="Email" />);
    const input = screen.getByPlaceholderText('Email');

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('data-slot', 'input');
    expect(input.className).toContain('rounded-md');
    expect(input.className).toContain('border');
  });

  test('applies custom class name and type attribute', () => {
    render(<Input type="password" className="custom-input" aria-label="Password" />);
    const input = screen.getByLabelText('Password');

    expect(input).toHaveAttribute('type', 'password');
    expect(input.className).toContain('custom-input');
  });
});
