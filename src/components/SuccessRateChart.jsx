import { TrendingUp } from "lucide-react";

const weeklyData = [
  { week: "Week 1", successRate: 72, attempts: 145 },
  { week: "Week 2", successRate: 75, attempts: 168 },
  { week: "Week 3", successRate: 78, attempts: 182 },
  { week: "Week 4", successRate: 76, attempts: 175 },
  { week: "Week 5", successRate: 80, attempts: 195 },
  { week: "Week 6", successRate: 82, attempts: 210 },
  { week: "Week 7", successRate: 84, attempts: 225 },
  { week: "Week 8", successRate: 83, attempts: 218 },
];

export function SuccessRateChart() {
  const maxRate = Math.max(...weeklyData.map(d => d.successRate));
  const minRate = Math.min(...weeklyData.map(d => d.successRate));
  const range = maxRate - minRate;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/30 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Success Rate Trend</h3>
            <p className="text-sm text-muted-foreground">Weekly performance over last 8 weeks</p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-bold text-green-600">83%</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Change</p>
            <p className="text-lg font-bold text-green-600">+11%</p>
          </div>
        </div>
      </div>

      {/* Simple Chart */}
      <div className="h-64 relative">
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
          {weeklyData.map((data, index) => {
            const height = ((data.successRate - minRate) / range) * 100;
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div 
                    className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-500"
                    style={{ height: `${Math.max(height, 10)}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.successRate}%
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  W{index + 1}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-8">
          <span className="text-xs text-muted-foreground">100%</span>
          <span className="text-xs text-muted-foreground">80%</span>
          <span className="text-xs text-muted-foreground">60%</span>
        </div>
      </div>

      {/* Footer legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Success Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-600 font-medium">Improving trend</span>
        </div>
      </div>
    </div>
  );
}
