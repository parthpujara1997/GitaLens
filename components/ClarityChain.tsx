import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, ArrowDown } from 'lucide-react';
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

    const handleNext = () => {
        if (step === 'SITUATION') setStep('MEANING');
        else if (step === 'MEANING') setStep('IMPACT');
        else if (step === 'IMPACT') setStep('REVEAL');
    };

    const getStepTitle = () => {
        switch (step) {
            case 'SITUATION': return 'What happened?';
            case 'MEANING': return 'What did this feel like to you?';
            case 'IMPACT': return 'How did this affect you?';
            default: return 'The Chain';
        }
    };

    const getHelperText = () => {
        switch (step) {
            case 'SITUATION': return 'Just describe the situation itself.';
            case 'MEANING': return 'This is about what the situation came to mean for you.';
            case 'IMPACT': return 'Emotionally or in what you did next.';
            default: return '';
        }
    };

    const getExamples = () => {
        switch (step) {
            case 'SITUATION': return ['“My manager criticized my presentation”', '“My partner didn’t reply all day”', '“I missed a deadline”'];
            case 'MEANING': return ['“It felt like I wasn’t good enough”', '“It felt disrespectful”', '“It felt like things were going downhill”'];
            case 'IMPACT': return ['“I felt anxious and avoided speaking”', '“I became angry and shut down”', '“I couldn’t focus afterward”'];
            default: return [];
        }
    };

    const renderInputScreen = (currentInput: string, field: keyof typeof inputs) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-grow flex flex-col px-6 pb-6 space-y-6 pt-8"
        >
            <div className="space-y-2 text-center">
                <h2 className="text-2xl md:text-3xl font-serif text-charcoal">{getStepTitle()}</h2>
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
                        <div className="w-full max-w-md space-y-0 relative">

                            {/* Block 1: Situation */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                onClick={() => setActiveBlock('situation')}
                                className={`relative z-10 p-6 rounded-2xl border transition-all cursor-pointer ${activeBlock === 'situation'
                                        ? 'bg-white border-charcoal shadow-md scale-[1.02]'
                                        : 'bg-white/60 border-stone-warm/50 hover:bg-white/80'
                                    }`}
                            >
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2">The Situation</span>
                                <p className="text-charcoal text-lg">{inputs.situation}</p>

                                <AnimatePresence>
                                    {activeBlock === 'situation' && (
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
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8, duration: 0.8 }}
                                className="h-16 flex items-center justify-center relative -my-1 z-0"
                            >
                                <div className={`w-0.5 h-full transition-colors ${activeBlock === 'meaning' ? 'bg-charcoal' : 'bg-stone-300'}`} />
                                <div className={`absolute bg-[#F2EFE9] px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${activeBlock === 'meaning' ? 'text-charcoal' : 'text-stone-400'}`}>
                                    Interpreted As
                                </div>
                            </motion.div>

                            {/* Block 2: Meaning */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.6, duration: 0.8 }}
                                onClick={() => setActiveBlock('meaning')}
                                className={`relative z-10 p-6 rounded-2xl border-[1.5px] transition-all cursor-pointer ${activeBlock === 'meaning'
                                        ? 'bg-white border-charcoal shadow-lg scale-[1.03]'
                                        : 'bg-white border-stone-warm hover:shadow-md'
                                    }`}
                            >
                                <span className="text-[10px] uppercase tracking-widest text-saffron-deep font-bold block mb-2">What It Came to Mean</span>
                                <p className="text-charcoal text-xl font-medium serif italic">"{inputs.meaning}"</p>

                                <AnimatePresence>
                                    {activeBlock === 'meaning' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100 italic">
                                                This is where meaning shaped what followed. Different meanings here can change the outcome.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Connector 2 */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.4, duration: 0.8 }}
                                className="h-16 flex items-center justify-center relative -my-1 z-0"
                            >
                                <div className={`w-0.5 h-full transition-colors ${activeBlock === 'meaning' ? 'bg-charcoal' : 'bg-stone-300'}`} />
                                <div className={`absolute bg-[#F2EFE9] px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${activeBlock === 'meaning' ? 'text-charcoal' : 'text-stone-400'}`}>
                                    Which Led To
                                </div>
                            </motion.div>

                            {/* Block 3: Impact */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 3.2, duration: 0.8 }}
                                onClick={() => setActiveBlock('impact')}
                                className={`relative z-10 p-6 rounded-2xl border transition-all cursor-pointer ${activeBlock === 'impact'
                                        ? 'bg-white border-charcoal shadow-md scale-[1.02]'
                                        : 'bg-white/60 border-stone-warm/50 hover:bg-white/80'
                                    }`}
                            >
                                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2">What Followed</span>
                                <p className="text-charcoal text-lg">{inputs.impact}</p>

                                <AnimatePresence>
                                    {activeBlock === 'impact' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
                                                This shows how the meaning influenced your response.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 4.5, duration: 1 }}
                            className="text-stone-500 text-sm text-center mt-12 max-w-xs leading-relaxed italic"
                        >
                            Situations don’t directly create pressure.<br />
                            The meaning added in between shapes what follows.
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 5 }}
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
