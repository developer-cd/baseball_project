// Mock player data for Coach Dashboard

export const mockPlayers = [{
        id: "1",
        name: "John Martinez",
        email: "john.martinez@team.com",
        joinedDate: "2024-09-15",
        lastActive: "2025-10-10T14:30:00",
        isActive: true,
        primaryPositions: ["SS", "2B", "3B"],
        stats: {
            totalSessions: 45,
            totalAttempts: 405,
            correctPlacements: 342,
            successRate: 84.4,
            averageTime: 12.5,
            scenariosCompleted: 28,
            currentStreak: 7,
        },
        positionSuccessRates: {
            "P": 72,
            "C": 68,
            "1B": 78,
            "2B": 89,
            "3B": 85,
            "SS": 91,
            "LF": 74,
            "CF": 76,
            "RF": 79,
        },
        recentActivity: [{
                date: "2025-10-10",
                scenario: "Runner on 1st - 0 Outs",
                successRate: 88,
                timeSpent: 11
            },
            {
                date: "2025-10-09",
                scenario: "Standard Defense - 1 Out",
                successRate: 92,
                timeSpent: 9
            },
            {
                date: "2025-10-08",
                scenario: "Bases Loaded - 2 Outs",
                successRate: 77,
                timeSpent: 15
            },
        ],
        weakPositions: ["C", "P"],
        strongPositions: ["SS", "2B", "3B"],
    },
    {
        id: "2",
        name: "Sarah Chen",
        email: "sarah.chen@team.com",
        joinedDate: "2024-08-22",
        lastActive: "2025-10-10T16:45:00",
        isActive: true,
        primaryPositions: ["CF", "LF", "RF"],
        stats: {
            totalSessions: 52,
            totalAttempts: 468,
            correctPlacements: 401,
            successRate: 85.7,
            averageTime: 10.8,
            scenariosCompleted: 32,
            currentStreak: 12,
        },
        positionSuccessRates: {
            "P": 70,
            "C": 73,
            "1B": 80,
            "2B": 82,
            "3B": 77,
            "SS": 84,
            "LF": 93,
            "CF": 95,
            "RF": 91,
        },
        recentActivity: [{
                date: "2025-10-10",
                scenario: "Cutoff Relay - Deep Fly",
                successRate: 94,
                timeSpent: 8
            },
            {
                date: "2025-10-10",
                scenario: "Runner on 2nd - 1 Out",
                successRate: 89,
                timeSpent: 10
            },
            {
                date: "2025-10-09",
                scenario: "Standard Defense - 0 Outs",
                successRate: 91,
                timeSpent: 7
            },
        ],
        weakPositions: ["P", "3B"],
        strongPositions: ["CF", "LF", "RF"],
    },
    {
        id: "3",
        name: "Michael Thompson",
        email: "mike.thompson@team.com",
        joinedDate: "2024-10-01",
        lastActive: "2025-10-09T19:20:00",
        isActive: true,
        primaryPositions: ["P", "1B"],
        stats: {
            totalSessions: 28,
            totalAttempts: 252,
            correctPlacements: 195,
            successRate: 77.4,
            averageTime: 14.2,
            scenariosCompleted: 18,
            currentStreak: 3,
        },
        positionSuccessRates: {
            "P": 88,
            "C": 65,
            "1B": 86,
            "2B": 72,
            "3B": 69,
            "SS": 74,
            "LF": 76,
            "CF": 71,
            "RF": 78,
        },
        recentActivity: [{
                date: "2025-10-09",
                scenario: "Bunt Defense - Runner on 1st",
                successRate: 82,
                timeSpent: 13
            },
            {
                date: "2025-10-08",
                scenario: "Standard Defense - 2 Outs",
                successRate: 75,
                timeSpent: 16
            },
            {
                date: "2025-10-07",
                scenario: "Pickoff Play - 1st Base",
                successRate: 79,
                timeSpent: 12
            },
        ],
        weakPositions: ["C", "2B", "3B"],
        strongPositions: ["P", "1B"],
    },
    {
        id: "4",
        name: "Emily Rodriguez",
        email: "emily.rodriguez@team.com",
        joinedDate: "2024-07-10",
        lastActive: "2025-10-10T11:15:00",
        isActive: true,
        primaryPositions: ["C", "3B", "1B"],
        stats: {
            totalSessions: 61,
            totalAttempts: 549,
            correctPlacements: 478,
            successRate: 87.1,
            averageTime: 11.3,
            scenariosCompleted: 35,
            currentStreak: 9,
        },
        positionSuccessRates: {
            "P": 76,
            "C": 92,
            "1B": 88,
            "2B": 81,
            "3B": 90,
            "SS": 83,
            "LF": 79,
            "CF": 82,
            "RF": 80,
        },
        recentActivity: [{
                date: "2025-10-10",
                scenario: "Pop Fly Priority - Infield",
                successRate: 91,
                timeSpent: 9
            },
            {
                date: "2025-10-10",
                scenario: "Steal Defense - 2nd Base",
                successRate: 88,
                timeSpent: 10
            },
            {
                date: "2025-10-09",
                scenario: "Squeeze Play Defense",
                successRate: 85,
                timeSpent: 13
            },
        ],
        weakPositions: ["LF", "P"],
        strongPositions: ["C", "3B", "1B"],
    },
    {
        id: "5",
        name: "David Kim",
        email: "david.kim@team.com",
        joinedDate: "2024-09-28",
        lastActive: "2025-10-05T08:45:00",
        isActive: false,
        primaryPositions: ["2B", "SS"],
        stats: {
            totalSessions: 19,
            totalAttempts: 171,
            correctPlacements: 128,
            successRate: 74.9,
            averageTime: 15.7,
            scenariosCompleted: 12,
            currentStreak: 0,
        },
        positionSuccessRates: {
            "P": 68,
            "C": 64,
            "1B": 71,
            "2B": 83,
            "3B": 70,
            "SS": 81,
            "LF": 72,
            "CF": 69,
            "RF": 73,
        },
        recentActivity: [{
                date: "2025-10-05",
                scenario: "Double Play - Runner on 1st",
                successRate: 79,
                timeSpent: 14
            },
            {
                date: "2025-10-04",
                scenario: "Standard Defense - 1 Out",
                successRate: 71,
                timeSpent: 18
            },
            {
                date: "2025-10-03",
                scenario: "Shift Defense - Pull Hitter",
                successRate: 76,
                timeSpent: 16
            },
        ],
        weakPositions: ["C", "CF", "P"],
        strongPositions: ["2B", "SS"],
    },
];

