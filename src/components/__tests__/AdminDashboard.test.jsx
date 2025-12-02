import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from '../AdminDashboard';

const mockSaveAdminPositions = jest.fn();
const mockUpdateAdminPositions = jest.fn();
const mockClearAdminPositions = jest.fn();
const mockSaveAdminGuidelines = jest.fn();
const mockUpdateAdminGuidelines = jest.fn();
const mockClearAdminGuidelines = jest.fn();
const mockRequestUserGuidelines = jest.fn();
const mockRequestUserPositions = jest.fn();
const mockGetGuidelines = jest.fn();
const mockGetAdminPositions = jest.fn();
const mockHasAdminPositions = jest.fn();

let consoleLogSpy;

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      role: 'admin',
      username: 'Coach Admin'
    }
  })
}));

jest.mock('../../context/SocketContext', () => ({
  useSocket: () => ({
    socket: null,
    isConnected: true,
    saveAdminPositions: mockSaveAdminPositions,
    updateAdminPositions: mockUpdateAdminPositions,
    clearAdminPositions: mockClearAdminPositions,
    saveAdminGuidelines: mockSaveAdminGuidelines,
    updateAdminGuidelines: mockUpdateAdminGuidelines,
    clearAdminGuidelines: mockClearAdminGuidelines,
    requestUserGuidelines: mockRequestUserGuidelines,
    requestUserPositions: mockRequestUserPositions,
    getGuidelines: mockGetGuidelines,
    getAdminPositions: mockGetAdminPositions,
    hasAdminPositions: mockHasAdminPositions,
    adminPositions: {},
    adminGuidelines: []
  })
}));

jest.mock('../../api/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
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

const axios = require('../../api/axios');

const mockScenarios = [
  { _id: 's1', name: 'Base Positions', description: 'Default', icon: '⚾' },
  { _id: 's2', name: 'Fly ball to LF', description: 'Fly ball drill', icon: '🧢' }
];

const provideAxiosResponses = () => {
  axios.get.mockImplementation((url) => {
    if (url === '/admin/scenarios') {
      return Promise.resolve({
        data: {
          success: true,
          scenarios: mockScenarios
        }
      });
    }

    if (url.startsWith('/admin/positions/')) {
      return Promise.resolve({
        data: {
          success: true,
          fieldPosition: {
            positions: {}
          }
        }
      });
    }

    if (url.startsWith('/admin/correct-positions/')) {
      return Promise.resolve({
        data: {
          success: true,
          correctPosition: null
        }
      });
    }

    if (url === '/admin-stats/stats') {
      return Promise.resolve({
        data: {
          success: true,
          data: {}
        }
      });
    }

    if (url === '/admin-stats/users') {
      return Promise.resolve({
        data: {
          success: true,
          data: { users: [] }
        }
      });
    }

    return Promise.resolve({ data: { success: true } });
  });

  axios.post.mockResolvedValue({ data: { success: true } });
  axios.put.mockResolvedValue({ data: { success: true } });
  axios.delete.mockResolvedValue({ data: { success: true } });
};

const renderAdminDashboard = async () => {
  provideAxiosResponses();
  mockGetGuidelines.mockReturnValue({ shapes: [] });
  mockGetAdminPositions.mockReturnValue(null);
  mockHasAdminPositions.mockReturnValue(false);

  const user = userEvent.setup();
  render(<AdminDashboard onBack={jest.fn()} onViewCoachDashboard={jest.fn()} />);

  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/admin/scenarios'));

  const fieldTab = await screen.findByRole('tab', { name: /Field Control/i });
  await user.click(fieldTab);

  await screen.findByText('Select Scenario');

  return { user };
};

beforeAll(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AdminDashboard - Field Control', () => {
  test('switching field modes updates instructional text', async () => {
    const { user } = await renderAdminDashboard();

    expect(
      screen.getByText(/Click "Set Positions" to move players on the field/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Set Correct Positions/i }));
    expect(
      screen.getByText(/Click "Set Correct Positions" to set the correct positions/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Set Guidelines/i }));
    expect(
      screen.getByText(/Click "Set Guidelines" to draw arrows and lines/i)
    ).toBeInTheDocument();
  });

  test('selecting a scenario loads positions and requests updates', async () => {
    const { user } = await renderAdminDashboard();

    const scenarioButton = await screen.findByRole('button', { name: /Fly ball to LF/i });
    await user.click(scenarioButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/admin/positions/Fly%20ball%20to%20LF');
    });

    expect(mockRequestUserPositions).toHaveBeenCalledWith('Fly ball to LF');
    expect(mockRequestUserGuidelines).toHaveBeenCalledWith('Fly ball to LF');
  });

  test('new scenario button opens and closes the scenario modal', async () => {
    const { user } = await renderAdminDashboard();

    await user.click(screen.getByRole('button', { name: /New Scenario/i }));
    const modalTitle = await screen.findByText('Create New Scenario');
    expect(modalTitle).toBeInTheDocument();

    const cancelButton = await screen.findByRole('button', { name: /^Cancel$/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Scenario')).not.toBeInTheDocument();
    });
  });
});
