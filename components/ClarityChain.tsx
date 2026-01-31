import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, X, Sparkles, Hand, MoveVertical, Edit2 } from 'lucide-react';
import { View } from '../types';

interface ClarityChainProps {
    onBack: () => void;
    onNavigate?: (view: View) => void;
}

type Step = 'WELCOME' | 'INPUT' | 'REVEAL';
type RevealStatus = 'initial' | 'broken' | 'celebrating' | 'reframed';

// Stage-specific examples with neutral phrasing
const SITUATION_EXAMPLES = [
    "My boss didn't say hi to me in the hallway",
    "I wasn't invited to the team lunch",
    "My message was left on 'read' for 8 hours",
    "I gained 2kg this week"
];

const MEANING_EXAMPLES = [
    "I assumed they are mad at me",
    "I interpreted it as proof I'm not valued",
    "I thought I did something wrong",
    "I concluded I have no self-control"
];

const IMPACT_EXAMPLES = [
    "I avoided eye contact the rest of the day",
    "I felt anxious and couldn't focus",
    "I shut down and didn't speak up",
    "I gave up on my goals for the week"
];

// Fallback suggestions for when API fails
const FALLBACK_SUGGESTIONS = [
    {
        healthyMeaning: "This situation is temporary and doesn't define my worth or capabilities.",
        healthyImpact: "I can learn from this experience and move forward with clarity and compassion for myself."
    },
    {
        healthyMeaning: "I don't have control over everything—only my response and my effort.",
        healthyImpact: "I choose to focus on what I can influence rather than what I can't control."
    },
    {
        healthyMeaning: "This is one data point, not the entire story of who I am or what I'm capable of.",
        healthyImpact: "I acknowledge this moment without letting it define my future actions or self-perception."
    }
];

