// Pattern Detection Algorithm
// Analyzes user responses to detect cognitive distortion patterns

import {
    PatternScores,
    PatternLabel,
    ConfidenceLevel,
    PatternResponse,
    PatternOption
} from '../types';

export interface PatternDetectionResult {
    scores: PatternScores;
    primaryPattern: PatternLabel;
    secondaryPattern?: PatternLabel;
    confidence: ConfidenceLevel;
}

/**
 * Maps internal pattern type names to user-friendly labels
 */
function mapToPatternLabel(patternType: string): PatternLabel {
    switch (patternType) {
        case 'mind_reading':
            return 'mind_reader';
        case 'catastrophizing':
            return 'future_predictor';
        case 'all_or_nothing':
            return 'perfectionist_thinker';
        default:
            return 'balanced_thinker';
    }
}

/**
 * Maps pattern labels to their context descriptions for Mixed Pattern insights
 */
export function getPatternContext(pattern: PatternLabel): string {
    switch (pattern) {
        case 'mind_reader':
            return 'social situations';
        case 'future_predictor':
            return 'uncertain futures';
        case 'perfectionist_thinker':
            return 'performance and achievement';
        default:
            return 'various situations';
    }
}

/**
 * Gets the pattern-specific verb for example injection
 */
export function getPatternVerb(patternType: string): string {
    switch (patternType) {
        case 'mind_reading':
            return 'assumed';
        case 'catastrophizing':
            return 'predicted';
        case 'all_or_nothing':
            return 'felt';
        default:
            return 'recognized';
    }
}

/**
 * Main pattern detection algorithm
 * Analyzes user responses and determines their primary and secondary patterns
 */
export function detectPattern(
    responses: PatternResponse[],
    optionsMap: Map<string, PatternOption>
): PatternDetectionResult {
    // Step 1: Calculate raw scores by summing pattern mappings
    const scores: PatternScores = {
        mind_reading: 0,
        catastrophizing: 0,
        all_or_nothing: 0
    };

    responses.forEach(response => {
        const option = optionsMap.get(response.selected_option_id);
        if (option) {
            scores.mind_reading += option.pattern_mappings.mind_reading;
            scores.catastrophizing += option.pattern_mappings.catastrophizing;
            scores.all_or_nothing += option.pattern_mappings.all_or_nothing;
        }
    });

    // Step 2: Find the maximum score
    const maxScore = Math.max(scores.mind_reading, scores.catastrophizing, scores.all_or_nothing);

    // Step 3: Check for ties at the maximum score
    const patternsAtMax = [
        { name: 'mind_reading', score: scores.mind_reading },
        { name: 'catastrophizing', score: scores.catastrophizing },
        { name: 'all_or_nothing', score: scores.all_or_nothing }
    ].filter(p => p.score === maxScore);

    // Step 4: Determine primary pattern with tie-breaking logic
    let primaryPattern: PatternLabel;

    if (maxScore < 3) {
        // Low scores across all patterns = balanced thinker
        primaryPattern = 'balanced_thinker';
    } else if (patternsAtMax.length >= 2) {
        // Tie between 2+ patterns = mixed pattern
        primaryPattern = 'mixed_pattern';
    } else {
        // Clear winner
        primaryPattern = mapToPatternLabel(patternsAtMax[0].name);
    }

    // Step 5: Determine secondary pattern (if primary score >= 3 and another >= 2)
    let secondaryPattern: PatternLabel | undefined;

    if (primaryPattern !== 'balanced_thinker' && primaryPattern !== 'mixed_pattern') {
        // Sort patterns by score descending
        const sortedPatterns = [
            { name: 'mind_reading', score: scores.mind_reading },
            { name: 'catastrophizing', score: scores.catastrophizing },
            { name: 'all_or_nothing', score: scores.all_or_nothing }
        ].sort((a, b) => b.score - a.score);

        // Check if second highest pattern qualifies as secondary
        if (sortedPatterns[1].score >= 2 && sortedPatterns[1].name !== sortedPatterns[0].name) {
            secondaryPattern = mapToPatternLabel(sortedPatterns[1].name);
        }
    }

    // Step 6: Calculate confidence level
    let confidence: ConfidenceLevel;
    if (maxScore >= 4) {
        confidence = 'high';
    } else if (maxScore >= 3) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }

    return {
        scores,
        primaryPattern,
        secondaryPattern,
        confidence
    };
}

