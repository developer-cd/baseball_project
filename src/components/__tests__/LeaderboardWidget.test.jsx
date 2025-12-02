import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderboardWidget } from '../LeaderboardWidget';

describe('LeaderboardWidget', () => {
  const players = [
    {
      id: 'p1',
      name: 'Alice Pitcher',
      primaryPositions: ['P', '1B'],
      stats: {
        successRate: 72.4,
        totalSessions: 18,
        currentStreak: 3
      }
    },
    {
      id: 'p2',
      name: 'Brian Catcher',
      primaryPositions: ['C'],
      stats: {
        successRate: 88.1,
        totalSessions: 22,
        currentStreak: 7
      }
    },
    {
      id: 'p3',
      name: 'Carlos Shortstop',
      primaryPositions: ['SS'],
      stats: {
        successRate: 64.0,
        totalSessions: 15,
        currentStreak: 2
      }
    },
    {
      id: 'p4',
      name: 'Diana Outfield',
      primaryPositions: ['LF'],
      stats: {
        successRate: 95.0,
        totalSessions: 30,
        currentStreak: 9
      }
    },
    {
      id: 'p5',
      name: 'Evan Utility',
      primaryPositions: ['2B', '3B'],
      stats: {
        successRate: 78.3,
        totalSessions: 19,
        currentStreak: 4
      }
    },
    {
      id: 'p6',
      name: 'Felix Bench',
      primaryPositions: ['RF'],
      stats: {
        successRate: 50.5,
        totalSessions: 8,
        currentStreak: 1
      }
    }
  ];

  it('shows the top five players sorted by success rate', () => {
    render(<LeaderboardWidget players={players} onViewPlayer={jest.fn()} />);

    expect(screen.queryByText('Felix Bench')).not.toBeInTheDocument();

    const expectedOrder = ['95.0%', '88.1%', '78.3%', '72.4%', '64.0%'];
    const successRateTexts = screen.getAllByText(/%$/).map((node) => node.textContent);
    expect(successRateTexts).toEqual(expectedOrder);
  });

  it('invokes onViewPlayer when a player row is clicked', async () => {
    const onViewPlayer = jest.fn();
    const user = userEvent.setup();

    render(<LeaderboardWidget players={players} onViewPlayer={onViewPlayer} />);

    await user.click(screen.getByText('Diana Outfield'));

    expect(onViewPlayer).toHaveBeenCalledTimes(1);
    expect(onViewPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p4', name: 'Diana Outfield' })
    );
  });

  it('renders the view full leaderboard button', () => {
    render(<LeaderboardWidget players={players} onViewPlayer={jest.fn()} />);

    expect(screen.getByText('View Full Leaderboard')).toBeInTheDocument();
  });
});

