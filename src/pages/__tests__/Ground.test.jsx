import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Ground from '../Ground';

const mockSocket = {
  isConnected: true,
  hasAdminPositions: jest.fn(() => false),
  getAdminPositions: jest.fn(),
  requestUserPositions: jest.fn(),
  requestUserGuidelines: jest.fn(),
  getGuidelines: jest.fn(() => ({ shapes: [] })),
  hasGuidelines: jest.fn(() => false)
};

jest.mock('../../context/SocketContext', () => ({
  useSocket: () => mockSocket
}));

jest.mock('react-konva', () => {
  const React = require('react');
  const MockNode = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-konva-mock="true" {...props}>
      {children}
    </div>
  ));
  MockNode.displayName = 'KonvaMockNode';
  return {
    Stage: MockNode,
    Layer: MockNode,
    Line: MockNode,
    Arrow: MockNode,
    Circle: MockNode
  };
});

jest.mock('../../api/axios', () => ({
  get: jest.fn()
}));

const axios = require('../../api/axios');

const createSuccessfulAxios = (scenarios) => {
  axios.get.mockImplementation((url) => {
    if (url === '/user/scenarios') {
      return Promise.resolve({
        data: { success: true, scenarios },
        status: 200
      });
    }

    if (url.startsWith('/user/correct-positions/')) {
      return Promise.resolve({
        data: { success: true, hasCorrectPositions: false },
        status: 200
      });
    }

    return Promise.resolve({ data: { success: true }, status: 200 });
  });
};

const renderGround = async (scenarios) => {
  createSuccessfulAxios(scenarios);

  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Ground />
    </MemoryRouter>
  );

  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/user/scenarios'));

  return { user };
};

describe('Ground page', () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalAlert = window.alert;

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    window.alert = jest.fn();
  });

  afterAll(() => {
    console.log = originalLog;
    console.error = originalError;
    window.alert = originalAlert;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.getGuidelines.mockReturnValue({ shapes: [] });
    mockSocket.hasAdminPositions.mockReturnValue(false);
  });

  test('loads scenarios and selects the first available one when base scenario is missing', async () => {
    const scenarios = [
      { _id: '1', name: 'Fly ball to LF', description: 'Fly ball drill', icon: '⚾' },
      { _id: '2', name: 'Ground ball to SS', description: 'Grounder drill', icon: '🥎' }
    ];

    await renderGround(scenarios);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Fly ball to LF/i })).toBeInTheDocument();
    });

    expect(mockSocket.requestUserPositions).toHaveBeenCalledWith('Fly ball to LF');
    expect(mockSocket.requestUserGuidelines).toHaveBeenCalledWith('Fly ball to LF');
    const correctPositionCallExists = axios.get.mock.calls.some(([url]) =>
      url === '/user/correct-positions/Fly%20ball%20to%20LF'
    );
    expect(correctPositionCallExists).toBe(true);
  });

  test('falls back to Base Positions when scenario fetch fails', async () => {
    axios.get.mockImplementation((url) => {
      if (url === '/user/scenarios') {
        return Promise.reject(new Error('Network error'));
      }
      if (url.startsWith('/user/correct-positions/')) {
        return Promise.resolve({
          data: { success: true, hasCorrectPositions: false },
          status: 200
        });
      }
      return Promise.resolve({ data: { success: true }, status: 200 });
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Ground />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/user/scenarios'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Base Positions/i })).toBeInTheDocument();
    });
  });

  test('reset positions button requests latest admin positions for the active scenario', async () => {
    const scenarios = [
      { _id: '1', name: 'Fly ball to LF', description: 'Fly ball drill', icon: '⚾' }
    ];

    const { user } = await renderGround(scenarios);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Fly ball to LF/i })).toBeInTheDocument();
    });

    mockSocket.requestUserPositions.mockClear();

    await user.click(screen.getByRole('button', { name: /Reset Positions/i }));

    await waitFor(() => {
      expect(mockSocket.requestUserPositions).toHaveBeenCalledWith('Fly ball to LF');
    });
  });
});
