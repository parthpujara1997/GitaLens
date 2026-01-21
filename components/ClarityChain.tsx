import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { View } from '../types';

interface ClarityChainProps {
    onBack: () => void;
    onNavigate?: (view: View) => void;
}

type Step = 'SITUATION' | 'MEANING' | 'IMPACT' | 'REVEAL';

const ClarityChain: React.FC<ClarityChainProps> = ({ onBack }) => {
    const [step, setStep] = useState<Step>('SITUATION');
    const [inputs, setInputs] = useState({
        situation: '',
        meaning: '',
        impact: ''
    });
    const [activeBlock, setActiveBlock] = useState<'situation' | 'meaning' | 'impact' | null>(null);
    const [isBroken, setIsBroken] = useState(false);

    // Motion values for the draggable tile
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Spring physics for smoother connector movement
    const springConfig = { damping: 25, stiffness: 200 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleNext = () => {
        if (step === 'SITUATION') setStep('MEANING');
        else if (step === 'MEANING') setStep('IMPACT');
        else if (step === 'IMPACT') setStep('REVEAL');
    };

    const getStepTitle = () => {
        switch (step) {
            case 'SITUATION': return 'What happened?';
            case 'MEANING': return 'What was the takeaway?';
            case 'IMPACT': return 'How did this affect you?';
            default: return 'The Chain';
        }
    };

    const getHelperText = () => {
        switch (step) {
            case 'SITUATION': return 'Just describe the situation itself.';
            case 'MEANING': return 'This is the interpretation or story you added to the facts.';
            case 'IMPACT': return 'Emotionally or in what you did next.';
            default: return '';
        }
    };

    const getExamples = () => {
        switch (step) {
            case 'SITUATION': return ['“My manager criticized my presentation”', '“My partner didn’t reply all day”', '“I missed a deadline”'];
            case 'MEANING': return ['“The takeaway was that I wasn’t good enough”', '“I interpreted it as a lack of respect”', '“My story was that things are failing”'];
            case 'IMPACT': return ['“I felt anxious and avoided speaking”', '“I became angry and shut down”', '“I couldn’t focus afterward”'];
            default: return [];
        }
    };

    const handleDragEnd = (_: any, info: any) => {
        const distance = Math.hypot(info.offset.x, info.offset.y);
        // Break threshold
        if (distance > 100) {
            setIsBroken(true);
        }
    };

    const renderInputScreen = (currentInput: string, field: keyof typeof inputs) => (
        <motion.div
            key={field}
            initial={{ opacity: 0, y: 30 }} // Slower, deeper entrance
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            transition={{ duration: 1.2, ease: "easeOut" }} // SLOW entrance for inputs
            className="flex-grow flex flex-col px-6 pb-6 space-y-6 pt-8"
        >
            <div className="space-y-2 text-center">
                {/* Morphing Title with layoutId */}
                <motion.h2
                    layoutId="clarity-chain-title"
                    className="text-2xl md:text-3xl font-serif text-charcoal"
                >
                    {getStepTitle()}
                </motion.h2>
                <p className="text-stone-500 text-sm max-w-sm mx-auto">{getHelperText()}</p>
            </div>

            <div className="w-full max-w-lg mx-auto space-y-6">
                <textarea
                    value={inputs[field]}
                    onChange={(e) => setInputs(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder="Type here..."
                    className="w-full min-h-[160px] p-6 bg-white/40 border border-stone-warm rounded-2xl text-stone-700 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white/60 transition-all resize-none text-lg leading-relaxed shadow-sm"
                    autoFocus
                />

                <div className="bg-stone-100/50 rounded-xl p-4 border border-stone-warm/30">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-3">Examples</p>
                    <ul className="space-y-2">
                        {getExamples().map((ex, i) => (
                            <li key={i} className="text-xs text-stone-600 italic pl-2 border-l-2 border-stone-300">{ex}</li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleNext}
                    disabled={!inputs[field].trim()}
                    className={`w-full py-4 rounded-full font-medium transition-all ${inputs[field].trim()
                        ? 'bg-charcoal text-[#F2EFE9] shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                >
                    Continue
                </button>
            </div>
        </motion.div>
    );

    // Connector Component
    const Connector = ({ isTop, height = 64 }: { isTop: boolean, height?: number }) => {

        // Use PIXEL coordinates relative to the center origin (0, 0)
        // Since we center the SVG in the parent, (0,0) is top-center or similar.
        // Actually, let's use a simpler path: M 0 0 L x y
        const path = useTransform([springX, springY], ([latestX, latestY]) => {
            if (isTop) {
                // From Top (0, 0) to Bottom (latestX, height + latestY)
                return `M 0 0 L ${latestX} ${height + (latestY as number)}`;
            } else {
                // From Top (latestX, latestY) to Bottom (0, height)
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

        return (
            // Centered container logic:
            // The div is w-full, but we put the SVG absolutely centered.
            <div className={`relative w-full z-0 pointer-events-none`} style={{ height }}>
                <AnimatePresence>
                    {!isBroken && (
                        <motion.svg
                            key="connector-line"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            transition={{ duration: 1.5, delay: isTop ? 1.5 : 3.5 }} // Very slow appearance
                            // Absolute positioning centered: left-1/2, overflow visible
                            className="absolute left-1/2 top-0 overflow-visible"
                            style={{ width: "2px", height: "100%" }} // Minimal width, rely on overflow
                        >
                            <motion.path
                                d={path}
                                stroke="#1a1a1a"
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isBroken ? 0 : 1 }}
                    transition={{ delay: isTop ? 1.8 : 3.8, duration: 1.2 }}
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                     bg-[#F2EFE9] px-3 py-1 text-[10px] uppercase tracking-widest font-bold z-10 
                     ${activeBlock === 'meaning' ? 'text-black' : 'text-stone-400'}
                    `}
                >
                    {isTop ? 'Interpreted As' : 'Which Led To'}
                </motion.div>
            </div>
        );
    }


    return (
        <div className="min-h-[80vh] flex flex-col relative max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 z-10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-stone-warm/50 text-stone-600 transition-colors"
                >
                    {step === 'SITUATION' ? <ArrowLeft size={24} /> : <X size={24} />}
                </button>
                <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">Clarity Chain</span>
                <div className="w-10" />
            </div>

            <AnimatePresence mode="wait">
                {step === 'SITUATION' && renderInputScreen(inputs.situation, 'situation')}
                {step === 'MEANING' && renderInputScreen(inputs.meaning, 'meaning')}
                {step === 'IMPACT' && renderInputScreen(inputs.impact, 'impact')}

                {step === 'REVEAL' && (
                    <motion.div
                        key="reveal"
                        className="flex-grow flex flex-col items-center px-6 pb-12 pt-4"
                    >
                        <div className="w-full max-w-md space-y-0 relative flex flex-col items-center">

                            {/* Block 1: Situation */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.5, ease: "easeOut" }} // SLOW entrance
                                onClick={() => !isBroken && setActiveBlock('situation')}
                                className={`relative z-10 p-6 rounded-2xl border transition-all cursor-pointer w-full ${activeBlock === 'situation'
                                    ? 'bg-white border-black shadow-md scale-[1.02]'
                                    : 'bg-white/60 border-stone-warm/50 hover:bg-white/80'
                                    }`}
                            >
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2">The Situation</span>
                                <p className="text-black text-lg">{inputs.situation}</p>

                                <AnimatePresence>
                                    {activeBlock === 'situation' && !isBroken && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
                                                This is what happened, before meaning was added.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Connector 1 */}
                            <Connector isTop={true} height={80} />

                            {/* Block 2: Meaning (Draggable) */}
                            <AnimatePresence>
                                {!isBroken && (
                                    <motion.div
                                        key="meaning"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        // Keep exit fast (0.2s) as requested ("nailed it")
                                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                        transition={{
                                            delay: 2.0, // SLOW delay
                                            duration: 1.5, // SLOW entrance
                                            ease: "easeOut"
                                        }}
                                        style={{ x, y, zIndex: 50 }}
                                        drag
                                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                        dragElastic={0.2}
                                        onDragEnd={handleDragEnd}
                                        whileTap={{ cursor: "grabbing" }}
                                        onClick={() => setActiveBlock('meaning')}
                                        className={`relative p-6 rounded-2xl border-[1.5px] transition-all cursor-grab w-full bg-black border-black shadow-xl scale-[1.03]`}
                                    >
                                        <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold block mb-2">What It Came to Mean</span>
                                        <p className="text-white text-xl font-medium serif italic">"{inputs.meaning}"</p>
                                        <p className="text-[10px] text-gray-400 mt-4 text-center select-none opacity-80">
                                            Drag away to break the chain
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {isBroken && (
                                <div className="w-full opacity-0 pointer-events-none" aria-hidden="true">
                                    <div className="p-6 rounded-2xl border-[1.5px]">
                                        <span className="text-[10px] uppercase tracking-widest block mb-2">Spacer</span>
                                        <p className="text-xl font-medium serif italic">"{inputs.meaning}"</p>
                                        <p className="text-[10px] mt-4">Spacer</p>
                                    </div>
                                </div>
                            )}

                            {/* Connector 2 */}
                            <motion.div
                                className="w-full relative z-0"
                            >
                                <Connector isTop={false} height={80} />
                            </motion.div>

                            {/* Block 3: Impact / Reframed View */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 4.0, // SLOW delay
                                    duration: 1.5, // SLOW entrance
                                    ease: "easeOut"
                                }}
                                onClick={() => !isBroken && setActiveBlock('impact')}
                                className={`relative z-10 p-6 rounded-2xl border transition-all cursor-pointer w-full 
                                    ${!isBroken
                                        ? (activeBlock === 'impact' ? 'bg-white border-black shadow-md scale-[1.02]' : 'bg-white/60 border-stone-warm/50 hover:bg-white/80')
                                        : 'bg-white/60 border-stone-warm/50'
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {!isBroken ? (
                                        <motion.div
                                            key="impact_content"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full"
                                        >
                                            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2">What Followed</span>
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
                                            <p className="text-stone-600 text-sm italic leading-relaxed">
                                                "Without this meaning, the chain is broken. How else could you see this?"
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Reconnect Action - Outside the tile */}
                            <AnimatePresence>
                                {isBroken && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="mt-6"
                                    >
                                        <button
                                            onClick={() => {
                                                setIsBroken(false);
                                                x.set(0);
                                                y.set(0);
                                            }}
                                            className="px-6 py-2 bg-charcoal hover:bg-black text-[10px] font-bold uppercase tracking-widest text-white rounded-full transition-colors shadow-lg"
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
                            transition={{ delay: 5.5, duration: 1.5 }}
                            className="text-stone-500 text-sm text-center mt-12 max-w-xs leading-relaxed italic"
                        >
                            {!isBroken ? (
                                <>
                                    Situations don’t directly create pressure.<br />
                                    The meaning added in between shapes what follows.
                                </>
                            ) : (
                                "When the interpretation is removed, the inevitable outcome disappears."
                            )}
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 6.0 }}
                            onClick={onBack}
                            className="mt-8 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-charcoal transition-colors"
                        >
                            Close Practice
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClarityChain;