const ClarityChain: React.FC<ClarityChainProps> = ({ onBack }) => {
    // Check if first time user
    const [isFirstTime, setIsFirstTime] = useState(() => {
        return !localStorage.getItem('clarity_chain_seen');
    });

    const [step, setStep] = useState<Step>(isFirstTime ? 'WELCOME' : 'INPUT');
    const [inputSubStep, setInputSubStep] = useState(0); // 0: Situation, 1: Meaning, 2: Impact
    const [inputs, setInputs] = useState({
        situation: '',
        meaning: '',
        impact: ''
    });
    const [revealStatus, setRevealStatus] = useState<RevealStatus>('initial');
    const [activeBlock, setActiveBlock] = useState<'situation' | 'meaning' | 'impact' | null>(null);
    const [suggestions, setSuggestions] = useState<{ healthyMeaning: string; healthyImpact: string }[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showABCExplanation, setShowABCExplanation] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState<{ healthyMeaning: string; healthyImpact: string } | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [editingBlock, setEditingBlock] = useState<'situation' | 'meaning' | 'impact' | null>(null);

    // Motion values for the draggable tile
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Spring physics for smoother connector movement
    const springConfig = { damping: 25, stiffness: 200 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    // Show tutorial on first reveal
    useEffect(() => {
        if (step === 'REVEAL' && revealStatus === 'initial') {
            const hasSeenTutorial = localStorage.getItem('clarity_chain_tutorial_seen');
            if (!hasSeenTutorial) {
                const timer = setTimeout(() => setShowTutorial(true), 4000);
                return () => clearTimeout(timer);
            }
        }
    }, [step, revealStatus]);

    // Validation: check for meaningful content
    const isInputsValid = () => {
        const minLength = 3; // Reduced for testing smoother flow, ideally 10
        const allFilled = inputs.situation.trim().length >= minLength
            && inputs.meaning.trim().length >= minLength
            && inputs.impact.trim().length >= minLength;
        return allFilled;
    };

    const handleStartPractice = () => {
        localStorage.setItem('clarity_chain_seen', 'true');
        setIsFirstTime(false);
        setStep('INPUT');
        setInputSubStep(0);
    };

    const handleBuildChain = () => {
        if (isInputsValid()) {
            setStep('REVEAL');
            // Scroll to top when building the chain
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNextSubStep = () => {
        if (inputSubStep < 2) {
            setInputSubStep(prev => prev + 1);
        } else {
            handleBuildChain();
        }
    };

    const handleExampleSelect = (text: string) => {
        if (inputSubStep === 0) setInputs(prev => ({ ...prev, situation: text }));
        if (inputSubStep === 1) setInputs(prev => ({ ...prev, meaning: text }));
        if (inputSubStep === 2) setInputs(prev => ({ ...prev, impact: text }));

        // Auto-advance after a brief delay to show the selection
        setTimeout(() => {
            handleNextSubStep();
        }, 400);
    };

    const handleDragEnd = (_: any, info: any) => {
        const distance = Math.hypot(info.offset.x, info.offset.y);
        if (distance > 100) {
            setRevealStatus('broken');
            fetchSuggestions();
        }
    };

    const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setApiError(null);

        try {
            const response = await fetch('http://localhost:3001/api/clarity-chain/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    situation: inputs.situation,
                    unhealthyMeaning: inputs.meaning,
                    unhealthyImpact: inputs.impact
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('No suggestions returned');
            }

            setSuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setApiError("Couldn't connect. Here is a perspective to consider:");
            // Select one random fallback to maintain the singular focus
            const randomFallback = FALLBACK_SUGGESTIONS[Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length)];
            setSuggestions([randomFallback]);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleSuggestionSelect = (suggestion: { healthyMeaning: string; healthyImpact: string }) => {
        setSelectedSuggestion(suggestion);
        setRevealStatus('celebrating');

        // After celebration, apply the reframe
        setTimeout(() => {
            setInputs(prev => ({
                ...prev,
                meaning: suggestion.healthyMeaning,
                impact: suggestion.healthyImpact
            }));
            setRevealStatus('reframed');
            x.set(0);
            y.set(0);
            setSuggestions([]);
        }, 3000);
    };

    const handleTutorialDismiss = () => {
        setShowTutorial(false);
        localStorage.setItem('clarity_chain_tutorial_seen', 'true');
    };

    // Connector Component
    const Connector = ({ isTop, height = 64 }: { isTop: boolean, height?: number }) => {
        const path = useTransform([springX, springY], ([latestX, latestY]) => {
            if (isTop) {
                return `M 0 0 L ${latestX} ${height + (latestY as number)}`;
            } else {
                return `M ${latestX} ${latestY} L 0 ${height}`;
            }
        });

        const strokeWidth = useTransform([springX, springY], ([latestX, latestY]) => {
            const dist = Math.hypot(latestX as number, latestY as number);
            return Math.max(1, 2 - (dist / 40));
        });

        const opacity = useTransform([springX, springY], ([latestX, latestY]) => {
            const dist = Math.hypot(latestX as number, latestY as number);
            return Math.max(0.2, 1 - (dist / 150));
        });

        const labelOpacity = useTransform([springX, springY], ([latestX, latestY]) => {
            const dist = Math.hypot(latestX as number, latestY as number);
            return revealStatus === 'broken' ? 0 : Math.max(0, 1 - (dist / 100));
        });

        return (
            <div className={`relative w-full z-0 pointer-events-none`} style={{ height }}>
                <AnimatePresence>
                    {revealStatus !== 'broken' && (
                        <motion.svg
                            key="connector-line"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            transition={{ duration: 1.5, delay: isTop ? 0.5 : 1.5 }}
                            className="absolute left-1/2 top-0 overflow-visible"
                            style={{ width: "2px", height: "100%" }}
                        >
                            <motion.path
                                d={path}
                                stroke={revealStatus === 'reframed' ? "#86efac" : "#1a1a1a"}
                                strokeWidth={strokeWidth}
                                strokeOpacity={opacity}
                                strokeLinecap="round"
                                fill="none"
                            />
                        </motion.svg>
                    )}
                </AnimatePresence>
                {/* Label */}
                <motion.div
                    style={{ opacity: labelOpacity }}
                    transition={{ delay: isTop ? 0.8 : 1.8, duration: 1.2 }}
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                     bg-[#F2EFE9] px-3 py-1 text-[10px] uppercase tracking-widest font-bold z-10 whitespace-nowrap
                     ${revealStatus === 'reframed' ? 'text-green-600' : 'text-stone-400'}
                    `}
                >
                    {isTop ? 'Interpreted As' : (revealStatus === 'reframed' ? 'Could Lead To' : 'Which Led To')}
                </motion.div>
            </div>
        );
    };

    return (
        <div className="min-h-[80vh] flex flex-col relative max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 z-10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-stone-warm/50 text-stone-600 transition-colors"
                >
                    {step === 'WELCOME' || step === 'INPUT' ? <ArrowLeft size={24} /> : <X size={24} />}
                </button>
                <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">Clarity Chain</span>
                <div className="w-10" />
            </div>

            <AnimatePresence mode="wait">
                {/* WELCOME SCREEN */}
                {step === 'WELCOME' && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-grow flex flex-col items-center justify-center px-6 pb-12 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-20 h-20 bg-charcoal rounded-full flex items-center justify-center mb-8"
                        >
                            <Sparkles className="w-10 h-10 text-white" />
                        </motion.div>

                        <h1 className="text-3xl font-serif text-charcoal mb-4">When to Use This</h1>
                        <p className="text-stone-500 mb-8 max-w-sm leading-relaxed">
                            The Clarity Chain helps you see how your interpretation of an event shapes your experience.
                        </p>

                        <div className="bg-stone-50 rounded-2xl p-6 mb-8 max-w-sm text-left space-y-3">
                            <p className="text-sm font-medium text-charcoal">Use it when:</p>
                            <ul className="space-y-2 text-sm text-stone-600">
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-charcoal rounded-full mt-2 flex-shrink-0" />
                                    <span>You're ruminating on a situation</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-charcoal rounded-full mt-2 flex-shrink-0" />
                                    <span>Emotions feel overwhelming or stuck</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-charcoal rounded-full mt-2 flex-shrink-0" />
                                    <span>You want to challenge negative thoughts</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-charcoal rounded-full mt-2 flex-shrink-0" />
                                    <span>As a daily reflection practice</span>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={handleStartPractice}
                            className="w-full max-w-sm py-4 bg-charcoal text-white rounded-full font-medium hover:bg-black transition-all shadow-lg"
                        >
                            Begin Practice
                        </button>
                    </motion.div>
                )}

                {/* PROGRESSIVE INPUT SCREEN */}
                {step === 'INPUT' && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-grow flex flex-col px-6 pb-12 pt-4"
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl md:text-3xl font-serif text-charcoal mb-2">Build Your Chain</h2>
                            <p className="text-stone-500 text-sm max-w-sm mx-auto">
                                Describe the situation, one step at a time.
                            </p>
                        </div>

                        <div className="w-full max-w-lg mx-auto flex flex-col gap-4">

                            {/* Step 0: Situation */}
                            <motion.div
                                animate={inputSubStep === 0 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.6, y: 0, scale: 0.98 }}
                                onClick={() => inputSubStep > 0 && setInputSubStep(0)}
                                className={`transition-all ${inputSubStep > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
                            >
                                <div className="relative group">
                                    <label className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5 block px-1 ${inputSubStep === 0 ? 'text-charcoal' : 'text-stone-400'}`}>
                                        A. The Situation
                                    </label>
                                    <textarea
                                        value={inputs.situation}
                                        onChange={(e) => setInputs(prev => ({ ...prev, situation: e.target.value }))}
                                        placeholder="e.g., 'My friend didn't reply to my text for 2 days'"
                                        className={`w-full p-4 bg-white border rounded-xl text-stone-700 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all shadow-sm resize-none
                                            ${inputSubStep === 0 ? 'border-stone-200' : 'border-transparent bg-stone-50 text-stone-500 select-none pointer-events-none'}
                                        `}
                                        rows={inputSubStep === 0 ? 3 : 1}
                                        readOnly={inputSubStep !== 0}
                                    />
                                    {inputSubStep === 0 && (
                                        <div className="mt-1 px-1 flex justify-between items-center">
                                            <span className="text-[9px] text-stone-300 italic uppercase tracking-wider">Facts only</span>
                                            {inputs.situation.length > 0 && inputs.situation.length < 10 && (
                                                <span className="text-[9px] text-orange-400 font-medium">Be more specific...</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Step 1: Meaning */}
                            <AnimatePresence>
                                {(inputSubStep >= 1) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={inputSubStep === 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.6, y: 0, scale: 0.98 }}
                                        onClick={() => inputSubStep > 1 && setInputSubStep(1)}
                                        className={`transition-all ${inputSubStep > 1 ? 'cursor-pointer hover:opacity-80' : ''}`}
                                    >
                                        <div className="relative group">
                                            <label className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5 block px-1 ${inputSubStep === 1 ? 'text-charcoal' : 'text-stone-400'}`}>
                                                B. Your Perspective
                                            </label>
                                            <textarea
                                                value={inputs.meaning}
                                                onChange={(e) => setInputs(prev => ({ ...prev, meaning: e.target.value }))}
                                                placeholder="e.g., 'They are avoiding me because I did something wrong'"
                                                className={`w-full p-4 bg-white border rounded-xl text-stone-700 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all shadow-sm resize-none
                                                     ${inputSubStep === 1 ? 'border-stone-200' : 'border-transparent bg-stone-50 text-stone-500 select-none pointer-events-none'}
                                                `}
                                                rows={inputSubStep === 1 ? 3 : 1}
                                                readOnly={inputSubStep !== 1}
                                            />
                                            {inputSubStep === 1 && (
                                                <div className="mt-1 px-1 flex justify-between items-center">
                                                    <span className="text-[9px] text-stone-300 italic uppercase tracking-wider">How you saw it</span>
                                                    {inputs.meaning.length > 0 && inputs.meaning.length < 10 && (
                                                        <span className="text-[9px] text-orange-400 font-medium">Add more detail...</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Step 2: Impact */}
                            <AnimatePresence>
                                {(inputSubStep >= 2) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                    >
                                        <div className="relative group">
                                            <label className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold mb-1.5 block px-1">
                                                C. The Result
                                            </label>
                                            <textarea
                                                value={inputs.impact}
                                                onChange={(e) => setInputs(prev => ({ ...prev, impact: e.target.value }))}
                                                placeholder="e.g., 'I felt anxious and couldn't focus on my work'"
                                                className="w-full p-4 bg-white border border-stone-200 rounded-xl text-stone-700 placeholder-stone-300 focus:outline-none focus:border-stone-400 transition-all shadow-sm resize-none"
                                                rows={3}
                                            />
                                            <div className="mt-1 px-1 flex justify-between items-center">
                                                <span className="text-[9px] text-stone-300 italic uppercase tracking-wider">What followed</span>
                                                {inputs.impact.length > 0 && inputs.impact.length < 10 && (
                                                    <span className="text-[9px] text-orange-400 font-medium">Describe the feeling...</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Dynamic Example Selection Card */}
                            <AnimatePresence mode="wait">
                                {/* Only show examples if we are NOT on the last step with text entered */}
                                {(!((inputSubStep === 2) && inputs.impact.length > 5)) && (
                                    <motion.div
                                        key={`examples-${inputSubStep}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-stone-50/80 rounded-2xl p-5 border border-stone-100"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles size={14} className="text-stone-400" />
                                            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Try an example</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {(inputSubStep === 0 ? SITUATION_EXAMPLES : (inputSubStep === 1 ? MEANING_EXAMPLES : IMPACT_EXAMPLES)).map((text, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleExampleSelect(text)}
                                                    className="text-left text-xs p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/50 hover:border-stone-300 transition-all text-stone-600 group"
                                                >
                                                    <span className="line-clamp-1 opacity-80 group-hover:opacity-100 italic">"{text}"</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="mt-4">
                                {inputSubStep < 2 ? (
                                    <button
                                        onClick={handleNextSubStep}
                                        disabled={
                                            (inputSubStep === 0 && inputs.situation.length < 3) ||
                                            (inputSubStep === 1 && inputs.meaning.length < 3)
                                        }
                                        className={`w-full py-4 rounded-full font-medium transition-all ${((inputSubStep === 0 && inputs.situation.length >= 3) || (inputSubStep === 1 && inputs.meaning.length >= 3))
                                            ? 'bg-charcoal text-white hover:bg-black shadow-lg'
                                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleBuildChain}
                                        disabled={!isInputsValid()}
                                        className={`w-full py-4 rounded-full font-medium transition-all ${isInputsValid()
                                            ? 'bg-charcoal text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isInputsValid() ? 'Build the Chain' : 'Complete all fields...'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* REVEAL SCREEN */}
                {step === 'REVEAL' && (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col items-center px-6 pb-12 pt-4"
                    >
                        <div className="w-full max-md space-y-0 relative flex flex-col items-center max-w-md">

                            {/* Block 1: Situation */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                onClick={() => revealStatus === 'initial' && setActiveBlock('situation')}
                                className={`relative z-10 p-6 rounded-2xl border transition-all cursor-pointer w-full ${activeBlock === 'situation'
                                    ? 'bg-white border-black shadow-md scale-[1.02]'
                                    : 'bg-white/60 border-stone-warm/50 hover:bg-white/80 group'
                                    }`}
                            >
                                {revealStatus === 'initial' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingBlock('situation');
                                        }}
                                        aria-label="Edit Situation"
                                        className="absolute top-3 right-3 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-300 hover:text-charcoal transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">The Fact</span>
                                    <span className="text-[10px] text-stone-300 italic">Objective event</span>
                                </div>
                                <p className="text-black text-lg">{inputs.situation}</p>
                            </motion.div>

                            {/* Connector 1 */}
                            <Connector isTop={true} height={80} />

                            {/* Block 2: Meaning (Draggable) */}
                            <motion.div
                                key="meaning"
                                initial={{ opacity: 0, y: 30 }}
                                animate={revealStatus === 'initial' ? {
                                    opacity: 1,
                                    y: 0,
                                    scale: [1, 1.02, 1],
                                    boxShadow: [
                                        "0 0 0 0 rgba(0,0,0,0.15)",
                                        "0 0 0 12px rgba(0,0,0,0.05)",
                                        "0 0 0 0 rgba(0,0,0,0)"
                                    ]
                                } : { opacity: 1, y: 0 }}
                                transition={revealStatus === 'initial' ? {
                                    opacity: { delay: 1.0, duration: 0.8 },
                                    y: { delay: 1.0, duration: 0.8 },
                                    scale: { duration: 2.5, repeat: Infinity, repeatDelay: 2 },
                                    boxShadow: { duration: 2.5, repeat: Infinity, repeatDelay: 2 }
                                } : {
                                    delay: 1.0,
                                    duration: 0.8,
                                    ease: "easeOut"
                                }}
                                style={{ x, y, zIndex: 50 }}
                                drag={revealStatus === 'initial'}
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleDragEnd}
                                whileTap={revealStatus === 'initial' ? { cursor: "grabbing" } : {}}
                                onClick={() => revealStatus === 'initial' && setActiveBlock('meaning')}
                                tabIndex={revealStatus === 'initial' ? 0 : -1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && revealStatus === 'initial') {
                                        setRevealStatus('broken');
                                        fetchSuggestions();
                                    }
                                }}
                                aria-label={revealStatus === 'initial' ? "Meaning tile. Drag away or press Enter to break the chain." : "Meaning tile"}
                                className={`relative p-6 rounded-2xl border-[1.5px] transition-all w-full group
                                    ${revealStatus === 'broken'
                                        ? 'bg-white border-stone-200'
                                        : (revealStatus === 'reframed'
                                            ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-300 shadow-lg pr-16'
                                            : 'bg-black border-black shadow-xl scale-[1.03] cursor-grab'
                                        )
                                    }`}
                            >
                                {revealStatus === 'reframed' && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                        className="absolute -top-3 -right-3 w-10 h-10 bg-green-400 rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <Sparkles size={20} className="text-white" />
                                    </motion.div>
                                )}

                                {revealStatus === 'reframed' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowABCExplanation(true);
                                        }}
                                        aria-label="What happened?"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 transition-colors group"
                                        title="What just happened?"
                                    >
                                        <div className="flex items-center space-x-2 px-1">
                                            <span className="text-[10px] font-bold uppercase tracking-tight hidden group-hover:block">Insight</span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                                            </svg>
                                        </div>
                                    </button>
                                )}

                                {revealStatus === 'initial' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingBlock('meaning');
                                        }}
                                        aria-label="Edit Meaning"
                                        className="absolute top-3 right-3 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/20 text-stone-500 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] uppercase tracking-widest font-bold block ${revealStatus === 'broken' ? 'text-stone-400' : (revealStatus === 'reframed' ? 'text-green-700' : 'text-stone-500')}`}>
                                        {revealStatus === 'broken' ? 'Reframing...' : (revealStatus === 'reframed' ? 'The Reframe' : 'The Interpretation')}
                                    </span>
                                    {revealStatus === 'initial' && <span className="text-[10px] text-stone-600 italic">The story added</span>}
                                </div>

                                {revealStatus !== 'broken' && (
                                    <p className={`${revealStatus === 'reframed' ? 'text-charcoal' : 'text-white'} text-xl font-medium serif italic`}>"{inputs.meaning}"</p>
                                )}

                                {revealStatus === 'broken' && isLoadingSuggestions && (
                                    <div className="py-4 flex justify-center">
                                        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
                                    </div>
                                )}
                            </motion.div>

                            {/* Mobile-friendly drag hint */}
                            {revealStatus === 'initial' && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                                    className="text-xs text-stone-400 mt-3 text-center flex items-center justify-center gap-2"
                                >
                                    <MoveVertical size={14} />
                                    <span>Drag or tap to break the chain</span>
                                </motion.p>
                            )}

                            {/* Error Message & Retry */}
                            {apiError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center mt-4 w-full"
                                >
                                    <p className="text-xs text-orange-700 font-medium">{apiError}</p>
                                    <div className="flex flex-col items-center gap-3 mt-4">
                                        <p className="text-xs text-stone-500 italic">"If there was no 'meaning' in this situation, how would you naturally react?"</p>
                                        <button
                                            onClick={fetchSuggestions}
                                            className="text-xs text-orange-600 underline hover:text-orange-800"
                                        >
                                            Try reaching AI again
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Suggestions List */}
                            <AnimatePresence>
                                {revealStatus === 'broken' && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="w-full mt-4 space-y-3 z-50"
                                    >
                                        <p className="text-[10px] uppercase tracking-widest text-stone-600 font-bold text-center mb-2 italic">Allow yourself to see this differently...</p>
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSuggestionSelect(s)}
                                                className="w-full p-4 bg-white border border-stone-200 rounded-xl text-left hover:border-green-400 hover:shadow-sm transition-all group"
                                            >
                                                <p className="text-sm text-stone-800 font-medium group-hover:text-charcoal">"{s.healthyMeaning}"</p>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Connector 2 */}
                            <Connector isTop={false} height={80} />

                            {/* Block 3: Impact / Reframed View */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 2.0,
                                    duration: 0.8,
                                    ease: "easeOut"
                                }}
                                onClick={() => revealStatus !== 'broken' && setActiveBlock('impact')}
                                className={`relative z-10 p-6 rounded-2xl border transition-all cursor-pointer w-full group
                                    ${revealStatus !== 'broken'
                                        ? (revealStatus === 'reframed'
                                            ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-300 shadow-md'
                                            : (activeBlock === 'impact' ? 'bg-white border-black shadow-md scale-[1.02]' : 'bg-white/60 border-stone-warm/50 hover:bg-white/80')
                                        )
                                        : 'bg-white/60 border-stone-warm/50'
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {(revealStatus === 'initial' || revealStatus === 'reframed') ? (
                                        <motion.div
                                            key="impact_content"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] uppercase tracking-widest font-bold block ${revealStatus === 'reframed' ? 'text-green-700' : 'text-stone-400'}`}>
                                                    {revealStatus === 'reframed' ? 'The Consequence' : 'The Result'}
                                                </span>
                                                {revealStatus === 'initial' && <span className="text-[10px] text-stone-300 italic">Feeling or action</span>}
                                            </div>
                                            {revealStatus === 'initial' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingBlock('impact');
                                                    }}
                                                    aria-label="Edit Impact"
                                                    className="absolute top-3 right-3 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-300 hover:text-charcoal transition-colors md:opacity-0 md:group-hover:opacity-100"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            <p className="text-black text-lg">{inputs.impact}</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="reframed_content"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                            className="text-center py-1 w-full"
                                        >
                                            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2">Expected Outcome</span>
                                            <p className="text-stone-300 text-sm italic leading-relaxed">
                                                {isLoadingSuggestions ? "..." : "A healthy outcome follows a healthy meaning."}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Reconnect Action */}
                            <AnimatePresence>
                                {revealStatus === 'broken' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="mt-6"
                                    >
                                        <button
                                            onClick={() => {
                                                setRevealStatus('initial');
                                                x.set(0);
                                                y.set(0);
                                            }}
                                            className="p-3 bg-charcoal hover:bg-black text-[10px] font-bold uppercase tracking-widest text-white rounded-full transition-colors shadow-lg min-w-[160px] min-h-[44px]"
                                        >
                                            Reconnect Chain
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 3, duration: 1.5 }}
                            className="text-stone-500 text-sm text-center mt-12 max-w-xs leading-relaxed italic"
                        >
                            {revealStatus !== 'broken' ? (
                                revealStatus === 'reframed' ? (
                                    <>
                                        The chain is whole again, but with a new perspective.<br />
                                        The outcome is no longer inevitable.
                                    </>
                                ) : (
                                    <>
                                        Situations don't directly create pressure.<br />
                                        The meaning added in between shapes what follows.
                                    </>
                                )
                            ) : (
                                "When the interpretation is removed, the inevitable outcome disappears."
                            )}
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            onClick={onBack}
                            className="mt-8 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-charcoal transition-colors mb-12"
                        >
                            Close Practice
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OVERLAYS THAT PERSIST */}
            <AnimatePresence>
                {showTutorial && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-charcoal/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={handleTutorialDismiss}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-sm text-center space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center mx-auto">
                                <motion.div
                                    animate={{
                                        x: [0, -15, 0],
                                        y: [0, -15, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 0.5
                                    }}
                                >
                                    <Hand className="w-8 h-8 text-white" />
                                </motion.div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-serif text-charcoal">Break the Chain</h3>
                                <p className="text-sm text-stone-600 leading-relaxed">
                                    The black block in the middle represents the <strong>meaning</strong> you added.
                                </p>
                                <p className="text-sm text-stone-500">
                                    Drag it away or tap it to see what happens when you remove your interpretation.
                                </p>
                            </div>
                            <button
                                onClick={handleTutorialDismiss}
                                className="w-full py-3 bg-charcoal text-white rounded-xl font-medium hover:bg-black transition-colors"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {revealStatus === 'celebrating' && selectedSuggestion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center space-y-6 max-w-sm"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-24 h-24 bg-green-100/50 rounded-full flex items-center justify-center mx-auto"
                            >
                                <Sparkles className="w-12 h-12 text-green-500" />
                            </motion.div>
                            <h2 className="text-3xl font-serif text-green-800">Perspective Shifted</h2>
                            <p className="text-green-700/80 leading-relaxed">
                                You've replaced a limiting belief with a more constructive truth.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingBlock && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setEditingBlock(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-serif mb-4 capitalize">Edit {editingBlock}</h3>
                            <textarea
                                value={inputs[editingBlock]}
                                onChange={(e) => setInputs(prev => ({ ...prev, [editingBlock]: e.target.value }))}
                                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl mb-4 focus:outline-none focus:border-stone-400 min-h-[120px]"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingBlock(null)}
                                    className="px-4 py-2 text-stone-500 hover:text-charcoal transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setEditingBlock(null)}
                                    className="px-6 py-2 bg-charcoal text-white rounded-full hover:bg-black transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showABCExplanation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/10 backdrop-blur-sm"
                        onClick={() => setShowABCExplanation(false)}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-2xl p-6 max-w-sm shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-serif mb-2 text-charcoal">The ABC Model</h3>
                            <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
                                <p>
                                    This exercise is based on <strong>Albert Ellis's ABC Model</strong> of cognitive behavioral therapy.
                                </p>
                                <ul className="space-y-2 ml-4 list-disc">
                                    <li><strong>A (Activating Event):</strong> The objective situation (Step 1).</li>
                                    <li><strong>B (Belief):</strong> Your interpretation of the event (Step 2).</li>
                                    <li><strong>C (Consequence):</strong> The emotional/behavioral result (Step 3).</li>
                                </ul>
                                <p className="bg-stone-50 p-3 rounded-lg border border-stone-100 italic text-stone-500">
                                    "One must lift oneself by one's own self; the mind alone is the friend of the self, and the mind alone is the enemy of the self." (Gita 6.5)
                                </p>
                            </div>
                            <button
                                onClick={() => setShowABCExplanation(false)}
                                className="w-full mt-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-medium transition-colors"
                            >
                                Close Insight
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClarityChain;
