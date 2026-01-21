
import { InnerCheckIn, InnerState, InnerDirection, TimeBand } from '../types';

export interface PatternInsight {
    topState: { state: InnerState; count: number } | null;
    topDirection: { direction: InnerDirection; count: number } | null;
    totalCheckIns: number;
    streak: number;
    recentTrend: InnerState[];
    timeOfDayInsights: {
        [key in TimeBand]: { topState: InnerState | null }
    };
}

export const analyzePatterns = (checkIns: InnerCheckIn[]): PatternInsight => {
    if (!checkIns || checkIns.length === 0) {
        return {
            topState: null,
            topDirection: null,
            totalCheckIns: 0,
            streak: 0,
            recentTrend: [],
            timeOfDayInsights: {
                [TimeBand.EARLY]: { topState: null },
                [TimeBand.MIDDAY]: { topState: null },
                [TimeBand.LATE]: { topState: null },
                [TimeBand.NIGHT]: { topState: null }
            }
        };
    }

    // 1. Calculate Top State & Direction
    const stateCounts: Record<string, number> = {};
    const directionCounts: Record<string, number> = {};
    const timeBandStates: Record<string, Record<string, number>> = {
        [TimeBand.EARLY]: {},
        [TimeBand.MIDDAY]: {},
        [TimeBand.LATE]: {},
        [TimeBand.NIGHT]: {}
    };

    checkIns.forEach(checkIn => {
        // Global counts
        stateCounts[checkIn.state] = (stateCounts[checkIn.state] || 0) + 1;
        directionCounts[checkIn.direction] = (directionCounts[checkIn.direction] || 0) + 1;

        // Time band analysis
        if (checkIn.timeBand) {
            const bandMap = timeBandStates[checkIn.timeBand];
            if (bandMap) {
                bandMap[checkIn.state] = (bandMap[checkIn.state] || 0) + 1;
            }
        }
    });

    const getTop = (counts: Record<string, number>) => {
        let max = 0;
        let topKey = null;
        Object.entries(counts).forEach(([key, count]) => {
            if (count > max) {
                max = count;
                topKey = key;
            }
        });
        return topKey ? { key: topKey, count: max } : null;
    };

    const topStateData = getTop(stateCounts);
    const topDirectionData = getTop(directionCounts);

    // 2. Calculate Streak
    // Assuming checkIns are sorted by date desc or we sort them
    const sortedCheckIns = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    const uniqueDates = new Set(sortedCheckIns.map(c => new Date(c.date).setHours(0, 0, 0, 0)));

    // Check if we have today or yesterday to start the streak
    // Simple streak logic: sequential days backwards
    // For this simple ver, just count total unique days for now as "Days Practiced" or similar if gaps allowed. 
    // Let's do a real consecutive streak check.

    let currentCheckDate = new Date();
    currentCheckDate.setHours(0, 0, 0, 0);

    // If no checkin today, check yesterday for streak start
    if (!uniqueDates.has(currentCheckDate.getTime())) {
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    }

    while (uniqueDates.has(currentCheckDate.getTime())) {
        streak++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    }

    // 3. Time of Day Insights
    const timeInsights = {
        [TimeBand.EARLY]: { topState: getTop(timeBandStates[TimeBand.EARLY])?.key as InnerState || null },
        [TimeBand.MIDDAY]: { topState: getTop(timeBandStates[TimeBand.MIDDAY])?.key as InnerState || null },
        [TimeBand.LATE]: { topState: getTop(timeBandStates[TimeBand.LATE])?.key as InnerState || null },
        [TimeBand.NIGHT]: { topState: getTop(timeBandStates[TimeBand.NIGHT])?.key as InnerState || null },
    };

    return {
        topState: topStateData ? { state: topStateData.key as InnerState, count: topStateData.count } : null,
        topDirection: topDirectionData ? { direction: topDirectionData.key as InnerDirection, count: topDirectionData.count } : null,
        totalCheckIns: checkIns.length,
        streak,
        recentTrend: sortedCheckIns.slice(0, 5).map(c => c.state),
        timeOfDayInsights: timeInsights
    };
};
