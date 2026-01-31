// Pattern Insights Service
// Generates personalized insight text based on detected patterns

import {
    PatternLabel,
    ConfidenceLevel
} from '../types';
import { getPatternVerb, getPatternContext } from './patternDetection';

interface ExampleScenario {
    scenario_number: number;
    scenario_context: string;
    user_choice: string;
}

interface InsightResult {
    headline: string;
    insightText: string;
    secondaryInsight?: string;
}

// =============================================================================
// HEADLINE TEMPLATES
// =============================================================================

const HEADLINES: Record<PatternLabel, Record<ConfidenceLevel, string>> = {
    mind_reader: {
        high: "You're a Mind Reader",
        medium: "You Lean Toward Mind Reading",
        low: "You Lean Toward Mind Reading"
    },
    future_predictor: {
        high: "You're a Future Predictor",
        medium: "You Lean Toward Future Predicting",
        low: "You Lean Toward Future Predicting"
    },
    perfectionist_thinker: {
        high: "You're a Perfectionist Thinker",
        medium: "You Lean Toward Perfectionist Thinking",
        low: "You Lean Toward Perfectionist Thinking"
    },
    balanced_thinker: {
        high: "You're a Balanced Thinker",
        medium: "You're a Balanced Thinker",
        low: "You're a Balanced Thinker"
    },
    mixed_pattern: {
        high: "You Have a Mixed Pattern",
        medium: "You Have a Mixed Pattern",
        low: "You Have a Mixed Pattern"
    }
};

// =============================================================================
// INSIGHT TEMPLATES
// =============================================================================

function formatExamples(examples: ExampleScenario[], patternType: string): string {
    const verb = getPatternVerb(patternType);

    return examples.map(ex => {
        // Shorten the context for display
        const shortContext = shortenContext(ex.scenario_context);
        return `When ${shortContext}, you ${verb}: "${ex.user_choice}"`;
    }).join('\n\n');
}