// Summary statistics for all players
export const teamStats = {
    totalPlayers: mockPlayers.length,
    activePlayers: mockPlayers.filter((p) => p.isActive).length,
    averageSuccessRate: mockPlayers.reduce((sum, p) => sum + p.stats.successRate, 0) / mockPlayers.length,
    totalSessions: mockPlayers.reduce((sum, p) => sum + p.stats.totalSessions, 0),
    totalAttempts: mockPlayers.reduce((sum, p) => sum + p.stats.totalAttempts, 0),
    averageSessionTime: mockPlayers.reduce((sum, p) => sum + p.stats.averageTime, 0) / mockPlayers.length,
};

// Most practiced scenarios
export const popularScenarios = [{
        name: "Standard Defense - 0 Outs",
        attempts: 156,
        avgSuccessRate: 83.2
    },
    {
        name: "Runner on 1st - 0 Outs",
        attempts: 142,
        avgSuccessRate: 81.5
    },
    {
        name: "Bases Loaded - 2 Outs",
        attempts: 128,
        avgSuccessRate: 76.8
    },
    {
        name: "Double Play - Runner on 1st",
        attempts: 119,
        avgSuccessRate: 79.4
    },
    {
        name: "Cutoff Relay - Deep Fly",
        attempts: 98,
        avgSuccessRate: 85.1
    },
];

// Position difficulty rankings (based on average success rates)
export const positionDifficulty = [{
        position: "CF",
        avgSuccessRate: 85.4,
        difficulty: "Medium"
    },
    {
        position: "SS",
        avgSuccessRate: 82.6,
        difficulty: "Medium"
    },
    {
        position: "LF",
        avgSuccessRate: 81.8,
        difficulty: "Easy"
    },
    {
        position: "RF",
        avgSuccessRate: 80.2,
        difficulty: "Easy"
    },
    {
        position: "2B",
        avgSuccessRate: 81.4,
        difficulty: "Medium"
    },
    {
        position: "3B",
        avgSuccessRate: 78.2,
        difficulty: "Medium"
    },
    {
        position: "1B",
        avgSuccessRate: 80.6,
        difficulty: "Easy"
    },
    {
        position: "C",
        avgSuccessRate: 72.4,
        difficulty: "Hard"
    },
    {
        position: "P",
        avgSuccessRate: 74.8,
        difficulty: "Hard"
    },
];