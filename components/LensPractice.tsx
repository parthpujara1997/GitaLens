import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, BookOpen, ExternalLink, Globe, HelpCircle, Check, ChevronLeft } from 'lucide-react';
import { LENSES } from '../src/data/lenses';
import { Lens, View } from '../types';
import { GITA_VERSES } from '../gitaData';
// @ts-ignore
import hindiVersesData from '../src/data/hindiVerses.json';

const hindiVerses = hindiVersesData as Record<string, string>;

interface LensPracticeProps {
    onBack: () => void;
    onNavigate?: (view: View, data?: any) => void;
    language?: 'english' | 'hindi';
    onLanguageChange?: (lang: 'english' | 'hindi') => void;
}

type Step = 'INTRO' | 'SELECTION' | 'GROUNDING' | 'ORIENTATION' | 'PROMPT' | 'CLOSURE';

const STORAGE_KEY_INTRO = 'hasSeenLensIntro';
const STORAGE_KEY_SESSION = 'lensPracticeSession';

const LensPractice: React.FC<LensPracticeProps> = ({
    onBack,
    onNavigate,
    language: propLanguage,
    onLanguageChange
}) => {
    // State
    const [step, setStep] = useState<Step>('SELECTION'); // Default to SELECTION, check Intro in useEffect
    const [selectedLensId, setSelectedLensId] = useState<string | null>(null);
    const [showVerse, setShowVerse] = useState(false);

    // Language state (internal fallback if not provided via props)
    const [internalLanguage, setInternalLanguage] = useState<'english' | 'hindi'>('english');
    const language = propLanguage || internalLanguage;

    // UI States
    const [showIntroOverlay, setShowIntroOverlay] = useState(false);
    const [groundingLinesVisible, setGroundingLinesVisible] = useState(false);
    const [breathPhase, setBreathPhase] = useState<'idle' | 'active' | 'done'>('idle');
    const [isComplete, setIsComplete] = useState(false);

    // Grounding specific state
    const [visibleGroundingIndex, setVisibleGroundingIndex] = useState(0);

    // Derived state
    const selectedLens = useMemo(() =>
        selectedLensId ? LENSES.find(l => l.id === selectedLensId) : null,
        [selectedLensId]);

    const currentVerse = selectedLens ? GITA_VERSES.find(v => v.id === selectedLens.verseId) : null;

    const verseText = useMemo(() => {
        if (!currentVerse) return '';
        if (language === 'hindi') {
            const key = `${currentVerse.chapter}-${currentVerse.verse}`;
            return hindiVerses[key] || currentVerse.text;
        }
        return currentVerse.text;
    }, [currentVerse, language]);

    const isHindiFallback = language === 'hindi' && currentVerse && (() => {
        const key = `${currentVerse.chapter}-${currentVerse.verse}`;
        return !hindiVerses[key];
    })();

    const groundingLines = useMemo(() => {
        if (!selectedLens) return [];
        const text = language === 'hindi' && selectedLens.groundingTextHindi
            ? selectedLens.groundingTextHindi
            : selectedLens.groundingText;
        return text.split('\n\n');
    }, [selectedLens, language]);

    // --- Effects ---

    // 1. Check Intro & Restore Session
    useEffect(() => {
        // Language init
        const storedLang = localStorage.getItem('userLanguage') as 'english' | 'hindi';
        if (storedLang && !propLanguage) {
            setInternalLanguage(storedLang);
        }

        // Check if first time
        const hasSeenIntro = localStorage.getItem(STORAGE_KEY_INTRO);

        // Check session storage
        const sessionData = sessionStorage.getItem(STORAGE_KEY_SESSION);

        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                if (parsed.selectedLensId) setSelectedLensId(parsed.selectedLensId);
                if (parsed.step) setStep(parsed.step);
                // We don't restore exact grounding state to avoid animation glitches, 
                // but we could if needed. For now, restarting step is safer.
                if (parsed.step === 'GROUNDING') {
                    // For grounding, we might want to skip animation if already done, 
                    // but re-grounding is fine.
                }
            } catch (e) {
                console.error("Failed to restore session", e);
            }
        } else if (!hasSeenIntro) {
            setShowIntroOverlay(true);
        }
    }, [propLanguage]);

    // 2. Persist Session
    useEffect(() => {
        if (selectedLensId) {
            const data = {
                selectedLensId,
                step,
                timestamp: Date.now()
            };
            sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data));
        }
    }, [selectedLensId, step]);


    // 3. Grounding Logic
    useEffect(() => {
        let promptTimer: NodeJS.Timeout;

        if (step === 'GROUNDING') {
            // Reset prompt for the new line
            setBreathPhase('idle'); // Reuse this state clearly: 'idle' = no prompt, 'done' = show prompt

            // Show "Tap to continue" after 6 seconds
            promptTimer = setTimeout(() => {
                setBreathPhase('done');
            }, 6000);
        }

        return () => {
            clearTimeout(promptTimer);
        };
    }, [step, visibleGroundingIndex]); // Re-run when line changes


    // 4. Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showIntroOverlay || showVerse) return;

            if (e.key === ' ' || e.key === 'Enter') {
                handleNext();
            } else if (e.key === 'Escape') {
                if (step === 'SELECTION') onBack();
                else handleChangeLens();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [step, showIntroOverlay, showVerse, visibleGroundingIndex, groundingLines.length]);


    // --- Handlers ---

    const handleBegin = () => {
        localStorage.setItem(STORAGE_KEY_INTRO, 'true');
        setShowIntroOverlay(false);
        if (step === 'INTRO') setStep('SELECTION');
    };

    const handleSelectLens = (lens: Lens) => {
        setSelectedLensId(lens.id);
        setStep('GROUNDING');
        setVisibleGroundingIndex(0);
        setIsComplete(false);
    };

    const handleNext = () => {
        if (step === 'GROUNDING') {
            if (visibleGroundingIndex < groundingLines.length - 1) {
                // Advance to next line
                setVisibleGroundingIndex(prev => prev + 1);
            } else {
                // Done with all lines
                setStep('ORIENTATION');
            }
        } else if (step === 'ORIENTATION') {
            setStep('PROMPT');
        } else if (step === 'PROMPT') {
            setStep('CLOSURE');
        }
    };

    const handleBack = () => {
        // Clear session on explicit exit from selection
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
        onBack();
    };

    const handleChangeLens = () => {
        setStep('SELECTION');
        setSelectedLensId(null);
        // We keep session active but reset lens
    };

    const handleToggleLanguage = () => {
        const newLang = language === 'english' ? 'hindi' : 'english';
        if (onLanguageChange) {
            onLanguageChange(newLang);
        } else {
            setInternalLanguage(newLang);
            localStorage.setItem('userLanguage', newLang);
        }
    };

    const handleComplete = () => {
        setIsComplete(true);
        // Wait for animation then exit
        setTimeout(() => {
            sessionStorage.removeItem(STORAGE_KEY_SESSION);
            setStep('SELECTION');
            setSelectedLensId(null);
            setIsComplete(false);
        }, 2000);
    };

    const handleOpenLibrary = () => {
        setShowVerse(false);
        if (onNavigate) {
            onNavigate(View.LIBRARY, { verseId: selectedLens?.verseId });
        }
    };

    // --- Render Helpers ---

    const getStepNumber = () => {
        switch (step) {
            case 'GROUNDING': return 1;
            case 'ORIENTATION': return 2;
            case 'PROMPT': return 3;
            case 'CLOSURE': return 4;
            default: return 0;
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col relative max-w-2xl mx-auto w-full font-serif" role="region" aria-label="Lens Practice">

            {/* Header */}
            <div className="flex items-center justify-between p-6 z-20 absolute top-0 left-0 right-0">
                <div className="flex items-center space-x-2">
                    {step === 'SELECTION' ? (
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-full hover:bg-stone-warm/50 text-stone-600 transition-colors"
                            aria-label="Back to Dashboard"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                        <button
                            onClick={handleChangeLens}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-full hover:bg-stone-warm/50 text-stone-500 hover:text-stone-800 transition-colors text-xs font-medium uppercase tracking-wider"
                            aria-label="Change Lens"
                        >
                            <ChevronLeft size={14} />
                            <span>{language === 'english' ? 'Change' : 'बदलें'}</span>
                        </button>
                    )}
                </div>

                {/* Step Indicators */}
                {step !== 'SELECTION' && (
                    <div className="flex space-x-2" aria-label={`Step ${getStepNumber()} of 4`}>
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i <= getStepNumber() ? 'bg-stone-800' : 'bg-stone-300'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    {step === 'SELECTION' && (
                        <button
                            onClick={handleToggleLanguage}
                            className="flex items-center space-x-1 px-2 py-1 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                            aria-label={`Switch to ${language === 'english' ? 'Hindi' : 'English'}`}
                        >
                            <Globe size={14} className="text-stone-500" />
                            <span className="text-xs font-medium text-stone-600 uppercase">
                                {language === 'english' ? 'EN' : 'HI'}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowIntroOverlay(true)}
                        className="p-2 rounded-full hover:bg-stone-warm/50 text-stone-400 hover:text-stone-600 transition-colors"
                        aria-label="About Lens Practice"
                    >
                        <HelpCircle size={20} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow flex flex-col pt-20">
                <AnimatePresence mode="wait">

                    {/* SELECTION */}
                    {step === 'SELECTION' && (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="px-6 pb-6 space-y-6"
                        >
                            <div className="space-y-2 mb-8 text-center pt-8">
                                <h2 className="text-3xl font-serif text-charcoal">
                                    {language === 'english' ? 'Shift your view' : 'अपनी दृष्टि बदलें'}
                                </h2>
                                <p className="text-stone-500 text-sm max-w-sm mx-auto">
                                    {language === 'english'
                                        ? 'Choose a lens to briefly reframe your current situation.'
                                        : 'अपनी वर्तमान स्थिति को नई नजर से देखने के लिए एक दृष्टिकोण चुनें।'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {LENSES.map((lens, index) => (
                                    <motion.button
                                        key={lens.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleSelectLens(lens)}
                                        className="w-full text-left bg-white/60 hover:bg-white/90 border border-stone-warm/50 rounded-2xl p-6 transition-all hover:shadow-md group relative overflow-hidden"
                                    >
                                        <div className="flex items-baseline justify-between relative z-10">
                                            <span className="font-medium text-lg text-charcoal group-hover:text-primary transition-colors">
                                                {language === 'hindi' && lens.labelHindi ? lens.labelHindi : lens.label}
                                            </span>
                                            {lens.sanskritTerm && (
                                                <span className="text-xs uppercase tracking-wider text-stone-400 font-medium ml-4">
                                                    {lens.sanskritTerm}
                                                </span>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* GROUNDING */}
                    {step === 'GROUNDING' && selectedLens && (
                        <motion.div
                            key="grounding"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-grow flex flex-col items-center justify-center px-8 text-center pb-20 cursor-pointer min-h-[60vh] select-none"
                            onClick={handleNext}
                        >
                            <div className="max-w-md w-full relative min-h-[120px] flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={visibleGroundingIndex}
                                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="text-xl md:text-2xl font-serif text-charcoal-dark leading-relaxed"
                                    >
                                        {groundingLines[visibleGroundingIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>

                            <motion.div
                                animate={{ opacity: breathPhase === 'done' ? 1 : 0 }}
                                transition={{ duration: 1 }}
                                className="absolute bottom-16 left-0 right-0 flex justify-center"
                            >
                                <p className="text-xs uppercase tracking-widest text-stone-400 font-medium">
                                    {language === 'english' ? 'Tap to continue' : 'जारी रखने के लिए टैप करें'}
                                </p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ORIENTATION */}
                    {step === 'ORIENTATION' && selectedLens && (
                        <motion.div
                            key="orientation"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-grow flex flex-col justify-center items-center px-6 text-center cursor-pointer min-h-[60vh]"
                            onClick={handleNext}
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="text-3xl md:text-4xl font-serif text-charcoal font-semibold leading-tight max-w-2xl"
                            >
                                {language === 'hindi' && selectedLens.orientationLineHindi
                                    ? selectedLens.orientationLineHindi
                                    : selectedLens.orientationLine}
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 2, duration: 1 }}
                                className="absolute bottom-12 text-xs uppercase tracking-widest text-stone-500"
                            >
                                {language === 'english' ? 'Tap to continue' : 'जारी रखने के लिए टैप करें'}
                            </motion.p>
                        </motion.div>
                    )}

                    {/* PROMPT */}
                    {step === 'PROMPT' && selectedLens && (
                        <motion.div
                            key="prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-grow flex flex-col justify-center items-center px-6 text-center cursor-pointer min-h-[60vh] space-y-12"
                            onClick={handleNext}
                        >
                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.2 }}
                                className="text-xl md:text-2xl font-serif text-charcoal leading-relaxed max-w-xl mx-auto"
                            >
                                {language === 'hindi' && selectedLens.attentionPromptHindi
                                    ? selectedLens.attentionPromptHindi
                                    : selectedLens.attentionPrompt}
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 3, duration: 1 }}
                                className="text-xs uppercase tracking-widest text-stone-500"
                            >
                                {language === 'english' ? 'Tap to continue' : 'जारी रखने के लिए टैप करें'}
                            </motion.p>
                        </motion.div>
                    )}

                    {/* CLOSURE */}
                    {step === 'CLOSURE' && selectedLens && (
                        <motion.div
                            key="closure"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-grow flex flex-col justify-center items-center px-6 text-center space-y-12 min-h-[60vh]"
                        >
                            {!isComplete ? (
                                <>
                                    <motion.p
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1.5 }}
                                        className="text-xl md:text-2xl font-serif text-charcoal-light leading-relaxed max-w-xl italic"
                                    >
                                        {language === 'hindi' && selectedLens.closureLineHindi
                                            ? selectedLens.closureLineHindi
                                            : selectedLens.closureLine}
                                    </motion.p>

                                    {/* Embedded Verse Card */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1, duration: 1 }}
                                        className="bg-white/60 border border-stone-warm/50 rounded-2xl p-6 max-w-lg w-full text-center space-y-4 shadow-sm"
                                    >
                                        <div className="flex justify-center items-center space-x-2">
                                            <span className="text-[10px] font-bold text-saffron-deep uppercase tracking-widest">
                                                {currentVerse?.reference}
                                            </span>
                                            {isHindiFallback && (
                                                <span className="text-[9px] text-stone-400 uppercase tracking-widest">
                                                    (English translation)
                                                </span>
                                            )}
                                        </div>

                                        <p className="font-serif text-lg text-charcoal leading-relaxed italic">
                                            "{verseText}"
                                        </p>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenLibrary();
                                            }}
                                            className="inline-flex items-center space-x-1.5 text-stone-400 hover:text-saffron-deep transition-colors text-[10px] font-medium uppercase tracking-wider pt-2"
                                        >
                                            <ExternalLink size={12} />
                                            <span>{language === 'english' ? 'View in Library' : 'लाइब्रेरी में देखें'}</span>
                                        </button>
                                    </motion.div>

                                    <div className="flex flex-col space-y-4 items-center">
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 2.5, duration: 0.5 }}
                                            onClick={handleComplete}
                                            className="px-8 py-3 bg-stone-800 text-stone-100 rounded-full hover:bg-stone-700 transition-colors shadow-lg font-medium tracking-wide flex items-center space-x-2 mt-4"
                                        >
                                            <span>{language === 'english' ? 'Complete Practice' : 'अभ्यास पूरा करें'}</span>
                                        </motion.button>
                                    </div>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center space-y-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Check size={32} />
                                    </div>
                                    <h3 className="text-xl font-medium text-charcoal">
                                        {language === 'english' ? 'Practice Complete' : 'अभ्यास पूर्ण हुआ'}
                                    </h3>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Intro Overlay */}
            <AnimatePresence>
                {showIntroOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
                        onClick={step === 'INTRO' ? undefined : () => setShowIntroOverlay(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#F2EFE9] w-full max-w-sm rounded-3xl p-8 shadow-2xl relative text-center space-y-6"
                            onClick={e => e.stopPropagation()}
                        >
                            {!step.includes('INTRO') && (
                                <button
                                    onClick={() => setShowIntroOverlay(false)}
                                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
                                >
                                    <X size={20} />
                                </button>
                            )}

                            <div className="w-12 h-12 bg-saffron-light/20 rounded-full flex items-center justify-center text-saffron-deep mx-auto">
                                <Globe size={24} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-serif text-charcoal font-medium">Lens Practice</h3>
                                <p className="text-stone-600 leading-relaxed text-sm">
                                    Lenses are ways of seeing drawn from the Bhagavad Gita. Each offers a 2-minute guided reflection to shift your perspective on what you're experiencing right now.
                                </p>
                            </div>

                            <button
                                onClick={handleBegin}
                                className="w-full py-3 bg-stone-800 text-stone-100 rounded-xl hover:bg-stone-700 transition-colors font-medium"
                            >
                                {step === 'INTRO' ? 'Begin' : 'Close'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Verse Modal */}
            <AnimatePresence>
                {showVerse && currentVerse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
                        onClick={() => setShowVerse(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#F2EFE9] w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowVerse(false)}
                                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600"
                            >
                                <X size={20} />
                            </button>

                            <div className="space-y-6 text-center">
                                <span className="text-xs font-bold text-saffron-deep uppercase tracking-widest">
                                    {currentVerse.reference}
                                </span>

                                <div className="space-y-1">
                                    <p className="font-serif text-xl md:text-2xl text-charcoal leading-relaxed italic">
                                        "{verseText}"
                                    </p>
                                    {isHindiFallback && (
                                        <p className="text-xs text-stone-400 uppercase tracking-widest">
                                            (English translation)
                                        </p>
                                    )}
                                </div>

                                {currentVerse.reflection && (
                                    <div className="pt-4 border-t border-stone-warm/50">
                                        <p className="text-stone-600 text-sm leading-relaxed">
                                            {currentVerse.reflection}
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenLibrary();
                                    }}
                                    className="mt-6 flex items-center justify-center space-x-2 text-stone-500 hover:text-saffron-deep transition-colors text-xs font-medium uppercase tracking-wider mx-auto"
                                >
                                    <ExternalLink size={14} />
                                    <span>{language === 'english' ? 'Open Library' : 'लाइब्रेरी खोलें'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LensPractice;
