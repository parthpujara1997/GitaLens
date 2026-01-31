// Pattern Lens Service
// Handles all Supabase interactions for the Pattern Lens feature

import { supabase } from '../lib/supabase';
import {
    PatternScenario,
    PatternOption,
    PatternSession,
    PatternResponse,
    PatternInsight,
    PatternLabel,
    ConfidenceLevel
} from '../types';

// =============================================================================
// SCENARIO FETCHING
// =============================================================================

/**
 * Fetches all 15 scenarios with their options
 * Results are cached in session for performance
 */
export async function getAllScenarios(): Promise<PatternScenario[]> {
    const { data: scenarios, error: scenarioError } = await supabase
        .from('pattern_scenarios')
        .select('*')
        .order('scenario_number', { ascending: true });

    if (scenarioError) {
        console.error('Error fetching scenarios:', scenarioError);
        throw scenarioError;
    }

    // Fetch all options
    const { data: options, error: optionsError } = await supabase
        .from('pattern_options')
        .select('*');

    if (optionsError) {
        console.error('Error fetching options:', optionsError);
        throw optionsError;
    }

    // Combine scenarios with their options
    return scenarios.map(scenario => ({
        ...scenario,
        options: options
            .filter(opt => opt.scenario_id === scenario.id)
            .sort((a, b) => a.option_letter.localeCompare(b.option_letter))
    }));
}

/**
 * Returns scenarios in interleaved order for assessment
 * Pattern: MR, CAT, AON rotation
 */
export function getInterleavedScenarioOrder(scenarios: PatternScenario[]): PatternScenario[] {
    // Group by type
    const mindReading = scenarios.filter(s => s.scenario_type === 'mind_reading');
    const catastrophizing = scenarios.filter(s => s.scenario_type === 'catastrophizing');
    const allOrNothing = scenarios.filter(s => s.scenario_type === 'all_or_nothing');

    // Interleave: MR, CAT, AON rotation
    const interleaved: PatternScenario[] = [];
    const maxLength = Math.max(mindReading.length, catastrophizing.length, allOrNothing.length);

    for (let i = 0; i < maxLength; i++) {
        if (mindReading[i]) interleaved.push(mindReading[i]);
        if (catastrophizing[i]) interleaved.push(catastrophizing[i]);
        if (allOrNothing[i]) interleaved.push(allOrNothing[i]);
    }

    return interleaved;
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Creates a new assessment session for the user
 */
export async function startSession(userId: string): Promise<PatternSession> {
    const { data, error } = await supabase
        .from('pattern_sessions')
        .insert({
            user_id: userId,
            started_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error starting session:', error);
        throw error;
    }

    return data;
}

/**
 * Saves an individual scenario response
 */
export async function saveResponse(
    sessionId: string,
    scenarioId: string,
    selectedOptionId: string,
    responseTimeSeconds: number
): Promise<void> {
    const { error } = await supabase
        .from('pattern_responses')
        .insert({
            session_id: sessionId,
            scenario_id: scenarioId,
            selected_option_id: selectedOptionId,
            response_time_seconds: responseTimeSeconds
        });

    if (error) {
        console.error('Error saving response:', error);
        throw error;
    }
}

/**
 * Completes a session with pattern detection results
 */
export async function completeSession(
    sessionId: string,
    scores: { mind_reading: number; catastrophizing: number; all_or_nothing: number },
    primaryPattern: PatternLabel,
    secondaryPattern: PatternLabel | undefined,
    confidence: ConfidenceLevel,
    isRushed: boolean,
    avgResponseTime: number
): Promise<void> {
    const { error } = await supabase
        .from('pattern_sessions')
        .update({
            completed_at: new Date().toISOString(),
            mind_reading_score: scores.mind_reading,
            catastrophizing_score: scores.catastrophizing,
            all_or_nothing_score: scores.all_or_nothing,
            primary_pattern: primaryPattern,
            secondary_pattern: secondaryPattern || null,
            confidence_level: confidence,
            is_rushed: isRushed,
            avg_response_time_seconds: avgResponseTime
        })
        .eq('id', sessionId);

    if (error) {
        console.error('Error completing session:', error);
        throw error;
    }
}

/**
 * Saves user validation response
 */
export async function submitValidation(
    sessionId: string,
    validationResponse: 'very' | 'somewhat' | 'not_really' | 'not_at_all',
    feedback?: string
): Promise<void> {
    const { error } = await supabase
        .from('pattern_sessions')
        .update({
            validation_response: validationResponse,
            validation_feedback: feedback || null
        })
        .eq('id', sessionId);

    if (error) {
        console.error('Error submitting validation:', error);
        throw error;
    }
}

// =============================================================================
// INSIGHT MANAGEMENT
// =============================================================================

/**
 * Saves generated insights for a session
 */
export async function saveInsight(
    sessionId: string,
    patternType: PatternLabel,
    headline: string,
    insightText: string,
    exampleScenarios: Array<{ scenario_number: number; scenario_context: string; user_choice: string }>,
    secondaryInsight?: string
): Promise<void> {
    const { error } = await supabase
        .from('pattern_insights')
        .insert({
            session_id: sessionId,
            pattern_type: patternType,
            headline: headline,
            insight_text: insightText,
            example_scenarios: exampleScenarios,
            secondary_insight: secondaryInsight || null
        });

    if (error) {
        console.error('Error saving insight:', error);
        throw error;
    }
}

/**
 * Fetches insight for a completed session
 */
export async function getInsight(sessionId: string): Promise<PatternInsight | null> {
    const { data, error } = await supabase
        .from('pattern_insights')
        .select('*')
        .eq('session_id', sessionId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No insight found
            return null;
        }
        console.error('Error fetching insight:', error);
        throw error;
    }

    return data;
}

// =============================================================================
// USER HISTORY
// =============================================================================

/**
 * Fetches all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<PatternSession[]> {
    const { data, error } = await supabase
        .from('pattern_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

    if (error) {
        console.error('Error fetching user sessions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Gets the most recent completed session for a user
 */
export async function getLatestCompletedSession(userId: string): Promise<PatternSession | null> {
    const { data, error } = await supabase
        .from('pattern_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No completed session found
            return null;
        }
        console.error('Error fetching latest session:', error);
        throw error;
    }

    return data;
}

/**
 * Fetches all responses for a session (for insight generation)
 */
export async function getSessionResponses(sessionId: string): Promise<PatternResponse[]> {
    const { data, error } = await supabase
        .from('pattern_responses')
        .select('*')
        .eq('session_id', sessionId);

    if (error) {
        console.error('Error fetching session responses:', error);
        throw error;
    }

    return data || [];
}
