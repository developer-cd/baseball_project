import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button component', () => {
  test('renders with default variant and size', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-slot', 'button');
    expect(button.className).toContain('bg-primary');
    expect(button.className).toContain('h-9');
  });

  test('applies variant, size and custom class', () => {
    render(
      <Button variant="outline" size="lg" className="custom-class">
        Outline
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Outline' });
    expect(button.className).toContain('bg-background');
    expect(button.className).toContain('h-10');
    expect(button.className).toContain('custom-class');
  });

  test('supports asChild prop and forwards props to child', () => {
    render(
      <Button asChild>
        <a href="/docs" data-testid="button-link">
          Docs
        </a>
      </Button>
    );

    const link = screen.getByTestId('button-link');
    expect(link.tagName.toLowerCase()).toBe('a');
    expect(link.getAttribute('href')).toBe('/docs');
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link.className).toContain('inline-flex');
  });
});