function shortenContext(context: string): string {
    // Extract the key situation from the full setup text
    const shortened = context
        .replace(/You ('ve|have) /gi, 'you ')
        .replace(/You('re| are) /gi, 'you were ')
        .replace(/\. .+$/, '') // Remove second sentence
        .toLowerCase()
        .trim();

    // Capitalize first letter
    return shortened.charAt(0).toLowerCase() + shortened.slice(1);
}

// =============================================================================
// MIND READER INSIGHTS
// =============================================================================

function getMindReaderInsight(confidence: ConfidenceLevel, examples: ExampleScenario[]): string {
    const examplesText = formatExamples(examples, 'mind_reading');

    if (confidence === 'high') {
        return `You're a Mind Reader. You tend to fill in the blanks about what others are thinking, especially in social situations. When someone's quiet, takes time to respond, or seems distracted, you often assume it's about you.

**Your specific patterns:**

${examplesText}

**What this means:**
Your brain is doing what brains do: trying to predict what others think to navigate social situations. This worked great for our ancestors in small tribes where reading social cues was survival. The exhausting part? Your brain applies this same hypervigilance to texts, emails, and people you'll never see again.

Here's the paradox: The more you try to figure out what someone's thinking, the less accurate you become. Your brain fills in blanks with your own fears, not reality.

**What helps:**
When you catch yourself mind-reading, try this: "What do I actually know vs. what am I imagining?" Most of the time, the answer is "I'm imagining."`;
    }

    return `You lean toward Mind Reading. In uncertain social situations, you sometimes fill in gaps by assuming what others are thinking. It's not your dominant pattern, but it shows up when you're feeling uncertain.

**Your specific patterns:**

${examplesText}

**What this means:**
You don't mind-read constantly. It shows up in specific situations. This makes sense: uncertainty triggers your brain's prediction system. When you know someone well, you have real data. When you don't, your brain fills in gaps. Under stress or in new situations, those gaps get filled with worst-case assumptions.

The pattern: Notice if this happens more with authority figures, new relationships, or when stakes feel high. That's your brain trying to protect you from social mistakes.

**What helps:**
In those specific situations, pause and ask: "Am I responding to what's actually happening, or to what I'm afraid might be happening?"`;
}

// =============================================================================
// FUTURE PREDICTOR INSIGHTS
// =============================================================================

function getFuturePredictorInsight(confidence: ConfidenceLevel, examples: ExampleScenario[]): string {
    const examplesText = formatExamples(examples, 'catastrophizing');

    if (confidence === 'high') {
        return `You're a Future Predictor. When facing uncertainty, you tend to imagine worst-case scenarios. Small problems feel like they could snowball into disasters, and upcoming events trigger "what if" spirals.

**Your specific patterns:**

${examplesText}

**What this means:**
Your brain is running ancient software designed for immediate physical threats: predators, injuries, starvation. When it detects uncertainty (job interview, weird symptom, delayed flight), it treats it like mortal danger and generates worst-case scenarios.

Why small things feel huge: Once the catastrophizing starts, your brain looks for evidence to confirm the threat. That headache becomes a tumor. That mistake becomes a firing. The more you think about it, the more real it feels, even though nothing has actually happened yet.

The research shows: 85% of what we catastrophize about never happens. And of the 15% that do happen, they're rarely as bad as we imagined. Your prediction track record is worse than a weather forecast.

**What helps:**
When the spiral starts, ground yourself: "What's actually happening right now vs. what I'm imagining might happen?" Present-tense reality is almost always less scary than future-tense fear.`;
    }

    return `You lean toward Future Predicting. When things feel uncertain, you sometimes jump to worst-case scenarios. It's not constant, but it shows up in specific situations.

**Your specific patterns:**

${examplesText}

**What this means:**
You don't catastrophize about everything. Certain triggers activate it: health concerns, high-stakes challenges, unexpected changes. Your brain is trying to prepare you for the worst so you're not caught off-guard. The problem? Preparation becomes paralysis when the imagined threat consumes more energy than the actual event would.

Why certain situations trigger this: Your brain has learned that uncertainty in these specific domains feels dangerous. Maybe a past health scare, a big failure, or a sudden change taught your brain to be hypervigilant in similar situations. It's trying to protect you, but it's overestimating the danger.

**What helps:**
When you feel the spiral starting, pause and ask: "How likely is this worst-case scenario, really? And if it did happen, could I handle it?" Most of the time, the answer is "unlikely" and "yes."`;
}

// =============================================================================
// PERFECTIONIST THINKER INSIGHTS
// =============================================================================

function getPerfectionistInsight(confidence: ConfidenceLevel, examples: ExampleScenario[]): string {
    const examplesText = formatExamples(examples, 'all_or_nothing');

    if (confidence === 'high') {
        return `You're a Perfectionist Thinker. You tend to see things in black and white. Success or failure. Perfect or worthless. If you can't do something completely right, it feels like there's no point.

**Your specific patterns:**

${examplesText}

**What this means:**
All-or-nothing thinking often develops as a control strategy. If you can be "perfect," you can avoid criticism, failure, or disappointment. It's your brain's attempt to create certainty in an uncertain world. The cruel irony? Perfect doesn't exist, so you're constantly falling short of an impossible standard.

Why you give up: If "good enough" feels like failure, why bother? This is actually logical. If 80% and 0% both feel like failure in your mind, there's no incentive to try. Your brain is being consistent with its own rules, even if those rules are exhausting.

What research shows: High achievers who allow "good enough" actually accomplish more over time than perfectionists because they don't burn out or quit after setbacks.

**What helps:**
When you catch the all-or-nothing voice, ask: "What would I tell a friend in this situation?" You'd never hold them to the standard you hold yourself.`;
    }

    return `You lean toward Perfectionist Thinking. In certain areas of your life, you hold yourself to very high standards. Partial success can sometimes feel like failure.

**Your specific patterns:**

${examplesText}

**What this means:**
You don't apply all-or-nothing thinking to everything. It shows up in specific domains where the stakes feel highest: maybe fitness, work performance, learning, or relationships. These might be areas where you've been praised for excellence, criticized for mistakes, or where you've tied your self-worth to outcomes.

Why it persists in these areas: Your brain has evidence that high standards "work" in these domains. Maybe they got you recognition, avoided criticism, or helped you succeed. The problem? The same strategy that drives achievement can also drive burnout, procrastination, or giving up when things get hard.

**What helps:**
In those specific domains, practice the middle ground: "Three workouts is better than zero, even if it's not five." Ask yourself: "What's the middle ground here? What would 'good enough' look like?"`;
}

// =============================================================================
// BALANCED THINKER INSIGHTS
// =============================================================================

function getBalancedInsight(examples: ExampleScenario[]): string {
    const examplesText = examples.map(ex => {
        const shortContext = shortenContext(ex.scenario_context);
        return `When ${shortContext}, you recognized: "${ex.user_choice}"`;
    }).join('\n\n');

    return `You're a Balanced Thinker. Across these scenarios, you showed a remarkably even-keeled approach. You don't jump to worst-case scenarios, you don't assume you know what others are thinking, and you're generally fair to yourself.

**What we noticed:**

• You tend to consider multiple perspectives
• You give people (including yourself) the benefit of the doubt
• You stay grounded even in ambiguous situations

**For example:**

${examplesText}

**What this means:**
Balanced thinking isn't about never having distorted thoughts. It's about not getting stuck in them. You showed an ability to hold multiple perspectives, question your first assumptions, and give people (including yourself) the benefit of the doubt. These are learnable skills, and you seem to have practiced them.

**What you're doing that works:**
• When uncertain, you consider multiple explanations (not just the scariest one)
• When things go wrong, you don't catastrophize or personalize automatically
• When you're not perfect, you don't treat it as total failure

This doesn't mean you're immune to cognitive distortions. Nobody is, especially under extreme stress or in your specific trigger areas. But you've developed good baseline habits.

**Stay curious:**
Even balanced thinkers benefit from noticing when they do slip into patterns. Pay attention to which situations make you less balanced. That's where the work is.`;
}

// =============================================================================
// MIXED PATTERN INSIGHTS
// =============================================================================

function getMixedPatternInsight(
    patterns: PatternLabel[],
    examples: ExampleScenario[]
): string {
    // Get context descriptions for the detected patterns
    const pattern1Context = getPatternContext(patterns[0]);
    const pattern2Context = patterns[1] ? getPatternContext(patterns[1]) : 'other situations';

    const pattern1Name = patterns[0].replace(/_/g, ' ').replace('thinker', '').trim();
    const pattern2Name = patterns[1] ? patterns[1].replace(/_/g, ' ').replace('thinker', '').trim() : '';

    return `You show a Mixed Pattern. Your thinking doesn't fall neatly into one category. You scored similarly across multiple patterns, which means your cognitive tendencies vary depending on the situation.

**What we noticed:**

• In ${pattern1Context}, you tend toward ${pattern1Name}
• In ${pattern2Context}, you lean toward ${pattern2Name || 'different thinking styles'}

**What this means:**
Your thinking patterns shift depending on context. This isn't confusion, it's psychological flexibility. Different situations have different stakes and trigger different protective responses.

**Why patterns shift:**
• Social situations might trigger mind-reading because relationships feel unpredictable
• Future-focused uncertainty might trigger catastrophizing because you can't control outcomes
• Performance situations might trigger all-or-nothing thinking because you equate worth with results

This makes sense. Your brain is using different strategies for different threats. The challenge is that these strategies sometimes create more stress than they prevent.

**What helps:**
Start noticing the pattern-to-context match. "Oh, I'm catastrophizing about health again" or "I'm mind-reading at work again." Once you see the pattern, you can question it: "Is this thought helping me or just stressing me out?"`;
}

// =============================================================================
// MAIN INSIGHT GENERATOR
// =============================================================================

/**
 * Generates complete insight based on detected pattern
 */
export function generateInsight(
    primaryPattern: PatternLabel,
    confidence: ConfidenceLevel,
    examples: ExampleScenario[],
    secondaryPattern?: PatternLabel
): InsightResult {
    const headline = HEADLINES[primaryPattern][confidence];
    let insightText: string;
    let secondaryInsight: string | undefined;

    switch (primaryPattern) {
        case 'mind_reader':
            insightText = getMindReaderInsight(confidence, examples);
            break;
        case 'future_predictor':
            insightText = getFuturePredictorInsight(confidence, examples);
            break;
        case 'perfectionist_thinker':
            insightText = getPerfectionistInsight(confidence, examples);
            break;
        case 'balanced_thinker':
            insightText = getBalancedInsight(examples);
            break;
        case 'mixed_pattern':
            // For mixed pattern, we need to determine which patterns are tied
            const mixedPatterns: PatternLabel[] = [
                secondaryPattern || 'mind_reader',
                'future_predictor'
            ];
            insightText = getMixedPatternInsight(mixedPatterns, examples);
            break;
        default:
            insightText = getBalancedInsight(examples);
    }

    // Generate brief secondary insight if applicable
    if (secondaryPattern && primaryPattern !== 'mixed_pattern' && primaryPattern !== 'balanced_thinker') {
        secondaryInsight = getSecondaryInsight(secondaryPattern);
    }

    return {
        headline,
        insightText,
        secondaryInsight
    };
}

function getSecondaryInsight(pattern: PatternLabel): string {
    switch (pattern) {
        case 'mind_reader':
            return "You also show some tendency toward Mind Reading in social situations. When you're stressed, you might assume others are thinking negatively about you.";
        case 'future_predictor':
            return "You also show some tendency toward Future Predicting. When facing uncertainty, you sometimes jump to worst-case scenarios.";
        case 'perfectionist_thinker':
            return "You also show some tendency toward Perfectionist Thinking. In certain areas, partial success might feel like failure.";
        default:
            return "";
    }
}

// =============================================================================
// EDGE CASE MESSAGES
// =============================================================================

export const RUSHED_WARNING = `**Quick note:** We noticed you moved through the scenarios fairly quickly. Pattern detection works best when you take a moment to consider what feels most natural to you. Your results are below, but if you'd like to retake this when you have more time to reflect, just click "Retake Assessment."`;

export const ALL_BALANCED_ADDENDUM = `

You consistently chose balanced responses across all 15 scenarios. This suggests either:

1. You genuinely have very balanced thinking patterns (excellent!), or
2. You were choosing what you think you *should* think rather than what you *actually* think in the moment

**If it's #1:**
That's a real strength. You've likely developed some solid mental habits for navigating uncertainty without spiraling.

**If it's #2:**
That's totally understandable. It's natural to want to look good, even to ourselves. But this tool works best when you're honest about your first instinct, not your ideal self. If you want to try again with your gut reactions, click "Retake Assessment."`;

export const DISAGREEMENT_MESSAGE = `Thank you for the honest feedback. We're sorry the insights didn't resonate. A few possibilities:

• The 15 scenarios might not have captured the situations you encounter most
• Your thinking patterns might be context-specific in ways we didn't detect
• You might genuinely have very balanced thinking, and we're reading too much into the data

Your input helps us improve this tool.`;
