import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoachDashboard } from '../CoachDashboard';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'coach-1',
      role: 'coach',
      username: 'Coach Carter'
    }
  })
}));

jest.mock('../PerformanceSummary', () => ({
  PerformanceSummary: ({ stats }) => (
    <div data-testid="performance-summary">total players: {stats.totalPlayers}</div>
  )
}));

jest.mock('../SuccessRateChart', () => ({
  SuccessRateChart: () => <div data-testid="success-chart">chart</div>
}));

jest.mock('../LeaderboardWidget', () => ({
  LeaderboardWidget: ({ players, onViewPlayer }) => (
    <div data-testid="leaderboard-widget">
      leaderboard ({players.length})
      <button onClick={() => players[0] && onViewPlayer(players[0])}>view first</button>
    </div>
  )
}));

jest.mock('../PlayerActivityTable', () => ({
  PlayerActivityTable: ({ players }) => (
    <div data-testid="player-table">rows: {players.map((p) => p.name).join(', ')}</div>
  )
}));

jest.mock('../PlayerDetailModal', () => ({
  PlayerDetailModal: ({ player, onClose }) => (
    <div data-testid="player-detail-modal">
      modal for {player.name}
      <button onClick={onClose}>close</button>
    </div>
  )
}));

jest.mock('../../api/axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const axios = require('../../api/axios');

const playersResponse = {
  data: {
    success: true,
    data: {
      players: [
        {
          id: 'player-1',
          name: 'Alice Pitcher',
          email: 'alice@example.com',
          active: true,
          stats: {
            successRate: 95.5,
            totalSessions: 12,
            currentStreak: 4
          }
        },
        {
          id: 'player-2',
          name: 'Bob Catcher',
          email: 'bob@example.com',
          active: false,
          stats: {
            successRate: 72.3,
            totalSessions: 8,
            currentStreak: 2
          }
        }
      ]
    }
  }
};

const statsResponse = {
  data: {
    success: true,
    data: {
      totalPlayers: 10,
      activePlayers: 7,
      averageSuccessRate: 81.2,
      totalSessions: 150,
      totalAttempts: 420
    }
  }
};

const mockAxiosGetImplementation = () => {
  axios.get.mockImplementation((url) => {
    if (url.startsWith('/coach-stats/players')) {
      return Promise.resolve(playersResponse);
    }

    if (url === '/coach-stats/stats') {
      return Promise.resolve(statsResponse);
    }

    return Promise.resolve({ data: { success: true } });
  });
};

const renderCoachDashboard = async () => {
  mockAxiosGetImplementation();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(<CoachDashboard onBack={jest.fn()} />);

  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/coach-stats/stats'));
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/coach-stats/players?search=&filter='));

  await screen.findByTestId('player-table');
  return { user };
};

describe('CoachDashboard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('loads coach stats and players on mount and renders dashboard sections', async () => {
    await renderCoachDashboard();

    expect(screen.getByTestId('performance-summary')).toHaveTextContent('total players: 10');
    expect(screen.getByTestId('success-chart')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-widget')).toHaveTextContent('leaderboard (2)');
    expect(screen.getByTestId('player-table')).toHaveTextContent('Alice Pitcher');
  });

  test('typing in the search input triggers debounced players fetch with query', async () => {
    const { user } = await renderCoachDashboard();

    axios.get.mockClear();

    const searchInput = screen.getByPlaceholderText('Search players...');
    await user.clear(searchInput);
    await user.type(searchInput, 'alice');

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/coach-stats/players?search=alice&filter=');
    });
  });

  test('filter buttons request filtered players list', async () => {
    const { user } = await renderCoachDashboard();

    axios.get.mockClear();

    const activeButton = screen.getByRole('button', { name: 'Active' });
    await user.click(activeButton);

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/coach-stats/players?search=&filter=active');
    });

    axios.get.mockClear();

    const inactiveButton = screen.getByRole('button', { name: 'Inactive' });
    await user.click(inactiveButton);

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/coach-stats/players?search=&filter=inactive');
    });
  });
});

