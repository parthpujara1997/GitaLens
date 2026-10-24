import React from 'react';
import { motion } from 'framer-motion';
import { UserProgress } from '../types';
import Tooltip from './Tooltip';

interface SadhanaTrackerProps {
  progress: UserProgress;
}

const SadhanaTracker: React.FC<SadhanaTrackerProps> = ({ progress }) => {
  const totalDays = progress.reflection_days || 0;
  
  return (
    <Tooltip content="Reflects your active days of sadhana practice and mindful presence." width="w-64">
      <div className="flex flex-col items-center justify-center p-6 space-y-2 bg-white/40 backdrop-blur-md rounded-2xl border border-stone-200/50 shadow-sm max-w-xs w-full mx-auto">
        <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
          Daily Streak
        </span>
        <div className="text-3xl font-serif font-bold text-stone-800">
          {totalDays} <span className="text-base font-sans font-normal text-stone-500">{totalDays === 1 ? 'day' : 'days'}</span>
        </div>
        <p className="text-xs text-stone-500">
          {totalDays === 0 ? 'Begin your journey' : 'Keep up your daily reflection'}
        </p>
      </div>
    </Tooltip>
  );
};

export default SadhanaTracker;
