import { Eye, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { Button } from "./ui/button";

export function PlayerActivityTable({ players, onViewPlayer }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 85) return "text-green-600 bg-green-100";
    if (rate >= 75) return "text-blue-600 bg-blue-100";
    if (rate >= 65) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getSuccessRateIcon = (rate) => {
    if (rate >= 80) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  if (players.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-muted-foreground">No players found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/20 bg-white/30">
            <th className="text-left p-4 text-sm font-medium text-foreground">Player</th>
            <th className="text-left p-4 text-sm font-medium text-foreground hidden md:table-cell">Positions</th>
            <th className="text-center p-4 text-sm font-medium text-foreground hidden lg:table-cell">Sessions</th>
            <th className="text-center p-4 text-sm font-medium text-foreground">Success Rate</th>
            <th className="text-center p-4 text-sm font-medium text-foreground hidden sm:table-cell">Streak</th>
            <th className="text-left p-4 text-sm font-medium text-foreground hidden xl:table-cell">Last Active</th>
            <th className="text-right p-4 text-sm font-medium text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr
              key={player.id}
              className="border-b border-white/10 hover:bg-white/30 transition-colors group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Player Info */}
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center font-semibold text-white shadow-lg">
                    {player.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.email}</p>
                  </div>
                  {player.isActive && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
              </td>

              {/* Primary Positions */}
              <td className="p-4 hidden md:table-cell">
                <div className="flex gap-1">
                  {player.primaryPositions.map((pos) => (
                    <span
                      key={pos}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              </td>

              {/* Sessions */}
              <td className="p-4 text-center hidden lg:table-cell">
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-foreground">
                    {player.stats.totalSessions}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {player.stats.scenariosCompleted} completed
                  </span>
                </div>
              </td>

              {/* Success Rate */}
              <td className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <div className={`px-3 py-1 rounded-lg font-medium text-sm flex items-center gap-1 ${getSuccessRateColor(player.stats.successRate)}`}>
                    {getSuccessRateIcon(player.stats.successRate)}
                    {player.stats.successRate.toFixed(1)}%
                  </div>
                </div>
              </td>

              {/* Streak */}
              <td className="p-4 text-center hidden sm:table-cell">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                  <span>🔥</span>
                  <span>{player.stats.currentStreak}</span>
                </div>
              </td>

              {/* Last Active */}
              <td className="p-4 hidden xl:table-cell">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDate(player.lastActive)}
                </div>
              </td>

              {/* Actions */}
              <td className="p-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewPlayer(player)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
