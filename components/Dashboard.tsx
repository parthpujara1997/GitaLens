import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { View, UserProgress } from '../types';
import { storageService } from '../services/storageService';
import { getRandomFamousVerse } from '../gitaData';
import { Share2, Copy, Check, Loader2, Heart, Scroll } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

import InnerCompass from './InnerCompass';
import ShareModal from './ShareModal';
// @ts-ignore
import reflectionsData from '../src/data/ai_reflections.json';

interface DashboardProps {
  onNavigate: (view: View) => void;
  onProgressUpdate: (progress: UserProgress) => void;
  onAuthRequired: (mode: 'login' | 'signup') => void;
  progress: UserProgress;
}
const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onProgressUpdate, onAuthRequired, progress }) => {
  const { user } = useAuth();
  const [showReflection, setShowReflection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const dailyVerse = useMemo(() => {
    return getRandomFamousVerse();
  }, []);

  useEffect(() => {
    if (user) {
      checkSupabaseBookmark();
    } else {
      setIsBookmarked(false);
    }
    checkDailyCheckIn();
  }, [dailyVerse.reference, user]);

  const checkDailyCheckIn = () => {
    const checkIns = storageService.getInnerCheckIns();
    const today = new Date().toISOString().split('T')[0];
    const todaysCheckIn = checkIns.find(c => c.date.split('T')[0] === today);
    setHasCheckedIn(!!todaysCheckIn);
  };

  const checkSupabaseBookmark = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user?.id)
        .eq('verse_id', dailyVerse.reference)
        .single();

      setIsBookmarked(!!data);
    } catch (err) {
      console.error('Error checking bookmark:', err);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (user) {
      if (isBookmarked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('verse_id', dailyVerse.reference);
        if (!error) setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            verse_id: dailyVerse.reference,
            content: dailyVerse.text
          });
        if (!error) setIsBookmarked(true);
      }
    } else {
      onAuthRequired('login');
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `"${dailyVerse.text}"\n\n${dailyVerse.reflection} \n\n - ${dailyVerse.reference} `;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  return (
    <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-700 w-full max-w-xl mx-auto pb-10">
      <div className="text-center pt-2 pb-1">
        <img
          src="/logo.png"
          alt="GitaLens"
          className="h-48 w-auto mx-auto object-contain select-none mix-blend-multiply"
        />
      </div>

      {!hasCheckedIn && (
        <div className="w-full">
          <InnerCompass onComplete={() => setHasCheckedIn(true)} />
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate(View.GUIDANCE)}
        className="group relative w-full flex flex-col items-center justify-center p-10 bg-indigo text-[#F2EFE9] rounded-3xl shadow-lg hover:shadow-xl transition-all text-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-2xl font-medium serif mb-2 relative z-10">What’s troubling you right now?</span>
        <p className="text-[#F2EFE9]/70 text-sm font-light relative z-10">Act with clarity, guided by the Gita</p>
      </motion.button>

      <section className="w-full space-y-3 px-4">
        <div className="flex justify-between items-end">
          <p className="text-[#6B6B63] text-xs uppercase tracking-widest font-semibold">Reflection Rhythm</p>
          <p className="text-charcoal font-medium text-sm">{progress.reflection_days} days</p>
        </div>
        <div className="w-full bg-stone-warm h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-olive h-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min((progress.reflection_days % 30) / 30 * 100, 100)}% ` }}
          />
        </div>
      </section>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasCheckedIn && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(View.INNER_COMPASS)}
            className="glass-card w-full flex flex-col items-center justify-center p-6 rounded-2xl text-center"
          >
            <span className="text-base font-medium text-charcoal">Inner Compass</span>
            <p className="text-stone-500/80 text-[10px] uppercase tracking-tighter mt-1">Daily Pattern</p>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(View.LENS_PRACTICE)}
          className="glass-card w-full flex flex-col items-center justify-center p-6 rounded-2xl text-center"
        >
          <span className="text-base font-medium text-charcoal">Lens Practice</span>
          <p className="text-stone-500/80 text-[10px] uppercase tracking-tighter mt-1">Shift perspective</p>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(View.LIBRARY)}
          className="glass-card w-full flex flex-col items-center justify-center p-6 rounded-2xl text-center"
        >
          <span className="text-base font-medium text-charcoal">Library</span>
          <p className="text-stone-500/80 text-[10px] uppercase tracking-tighter mt-1">Explore Gita</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(View.JOURNAL)}
          className="glass-card w-full flex flex-col items-center justify-center p-6 rounded-2xl text-center"
        >
          <span className="text-base font-medium text-clay-hover">Journal</span>
          <p className="text-stone-500/80 text-[10px] uppercase tracking-tighter mt-1">Record thoughts</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate(View.CLARITY_CHAIN)}
          className="glass-card w-full flex flex-col items-center justify-center p-6 rounded-2xl text-center"
        >
          <span className="text-base font-medium text-charcoal">Clarity Chain</span>
          <p className="text-stone-500/80 text-[10px] uppercase tracking-tighter mt-1">Untangle Stress</p>
        </motion.button>
      </div>

      <motion.section
        layout
        role="button"
        className="group relative w-full bg-sandalwood/40 border border-sandalwood-border/50 rounded-2xl p-6 transition-all hover:bg-sandalwood/60 cursor-pointer"
        onClick={() => setShowReflection(!showReflection)}
      >
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-saffron-accent uppercase tracking-[0.2em] text-[9px] font-bold">Daily Verse</span>
            <span className="text-saffron-deep text-[10px] font-medium tracking-wide uppercase opacity-60">{dailyVerse.reference}</span>
          </div>

          <p className="serif text-lg italic text-charcoal-dark leading-relaxed text-center px-2">
            "{dailyVerse.text}"
          </p>

          {showReflection && (
            <div className="bg-white/50 rounded-xl p-4 border-l-2 border-saffron-accent animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[#5A5246] text-sm leading-relaxed italic">
                {(reflectionsData as Record<string, string>)[`${dailyVerse.chapter}.${dailyVerse.verse}`] || dailyVerse.reflection || "Take a moment to reflect on these words deeply. Let them resonate within you."}
              </p>
            </div>
          )}

          <div
            className={`flex justify-end space-x-2 pt-2 transition-opacity duration-300 ${showReflection ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full bg-white/40 hover:bg-white/70 transition-colors focus:outline-none ${isBookmarked ? 'text-red-500' : 'text-stone-600'}`}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Verse"}
            >
              <Heart size={16} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-full bg-white/40 hover:bg-white/70 text-stone-600 transition-colors focus:outline-none"
              title="Copy Text"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/40 hover:bg-white/70 text-stone-600 transition-colors focus:outline-none"
              title="Share Wisdom"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </motion.section>

      {showShareModal && (
        <ShareModal
          verse={dailyVerse}
          // @ts-ignore
          customReflection={(reflectionsData as Record<string, string>)[`${dailyVerse.chapter}.${dailyVerse.verse}`]}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
