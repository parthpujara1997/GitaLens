import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreathworkPacerProps {
  onComplete: () => void;
  onSkip: () => void;
}

const BreathworkPacer: React.FC<BreathworkPacerProps> = ({ onComplete, onSkip }) => {
  const [phase, setPhase] = useState<'breathe in' | 'hold' | 'breathe out' | 'hold empty'>('breathe in');
  const [cycles, setCycles] = useState(0);
  const totalCycles = 3;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (cycles >= totalCycles) {
      onComplete();
      return;
    }

    switch (phase) {
      case 'breathe in':
        timer = setTimeout(() => setPhase('hold'), 4000);
        break;
      case 'hold':
        timer = setTimeout(() => setPhase('breathe out'), 4000);
        break;
      case 'breathe out':
        timer = setTimeout(() => setPhase('hold empty'), 4000);
        break;
      case 'hold empty':
        timer = setTimeout(() => {
          setPhase('breathe in');
          setCycles((c) => c + 1);
        }, 4000);
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, cycles, onComplete]);

  // Animation values based on phase
  const getScale = () => {
    if (phase === 'breathe in') return 1.5;
    if (phase === 'hold') return 1.5;
    if (phase === 'breathe out') return 1;
    if (phase === 'hold empty') return 1;
    return 1;
  };

  const getOpacity = () => {
    if (phase === 'breathe in') return 0.8;
    if (phase === 'hold') return 1;
    if (phase === 'breathe out') return 0.6;
    if (phase === 'hold empty') return 0.4;
    return 0.6;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-16">
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Expanding/Contracting Circle */}
        <motion.div
          animate={{
            scale: getScale(),
            opacity: getOpacity(),
          }}
          transition={{ duration: 4, ease: 'linear' }}
          className="absolute w-32 h-32 rounded-full border border-stone-300 bg-parchment-bubble/50 shadow-inner"
        />
        {/* Core static circle for grounding */}
        <div className="absolute w-12 h-12 rounded-full bg-saffron-deep/20 blur-sm" />
      </div>

      <div className="text-center space-y-4 h-24">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-serif text-charcoal tracking-wide capitalize"
          >
            {phase}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-stone-400 font-medium">
          Cycle {cycles + 1} of {totalCycles}
        </p>
      </div>

      <button
        onClick={onSkip}
        className="px-4 py-2 text-stone-400 hover:text-stone-600 transition-colors text-sm uppercase tracking-widest"
      >
        Skip Breathwork
      </button>
    </div>
  );
};

export default BreathworkPacer;
