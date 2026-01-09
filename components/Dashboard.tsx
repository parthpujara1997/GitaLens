import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { View, UserProgress } from '../types';
import { storageService } from '../services/storageService';
import { getRandomFamousVerse } from '../gitaData';
import { Share2, Copy, Check, Loader2, Heart, Scroll } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
  const [isSharing, setIsSharing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const dailyVerse = useMemo(() => {
    return getRandomFamousVerse();
  }, []);

  useEffect(() => {
    if (user) {
      checkSupabaseBookmark();
    } else {
      setIsBookmarked(false);
    }
  }, [dailyVerse.reference, user]);

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
    const text = `"${dailyVerse.text}"\n\n${dailyVerse.reflection}\n\n- ${dailyVerse.reference}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareRef.current || isSharing) return;

    setIsSharing(true);

    const safetyTimeout = setTimeout(() => {
      if (isSharing) {
        setIsSharing(false);
        console.error('Share operation timed out');
      }
    }, 10000);

    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for ref

      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#F5F5F0',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      const fileName = `gitalens-daily-${new Date().toISOString().split('T')[0]}.png`;

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
          if (blob) {
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Daily Wisdom from GitaLens',
                text: `"${dailyVerse.text}"`,
                files: [file],
              });
              clearTimeout(safetyTimeout);
              setIsSharing(false);
              return;
            }
          }
        } catch (shareError) {
          console.warn('Native share failed or cancelled:', shareError);
        }
      }

      // Fallback
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error in handleShare:', error);
      alert('Could not generate share image. You can still copy the text!');
    } finally {
      clearTimeout(safetyTimeout);
      setIsSharing(false);
    }
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
            style={{ width: `${Math.min((progress.reflection_days % 30) / 30 * 100, 100)}%` }}
          />
        </div>
      </section>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
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
          onClick={() => onNavigate(View.HISTORY)}
          className="glass-card w-full flex flex-col items-center justify-center p-6 rounded-2xl text-center"
        >
          <span className="text-base font-medium text-charcoal">History</span>
          <p className="text-stone-500/80 text-[10px] uppercase tracking-tighter mt-1">Past Guidance</p>
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
                {dailyVerse.reflection}
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
              disabled={isSharing}
              className="p-2 rounded-full bg-white/40 hover:bg-white/70 text-stone-600 transition-colors focus:outline-none disabled:opacity-50"
              title="Share Image"
            >
              {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            </button>
          </div>
        </div>
      </motion.section>

      {/* Hidden Share Card Staging Area */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
        <div
          ref={shareRef}
          style={{
            width: '600px',
            backgroundColor: '#F5F5F0',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: '8px double #D8CBB5'
          }}
        >
          <div style={{ marginBottom: '24px', opacity: 0.9 }}>
            <img
              src="/logo.png"
              alt="GitaLens"
              style={{
                height: '80px',
                width: 'auto',
                margin: '0 auto',
                display: 'block'
              }}
            />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#C2A15F', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '32px' }}>
            {dailyVerse.reference}
          </h3>
          <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '30px', fontStyle: 'italic', color: '#262626', lineHeight: 1.6, marginBottom: '24px', padding: '0 32px' }}>
            "{dailyVerse.text}"
          </p>

          <div style={{ width: '40px', height: '1px', backgroundColor: '#C2A15F', marginBottom: '24px', opacity: 0.5 }}></div>

          <p style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#57534e', lineHeight: 1.6, marginBottom: '32px', maxWidth: '480px', fontStyle: 'italic' }}>
            {dailyVerse.reflection}
          </p>

          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Daily Wisdom
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
