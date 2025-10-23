import { useState } from "react";
import { ArrowLeft, Users, TrendingUp, Activity, Trophy, ChevronRight, Search, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PlayerActivityTable } from "./PlayerActivityTable";
import { PerformanceSummary } from "./PerformanceSummary";
import { SuccessRateChart } from "./SuccessRateChart";
import { LeaderboardWidget } from "./LeaderboardWidget";
import { PlayerDetailModal } from "./PlayerDetailModal";
import { mockPlayers, teamStats } from "../data/mockPlayerData";

export function CoachDashboard({ onBack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Filter players based on search and active status
  const filteredPlayers = mockPlayers.filter((player) => {
    const matchesSearch = 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterActive === null || player.isActive === filterActive;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30 tech-grid">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/20 glass-panel shadow-lg">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all hover:gap-3 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Coach Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Monitor player progress and performance</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
              </div>
              <span className="text-sm font-medium text-foreground">Live Data</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Performance Summary Cards */}
        <PerformanceSummary stats={teamStats} />

        {/* Charts and Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Success Rate Trend Chart */}
          <div className="lg:col-span-2">
            <SuccessRateChart />
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <LeaderboardWidget 
              players={mockPlayers}
              onViewPlayer={(player) => setSelectedPlayer(player)}
            />
          </div>
        </div>

        {/* Player Activity Section */}
        <div className="glass-panel rounded-3xl shadow-xl border border-white/30 overflow-hidden">
          {/* Section Header */}
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-green-500/10 to-blue-500/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Player Activity</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-white/50 border-white/30"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={filterActive === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterActive(filterActive === true ? null : true)}
                    className={filterActive === true ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filterActive === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterActive(filterActive === false ? null : false)}
                    className={filterActive === false ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Inactive
                  </Button>
                  {filterActive !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterActive(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player Table */}
          <PlayerActivityTable
            players={filteredPlayers}
            onViewPlayer={(player) => setSelectedPlayer(player)}
          />
        </div>
      </main>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