/**
 * Checks if the user rushed through the assessment
 * Returns true if average response time is less than 5 seconds
 */
export function isRushedAssessment(responses: PatternResponse[]): boolean {
    if (responses.length === 0) return false;

    const totalTime = responses.reduce((sum, r) => sum + r.response_time_seconds, 0);
    const avgTime = totalTime / responses.length;

    return avgTime < 5;
}

/**
 * Calculates average response time for the session
 */
export function calculateAverageResponseTime(responses: PatternResponse[]): number {
    if (responses.length === 0) return 0;

    const totalTime = responses.reduce((sum, r) => sum + r.response_time_seconds, 0);
    return totalTime / responses.length;
}

/**
 * Checks if user selected all or nearly all balanced responses
 * Used to trigger the "Highly Consistent Balanced Thinker" edge case
 */
export function isAllBalancedResponses(
    responses: PatternResponse[],
    optionsMap: Map<string, PatternOption>
): boolean {
    if (responses.length === 0) return false;

    const balancedCount = responses.filter(r => {
        const option = optionsMap.get(r.selected_option_id);
        return option?.is_balanced === true;
    }).length;

    // Consider "all balanced" if 13 or more out of 15 are balanced
    return balancedCount >= 13;
}

/**
 * Gets the top contributing scenarios for a given pattern
 * Used for generating personalized examples in insights
 */
export function getTopPatternScenarios(
    patternType: string,
    responses: PatternResponse[],
    optionsMap: Map<string, PatternOption>,
    scenariosMap: Map<string, { scenario_number: number; setup_text: string }>,
    limit: number = 2
): Array<{ scenario_number: number; scenario_context: string; user_choice: string }> {
    // Filter responses that contributed to this pattern
    const patternResponses = responses.filter(r => {
        const option = optionsMap.get(r.selected_option_id);
        if (!option) return false;

        // Check if this option contributes to the target pattern
        const mappings = option.pattern_mappings;
        switch (patternType) {
            case 'mind_reading':
                return mappings.mind_reading > 0;
            case 'catastrophizing':
                return mappings.catastrophizing > 0;
            case 'all_or_nothing':
                return mappings.all_or_nothing > 0;
            default:
                return false;
        }
    });

    // Sort by pattern contribution (highest first)
    const sorted = patternResponses.sort((a, b) => {
        const optA = optionsMap.get(a.selected_option_id);
        const optB = optionsMap.get(b.selected_option_id);
        if (!optA || !optB) return 0;

        const getScore = (o: PatternOption) => {
            switch (patternType) {
                case 'mind_reading': return o.pattern_mappings.mind_reading;
                case 'catastrophizing': return o.pattern_mappings.catastrophizing;
                case 'all_or_nothing': return o.pattern_mappings.all_or_nothing;
                default: return 0;
            }
        };

        return getScore(optB) - getScore(optA);
    });

    // Take top N and format for insight display
    return sorted.slice(0, limit).map(r => {
        const option = optionsMap.get(r.selected_option_id)!;
        const scenario = scenariosMap.get(r.scenario_id);

        return {
            scenario_number: scenario?.scenario_number || 0,
            scenario_context: scenario?.setup_text || '',
            user_choice: option.option_text
        };
    });
}

/**
 * Gets balanced response examples for Balanced Thinker insights
 */
export function getBalancedExamples(
    responses: PatternResponse[],
    optionsMap: Map<string, PatternOption>,
    scenariosMap: Map<string, { scenario_number: number; setup_text: string }>,
    limit: number = 2
): Array<{ scenario_number: number; scenario_context: string; user_choice: string }> {
    const balancedResponses = responses.filter(r => {
        const option = optionsMap.get(r.selected_option_id);
        return option?.is_balanced === true;
    });

    // Take representative balanced responses
    return balancedResponses.slice(0, limit).map(r => {
        const option = optionsMap.get(r.selected_option_id)!;
        const scenario = scenariosMap.get(r.scenario_id);

        return {
            scenario_number: scenario?.scenario_number || 0,
            scenario_context: scenario?.setup_text || '',
            user_choice: option.option_text
        };
    });
}
