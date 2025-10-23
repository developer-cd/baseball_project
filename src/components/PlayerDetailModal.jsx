import { X, TrendingUp, Clock, Target, Activity, Award, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

export function PlayerDetailModal({ player, onClose }) {
  // Prepare data for position radar chart
  const radarData = Object.entries(player.positionSuccessRates).map(([position, rate]) => ({
    position,
    successRate: rate,
  }));

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-3xl shadow-2xl border border-white/30">
            {/* Header */}
            <div className="sticky top-0 z-10 glass-panel border-b border-white/20 rounded-t-3xl">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-green-500/30">
                    {player.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{player.name}</h2>
                    <p className="text-sm text-muted-foreground">{player.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {player.isActive && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Joined {formatDate(player.joinedDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Primary positions */}
              <div className="px-6 pb-4 flex gap-2">
                <span className="text-sm text-muted-foreground">Primary Positions:</span>
                {player.primaryPositions.map((pos) => (
                  <span
                    key={pos}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg"
                  >
                    {pos}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats overview grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {player.stats.successRate.toFixed(1)}%
                  </p>
                </div>

                <div className="glass-panel rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {player.stats.totalSessions}
                  </p>
                </div>

                <div className="glass-panel rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {player.stats.averageTime.toFixed(1)}m
                  </p>
                </div>

                <div className="glass-panel rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground flex items-center gap-1">
                    🔥 {player.stats.currentStreak}
                  </p>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Position success rates */}
                <div className="glass-panel rounded-2xl p-6 border border-white/20">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Position Success Rates
                  </h3>
                  <div className="h-64 space-y-3">
                    {radarData.map((data, index) => (
                      <div key={data.position} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{data.position}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${data.successRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-green-600 w-12 text-right">
                            {data.successRate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths and weaknesses */}
                <div className="space-y-4">
                  {/* Strong positions */}
                  <div className="glass-panel rounded-2xl p-6 border border-white/20">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Strong Positions
                    </h3>
                    <div className="space-y-2">
                      {player.strongPositions.map((pos) => (
                        <div
                          key={pos}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <span className="font-medium text-green-700">{pos}</span>
                          <span className="text-sm text-green-600">
                            {player.positionSuccessRates[pos]}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weak positions */}
                  <div className="glass-panel rounded-2xl p-6 border border-white/20">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      Needs Improvement
                    </h3>
                    <div className="space-y-2">
                      {player.weakPositions.map((pos) => (
                        <div
                          key={pos}
                          className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                        >
                          <span className="font-medium text-yellow-700">{pos}</span>
                          <span className="text-sm text-yellow-600">
                            {player.positionSuccessRates[pos]}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="glass-panel rounded-2xl p-6 border border-white/20">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {player.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/20"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{activity.scenario}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          activity.successRate >= 85 ? "text-green-600" :
                          activity.successRate >= 75 ? "text-blue-600" :
                          "text-yellow-600"
                        }`}>
                          {activity.successRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timeSpent}m
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/20 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-b-3xl">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Assign Training
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
