import { Users, Activity, TrendingUp, Clock } from "lucide-react";

export function PerformanceSummary({ stats }) {
  const cards = [
    {
      title: "Total Players",
      value: stats.totalPlayers,
      subtitle: `${stats.activePlayers} active`,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Active Players",
      value: stats.activePlayers,
      subtitle: `${((stats.activePlayers / stats.totalPlayers) * 100).toFixed(0)}% active rate`,
      icon: Activity,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "Avg Success Rate",
      value: `${stats.averageSuccessRate.toFixed(1)}%`,
      subtitle: "Across all positions",
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      title: "Total Sessions",
      value: stats.totalSessions,
      subtitle: `${stats.totalAttempts} total attempts`,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="glass-panel rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all group relative"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div className={`px-2 py-1 ${card.bgColor} rounded-lg`}>
              <span className={`text-xs font-medium ${card.iconColor}`}>
                Live
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">
              {card.title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground">
              {card.subtitle}
            </p>
          </div>

          {/* Decorative bottom line */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl`} />
        </div>
      ))}
    </div>
  );
}
