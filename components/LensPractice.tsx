import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, BookOpen, ExternalLink } from 'lucide-react';
import { LENSES } from '../src/data/lenses';
import { Lens, View } from '../types';
import { GITA_VERSES } from '../gitaData';

interface LensPracticeProps {
    onBack: () => void;
    onNavigate?: (view: View) => void;
}

type Step = 'SELECTION' | 'GROUNDING' | 'ORIENTATION' | 'PROMPT' | 'CLOSURE';

const LensPractice: React.FC<LensPracticeProps> = ({ onBack, onNavigate }) => {
    const [step, setStep] = useState<Step>('SELECTION');
    const [selectedLens, setSelectedLens] = useState<Lens | null>(null);
    const [showVerse, setShowVerse] = useState(false);
    const [reflection, setReflection] = useState('');

    // Grounding specific state
    const [groundingLines, setGroundingLines] = useState<string[]>([]);
    const [visibleGroundingIndex, setVisibleGroundingIndex] = useState(0);

    useEffect(() => {
        if (step === 'GROUNDING' && selectedLens) {
            setGroundingLines(selectedLens.groundingText.split('\n\n'));
            setVisibleGroundingIndex(0);
        }
    }, [step, selectedLens]);

    const handleSelectLens = (lens: Lens) => {
        setSelectedLens(lens);
        setStep('GROUNDING');
    };

    const handleTap = () => {
        if (step === 'GROUNDING') {
            if (visibleGroundingIndex < groundingLines.length - 1) {
                // Show next line
                setVisibleGroundingIndex(prev => prev + 1);
            } else {
                // All lines visible, proceed to next step
                setStep('ORIENTATION');
            }
        } else if (step === 'ORIENTATION') {
            setStep('PROMPT');
        } else if (step === 'PROMPT') {
            setStep('CLOSURE');
        }
    };

    const handleOpenLibrary = () => {
        // Force state updates to be sequential to ensure app state catches the navigation
        setShowVerse(false);
        setTimeout(() => {
            if (onNavigate) {
                // Pass verseId to open specifically
                onNavigate(View.LIBRARY, { verseId: selectedLens?.verseId });
            } else {
                console.error("onNavigate prop is missing in LensPractice");
            }
        }, 50);
    };

    const currentVerse = selectedLens ? GITA_VERSES.find(v => v.id === selectedLens.verseId) : null;

    return (
        <div className="min-h-[80vh] flex flex-col relative max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 z-10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-stone-warm/50 text-stone-600 transition-colors"
                >
                    {step === 'SELECTION' ? <ArrowLeft size={24} /> : <X size={24} />}
                </button>
                <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">
                    {step === 'SELECTION' ? 'Lens Practice' : selectedLens?.label}
                </span>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <AnimatePresence mode="wait">
                {/* Screen 1: Selection */}
                {step === 'SELECTION' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-grow flex flex-col px-6 pb-6 space-y-6"
                    >
                        <div className="space-y-2 mb-8 text-center pt-8">
                            <h2 className="text-3xl font-serif text-charcoal">Shift your view</h2>
                            <p className="text-stone-500 text-sm max-w-sm mx-auto">
                                Choose a lens to briefly reframe your current situation.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {LENSES.map((lens, index) => (
                                <motion.button
                                    key={lens.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleSelectLens(lens)}
                                    className="w-full text-left bg-white/60 hover:bg-white/90 border border-stone-warm/50 rounded-2xl p-6 transition-all hover:shadow-md group"
                                >
                                    <div className="flex items-baseline justify-between">
                                        <span className="font-medium text-lg text-charcoal group-hover:text-primary transition-colors">
                                            {lens.label}
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

                {/* Screen 2: Grounding (Interactive Line-by-Line) */}
                {step === 'GROUNDING' && selectedLens && (
                    <motion.div
                        key="grounding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col items-center justify-center px-8 text-center cursor-pointer min-h-[50vh]"
                        onClick={handleTap}
                    >
                        <div className="space-y-8 max-w-md mb-12 w-full">
                            {groundingLines.map((paragraph, i) => (
                                <AnimatePresence key={i}>
                                    {i <= visibleGroundingIndex && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
                                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="text-xl md:text-2xl font-serif text-charcoal-dark leading-relaxed"
                                        >
                                            {paragraph}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            ))}
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: visibleGroundingIndex < groundingLines.length - 1 ? 0.4 : 0.6 }}
                            key={visibleGroundingIndex} // Re-animate on chaange
                            transition={{ duration: 1 }}
                            className="absolute bottom-12 text-xs uppercase tracking-widest text-stone-500"
                        >
                            {visibleGroundingIndex < groundingLines.length - 1 ? "Tap for next step" : "Tap to continue"}
                        </motion.p>
                    </motion.div>
                )}

                {/* Screen 3: Orientation */}
                {step === 'ORIENTATION' && selectedLens && (
                    <motion.div
                        key="orientation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col justify-center items-center px-6 text-center cursor-pointer"
                        onClick={handleTap}
                    >
                        <motion.h3
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 2 }}
                            className="text-2xl md:text-3xl font-serif text-charcoal font-medium leading-tight max-w-2xl"
                        >
                            {selectedLens.orientationLine}
                        </motion.h3>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 3, duration: 1.5 }}
                            className="absolute bottom-12 text-xs uppercase tracking-widest text-stone-500"
                        >
                            Tap to continue
                        </motion.p>
                    </motion.div>
                )}

                {/* Screen 4: Attention Prompt (Optional Input) */}
                {step === 'PROMPT' && selectedLens && (
                    <motion.div
                        key="prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col justify-center px-6 pb-12 space-y-8 cursor-pointer"
                        onClick={handleTap}
                    >
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 2 }}
                            className="text-xl md:text-2xl font-serif text-charcoal text-center leading-relaxed max-w-xl mx-auto"
                        >
                            {selectedLens.attentionPrompt}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 1.5 }}
                            className="space-y-3 max-w-lg mx-auto w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <textarea
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                placeholder="You can write, or simply reflect."
                                className="w-full min-h-[120px] p-4 bg-white/40 border border-stone-warm rounded-2xl text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white/60 transition-all resize-none text-sm leading-relaxed"
                            />
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 2.5, duration: 1.5 }}
                            className="text-xs uppercase tracking-widest text-stone-500 text-center"
                        >
                            Tap background to continue
                        </motion.p>
                    </motion.div>
                )}

                {/* Screen 5: Closure + Verse Access */}
                {step === 'CLOSURE' && selectedLens && (
                    <motion.div
                        key="closure"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col justify-center items-center px-6 text-center space-y-12"
                    >
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 2 }}
                            className="text-xl md:text-2xl font-serif text-charcoal leading-relaxed max-w-xl italic"
                        >
                            {selectedLens.closureLine}
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1.5 }}
                            onClick={() => setShowVerse(true)}
                            className="flex items-center space-x-2 text-stone-500 hover:text-saffron-deep transition-colors text-sm font-medium uppercase tracking-wider"
                        >
                            <BookOpen size={16} />
                            <span>Read a related verse</span>
                        </motion.button>
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

                                <p className="font-serif text-xl md:text-2xl text-charcoal leading-relaxed italic">
                                    "{currentVerse.text}"
                                </p>

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
                                    <span>Open Library</span>
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
