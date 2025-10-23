import { Trophy, Medal, Award, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export function LeaderboardWidget({ players, onViewPlayer }) {
  // Sort players by success rate and take top 5
  const topPlayers = [...players]
    .sort((a, b) => b.stats.successRate - a.stats.successRate)
    .slice(0, 5);

  const getMedalIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <Award className="w-4 h-4 text-gray-400" />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600";
    if (rank === 2) return "from-gray-300 to-gray-500";
    if (rank === 3) return "from-orange-400 to-orange-600";
    return "from-green-400 to-green-600";
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/30 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Top Performers</h3>
            <p className="text-sm text-muted-foreground">By success rate</p>
          </div>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="space-y-3">
        {topPlayers.map((player, index) => {
          const rank = index + 1;
          return (
            <div
              key={player.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white/40 hover:bg-white/60 border border-white/30 transition-all cursor-pointer"
              onClick={() => onViewPlayer(player)}
            >
              {/* Rank badge */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center shadow-lg shrink-0`}>
                {getMedalIcon(rank)}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {player.name}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {player.primaryPositions.slice(0, 2).map((pos) => (
                      <span
                        key={pos}
                        className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded"
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                  {player.stats.currentStreak > 5 && (
                    <span className="text-xs">🔥</span>
                  )}
                </div>
              </div>

              {/* Success rate */}
              <div className="text-right shrink-0">
                <p className="font-bold text-green-600">
                  {player.stats.successRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.stats.totalSessions} sessions
                </p>
              </div>

              {/* Hover arrow */}
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>

      {/* View all button */}
      <Button
        variant="ghost"
        className="w-full mt-4 text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        View Full Leaderboard
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
