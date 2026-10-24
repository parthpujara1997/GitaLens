import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Trash, Brain, Zap, Sparkles, TrendingUp,
  Smile, ChevronDown, ChevronUp, Plus, X,
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import FeatureGuide from './FeatureGuide';
import { getVerse } from '../gitaData';

interface JournalProps {
  onComplete?: () => void;
  onAuthRequired: (mode: 'login' | 'signup') => void;
}

interface ParsedContent {
  text: string;
  state_of_mind?: number;
  energy_level?: number;
  selected_mood?: string;
  prompts?: {
    action_focus?: string;
    clear_mind?: string;
    evening_review?: string;
    mood_prompt?: string;
  };
}

// ---------------------------------------------------------------------------
// Pure helpers (defined outside component to avoid re-creation on each render)
// ---------------------------------------------------------------------------

const parseJournalContent = (content: string): ParsedContent => {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return {
        text: parsed.text || '',
        state_of_mind: typeof parsed.state_of_mind === 'number' ? parsed.state_of_mind : undefined,
        energy_level: typeof parsed.energy_level === 'number' ? parsed.energy_level : undefined,
        selected_mood: typeof parsed.selected_mood === 'string' ? parsed.selected_mood : undefined,
        prompts: parsed.prompts || {},
      };
    }
  } catch (_) {
    // Fallback for legacy plain-text entries
  }
  return { text: content };
};

const getStateOfMindLabel = (val: number) => {
  switch (val) {
    case 1: return 'Highly Restless';
    case 2: return 'Mildly Restless';
    case 3: return 'Balanced';
    case 4: return 'Mildly Calm';
    case 5: return 'Highly Calm';
    default: return 'Balanced';
  }
};

const getEnergyLevelLabel = (val: number) => {
  switch (val) {
    case 1: return 'Highly Drained';
    case 2: return 'Mildly Drained';
    case 3: return 'Normal';
    case 4: return 'Mildly Energized';
    case 5: return 'Highly Energized';
    default: return 'Normal';
  }
};

// Human-friendly date: "Today, 10:34 AM" / "Yesterday, 9:00 PM" / "Jul 21, 9:00 PM"
const formatEntryDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
};

// ---------------------------------------------------------------------------
// Mood & Prompt data (stable — outside component)
// ---------------------------------------------------------------------------

interface MoodMapping {
  name: string;
  emoji: string;
  prompt: string;
  color: string; // hex
  verseChapter: number;
  verseNumber: number;
}

const MOODS: MoodMapping[] = [
  {
    name: 'Confused', emoji: '😶‍🌫️',
    prompt: 'What duty or decision feels unclear to me right now?',
    color: '#C2A15F', verseChapter: 2, verseNumber: 52,
  },
  {
    name: 'Anxious', emoji: '😟',
    prompt: 'What outcome am I holding onto that I need to let go of?',
    color: '#B87A4A', verseChapter: 2, verseNumber: 47,
  },
  {
    name: 'Peaceful', emoji: '🌿',
    prompt: 'What is bringing a sense of alignment to my heart today?',
    color: '#7A9E7E', verseChapter: 2, verseNumber: 70,
  },
  {
    name: 'Angry', emoji: '🔥',
    prompt: 'What expectation triggered my reaction, and how can I restore calm?',
    color: '#B05C4A', verseChapter: 2, verseNumber: 63,
  },
  {
    name: 'Motivated', emoji: '⚡',
    prompt: 'How can I channel this energy into selfless action today?',
    color: '#8A7A3A', verseChapter: 3, verseNumber: 19,
  },
];

interface PromptDef {
  id: string;
  label: string;
  question: string;
  subQuestion?: string;
}

const PROMPTS: PromptDef[] = [
  {
    id: 'action_focus', label: 'Action Focus',
    question: 'What action is required of me today?',
    subQuestion: 'What outcome am I attached to that I need to release?',
  },
  {
    id: 'clear_mind', label: 'Clear Mind',
    question: 'What temporary emotion or situation is currently clouding my clarity?',
  },
  {
    id: 'evening_review', label: 'Evening Review',
    question: 'Looking back on today, how did my actions align with my values?',
    subQuestion: 'What can I let go of?',
  },
];

const getRecommendedVerse = (stateOfMind: number, energyLevel: number) => {
  if (stateOfMind <= 2) return getVerse(6, 6) || getVerse(2, 66) || getVerse(6, 5);
  if (energyLevel <= 2) return getVerse(2, 3) || getVerse(18, 78) || getVerse(6, 5);
  if (stateOfMind >= 4 && energyLevel >= 4) return getVerse(12, 13) || getVerse(2, 48) || getVerse(6, 5);
  return getVerse(6, 5);
};

// ---------------------------------------------------------------------------
// Skeleton card for loading state
// ---------------------------------------------------------------------------

const SkeletonCard = () => (
  <div className="bg-white/60 border border-stone-warm/30 rounded-2xl p-5 animate-pulse space-y-3">
    <div className="flex gap-2 items-center">
      <div className="h-2.5 w-20 bg-stone-200 rounded-full" />
      <div className="h-2.5 w-14 bg-stone-100 rounded-full" />
    </div>
    <div className="space-y-2 pt-1">
      <div className="h-2.5 w-full bg-stone-100 rounded-full" />
      <div className="h-2.5 w-4/5 bg-stone-100 rounded-full" />
      <div className="h-2.5 w-2/3 bg-stone-100 rounded-full" />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Verse display sub-component (reusable, subtle)
// ---------------------------------------------------------------------------

const VerseCard = ({ verse }: { verse: any }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1.5, ease: 'easeInOut' }}
    className="px-4 py-3 bg-[#FBFBF9] border border-stone-warm/40 rounded-xl space-y-1"
  >
    <p className="text-xs text-charcoal/80 serif italic leading-relaxed">
      &ldquo;{`${verse.modernText || verse.text}`}&rdquo;
    </p>
    <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
      {verse.reference}
    </p>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Journal: React.FC<JournalProps> = ({ onComplete, onAuthRequired }) => {
  const { user } = useAuth();

  // Core journal text
  const [content, setContent] = useState('');

  // Past entries
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Feeling check-in drawer
  const [showStateCheckIn, setShowStateCheckIn] = useState(false);
  const [stateOfMind, setStateOfMind] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Guided prompt toggles & answers
  const [activePrompts, setActivePrompts] = useState<Record<string, boolean>>({
    action_focus: false, clear_mind: false, evening_review: false,
  });
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>({
    action_focus: '', clear_mind: '', evening_review: '', mood_prompt: '',
  });

  // Recommended verse (appears below free reflection)
  const [recommendedVerse, setRecommendedVerse] = useState<any>(null);
  const verseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (user) fetchEntries();
    return () => { if (verseTimeoutRef.current) clearTimeout(verseTimeoutRef.current); };
  }, [user]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journal')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(10);
      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching journal:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fix #9: verse only triggers on mouseUp/touchEnd, not every onChange drag step
  const scheduleVerseFromSliders = (mind: number, energy: number) => {
    if (!selectedMood) {
      setRecommendedVerse(null);
      if (verseTimeoutRef.current) clearTimeout(verseTimeoutRef.current);
      verseTimeoutRef.current = setTimeout(() => {
        setRecommendedVerse(getRecommendedVerse(mind, energy));
      }, 5000);
    }
  };

  const handleMoodSelect = (mood: MoodMapping) => {
    const alreadySelected = selectedMood === mood.name;
    if (alreadySelected) {
      handleClearMood();
      return;
    }
    setSelectedMood(mood.name);
    setRecommendedVerse(null);
    if (verseTimeoutRef.current) clearTimeout(verseTimeoutRef.current);
    verseTimeoutRef.current = setTimeout(() => {
      setRecommendedVerse(getVerse(mood.verseChapter, mood.verseNumber));
    }, 5000);
  };

  const handleClearMood = () => {
    setSelectedMood(null);
    setRecommendedVerse(null);
    setPromptAnswers(prev => ({ ...prev, mood_prompt: '' }));
    if (verseTimeoutRef.current) clearTimeout(verseTimeoutRef.current);
  };

  const togglePromptField = (id: string) => {
    setActivePrompts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!user) { onAuthRequired('signup'); return; }
    if (!hasEnteredData) return; // guard: nothing to save

    setIsSaving(true);
    try {
      const payload = {
        text: content.trim(),
        state_of_mind: showStateCheckIn ? stateOfMind : undefined,
        energy_level: showStateCheckIn ? energyLevel : undefined,
        selected_mood: showStateCheckIn && selectedMood ? selectedMood : undefined,
        prompts: {
          action_focus: activePrompts.action_focus ? promptAnswers.action_focus.trim() || undefined : undefined,
          clear_mind: activePrompts.clear_mind ? promptAnswers.clear_mind.trim() || undefined : undefined,
          evening_review: activePrompts.evening_review ? promptAnswers.evening_review.trim() || undefined : undefined,
          mood_prompt: selectedMood ? promptAnswers.mood_prompt.trim() || undefined : undefined,
        },
      };

      const { error } = await supabase.from('journal').insert({
        user_id: user.id,
        content: JSON.stringify(payload),
        date: new Date().toISOString(),
      });
      if (error) throw error;

      // Reset all state
      setContent('');
      setSelectedMood(null);
      setRecommendedVerse(null);
      setPromptAnswers({ action_focus: '', clear_mind: '', evening_review: '', mood_prompt: '' });
      setActivePrompts({ action_focus: false, clear_mind: false, evening_review: false });
      setShowStateCheckIn(false);

      await fetchEntries();
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error saving journal:', err);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEntryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      const { error } = await supabase.from('journal').delete().eq('id', entryToDelete);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== entryToDelete));
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Could not delete entry.');
    } finally {
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Trend data
  // ---------------------------------------------------------------------------

  const getTrendData = () => {
    const entriesWithSliders = entries
      .map(e => ({ ...e, parsed: parseJournalContent(e.content) }))
      .filter(e => e.parsed.state_of_mind !== undefined && e.parsed.energy_level !== undefined);

    const hasEnoughData = entriesWithSliders.length >= 5;
    let summaryText = '';

    if (hasEnoughData) {
      const timeOfDays = entriesWithSliders.map(e => {
        const h = new Date(e.date).getHours();
        if (h >= 5 && h < 12) return 'morning';
        if (h >= 12 && h < 17) return 'afternoon';
        if (h >= 17 && h < 21) return 'evening';
        return 'night';
      });

      const calmTimeCounts: Record<string, { total: number; sumState: number }> = {};
      entriesWithSliders.forEach((e, idx) => {
        const t = timeOfDays[idx];
        if (!calmTimeCounts[t]) calmTimeCounts[t] = { total: 0, sumState: 0 };
        calmTimeCounts[t].total += 1;
        calmTimeCounts[t].sumState += e.parsed.state_of_mind || 0;
      });

      let bestTime = '';
      let bestAvg = 0;
      Object.entries(calmTimeCounts).forEach(([t, d]: [string, any]) => {
        const avg = d.sumState / d.total;
        if (avg > bestAvg) { bestAvg = avg; bestTime = t; }
      });

      const avgEnergy =
        entriesWithSliders.reduce((acc, curr) => acc + (curr.parsed.energy_level || 0), 0) /
        entriesWithSliders.length;

      summaryText = `You tend to feel most calm during ${bestTime} check-ins. Your average energy sits at ${avgEnergy.toFixed(1)}/5.`;
    }

    return { hasEnoughData, entriesWithSliders: [...entriesWithSliders].reverse(), summaryText };
  };

  const trendInfo = getTrendData();

  // Fix #14: Y-axis labels on trend chart
  const renderTrendChart = () => {
    const data = trendInfo.entriesWithSliders;
    if (data.length < 2) return null;

    const width = 500;
    const height = 160;
    const pLeft = 52;
    const pRight = 12;
    const pTop = 18;
    const pBottom = 18;
    const cW = width - pLeft - pRight;
    const cH = height - pTop - pBottom;

    const getX = (i: number) => pLeft + (i / (data.length - 1)) * cW;
    const getY = (v: number) => pTop + cH - ((v - 1) / 4) * cH;

    let mindPts = '';
    let energyPts = '';
    data.forEach((e, i) => {
      mindPts   += `${getX(i)},${getY(e.parsed.state_of_mind  || 3)} `;
      energyPts += `${getX(i)},${getY(e.parsed.energy_level || 3)} `;
    });

    const yLabels = [
      { val: 5, mind: 'Calm',    energy: 'Energized' },
      { val: 3, mind: 'Mid',     energy: 'Normal'    },
      { val: 1, mind: 'Restless', energy: 'Drained'  },
    ];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-stone-50/50 rounded-xl border border-stone-200/50">
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map(v => (
          <line key={v} x1={pLeft} y1={getY(v)} x2={width - pRight} y2={getY(v)}
            stroke="#EAEAE3" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        {/* Y-axis labels — Mind (left, saffron) */}
        {yLabels.map(({ val, mind }) => (
          <text key={`m${val}`} x={pLeft - 5} y={getY(val) + 3}
            textAnchor="end" fontSize="7" fill="#C2A15F" fontWeight="600">
            {mind}
          </text>
        ))}

        {/* Mind polyline (saffron) */}
        <polyline fill="none" stroke="#C2A15F" strokeWidth="2.5"
          points={mindPts.trim()} strokeLinecap="round" strokeLinejoin="round" />

        {/* Energy polyline (clay) */}
        <polyline fill="none" stroke="#7A5A3A" strokeWidth="2.5"
          points={energyPts.trim()} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data dots */}
        {data.map((e, i) => (
          <g key={e.id}>
            <circle cx={getX(i)} cy={getY(e.parsed.state_of_mind  || 3)} r="4" fill="#C2A15F" stroke="#FFF" strokeWidth="1.5" />
            <circle cx={getX(i)} cy={getY(e.parsed.energy_level || 3)} r="4" fill="#7A5A3A" stroke="#FFF" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    );
  };

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  // Fix #3: disable Save unless something was actually entered
  const hasEnteredData =
    content.trim().length > 0 ||
    promptAnswers.action_focus.trim().length > 0 ||
    promptAnswers.clear_mind.trim().length > 0 ||
    promptAnswers.evening_review.trim().length > 0 ||
    promptAnswers.mood_prompt.trim().length > 0;

  const selectedMoodData = MOODS.find(m => m.name === selectedMood);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Reflection?"
        message="This action cannot be undone. Are you sure you want to delete this specific reflection?"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmLabel="Delete"
        isDestructive={true}
      />

      <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-xl mx-auto pb-12">
        <FeatureGuide
          title="INNER DIALOGUE"
          description="A sacred space to record your insights. Your reflections here deepen your connection to the wisdom you discover."
          featureId="journal"
          className="-mb-2"
        />

        <div className="text-center md:text-left mb-6">
          <h2 className="text-3xl font-semibold text-charcoal serif">Journal</h2>
          <p className="text-stone-500 text-sm italic">Capture your inner dialogue.</p>
        </div>

        {/* ── Input Card ──────────────────────────────────────────────────── */}
        <section className="bg-white border border-stone-warm rounded-2xl p-6 shadow-sm space-y-5">

          {/* ① Feeling check-in (collapsible) -------------------------------- */}
          <div className="border border-stone-warm/50 rounded-xl overflow-hidden bg-stone-50/30">
            <button
              onClick={() => setShowStateCheckIn(v => !v)}
              className="w-full flex justify-between items-center px-4 py-3 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Smile size={15} className="text-saffron-accent" />
                How are you feeling today?
                {/* Fix #1 side-effect: show active mood badge on the toggle button when drawer is closed */}
                {selectedMood && !showStateCheckIn && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: selectedMoodData?.color ?? '#C2A15F' }}
                  >
                    {selectedMood}
                  </span>
                )}
              </span>
              {showStateCheckIn ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            <AnimatePresence>
              {showStateCheckIn && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-stone-warm/30"
                >
                  <div className="px-4 pt-4 pb-5 space-y-5">

                    {/* Mood pills */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Current emotion</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MOODS.map(mood => (
                          <button
                            key={mood.name}
                            onClick={() => handleMoodSelect(mood)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                              selectedMood === mood.name
                                ? 'text-white border-transparent shadow-sm'
                                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                            style={selectedMood === mood.name ? { backgroundColor: mood.color } : {}}
                          >
                            <span>{mood.emoji}</span>
                            {mood.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fix #1: Mood prompt textarea lives INSIDE the drawer */}
                    {/* Fix #4: AnimatePresence with mode="wait" + keyed child */}
                    <AnimatePresence mode="wait">
                      {selectedMood && (
                        <motion.div
                          key={selectedMood}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 rounded-xl p-3.5 border"
                          style={{
                            backgroundColor: `${selectedMoodData?.color}12`,
                            borderColor:     `${selectedMoodData?.color}33`,
                          }}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <label className="text-xs font-semibold text-charcoal/80 serif leading-snug">
                              {selectedMoodData?.prompt}
                            </label>
                            {/* Fix #8: × icon instead of tiny text link */}
                            <button
                              onClick={handleClearMood}
                              className="flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors mt-0.5"
                              title="Clear mood"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <textarea
                            value={promptAnswers.mood_prompt}
                            onChange={e => setPromptAnswers(prev => ({ ...prev, mood_prompt: e.target.value }))}
                            placeholder="Reflect here…"
                            className="w-full h-20 p-3 bg-white/80 border border-stone-warm/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-saffron-accent text-charcoal text-sm resize-none"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Sliders */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">State sliders</p>

                      {/* State of Mind */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5 text-saffron-deep font-semibold">
                            <Brain size={13} /> State of Mind
                          </span>
                          <span className="text-stone-500 font-bold text-[10px] uppercase tracking-tight bg-stone-light/50 px-2 py-0.5 rounded-md border border-stone-warm/30">
                            {getStateOfMindLabel(stateOfMind)}
                          </span>
                        </div>
                        <input
                          type="range" min="1" max="5" value={stateOfMind}
                          // Fix #9: onChange only updates display; verse fires on mouseUp/touchEnd
                          onChange={e => setStateOfMind(Number(e.target.value))}
                          onMouseUp={e => scheduleVerseFromSliders(Number((e.target as HTMLInputElement).value), energyLevel)}
                          onTouchEnd={e => scheduleVerseFromSliders(Number((e.currentTarget as HTMLInputElement).value), energyLevel)}
                          className="w-full accent-saffron-accent cursor-pointer my-1"
                        />
                        <div className="flex justify-between text-[9px] text-stone-400 px-0.5 uppercase tracking-tight font-medium">
                          <span>Restless</span><span>Balanced</span><span>Calm</span>
                        </div>
                      </div>

                      {/* Energy Level */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5 text-clay font-semibold">
                            <Zap size={13} /> Energy Level
                          </span>
                          <span className="text-stone-500 font-bold text-[10px] uppercase tracking-tight bg-stone-light/50 px-2 py-0.5 rounded-md border border-stone-warm/30">
                            {getEnergyLevelLabel(energyLevel)}
                          </span>
                        </div>
                        <input
                          type="range" min="1" max="5" value={energyLevel}
                          onChange={e => setEnergyLevel(Number(e.target.value))}
                          onMouseUp={e => scheduleVerseFromSliders(stateOfMind, Number((e.target as HTMLInputElement).value))}
                          onTouchEnd={e => scheduleVerseFromSliders(stateOfMind, Number((e.currentTarget as HTMLInputElement).value))}
                          className="w-full accent-clay cursor-pointer my-1"
                        />
                        <div className="flex justify-between text-[9px] text-stone-400 px-0.5 uppercase tracking-tight font-medium">
                          <span>Drained</span><span>Normal</span><span>Energized</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ② Main Free Reflection textarea ----------------------------------
               Fix #11: no "Free Reflection" label — placeholder speaks for itself */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="How are you observing your mind today? Write down whatever is in your heart…"
            className="w-full h-44 p-4 bg-parchment/30 border border-stone-warm rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron-accent text-charcoal text-sm resize-none transition-all placeholder:italic placeholder:text-stone-400"
          />

          {/* ③ Recommended Verse — appears here, below main textarea
               Fix #2: verse text uses template literal, not a literal string
               User asked: "below the journal text box … subtle" */}
          <AnimatePresence>
            {recommendedVerse && (
              <VerseCard key="verse-card" verse={recommendedVerse} />
            )}
          </AnimatePresence>

          {/* ④ Optional guided prompts
               Fix #6: warmer label with Sparkles icon instead of "Optional Guided Prompts" */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-saffron-accent/70" />
              <span className="text-xs text-stone-400 font-medium">Explore deeper</span>
              <div className="flex-1 h-px bg-stone-warm/40" />
            </div>

            <div className="flex flex-wrap gap-2">
              {PROMPTS.map(p => {
                const isActive = activePrompts[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePromptField(p.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-clay text-white border-clay shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700'
                    }`}
                  >
                    {isActive ? <X size={11} /> : <Plus size={11} />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Active prompt boxes */}
            <div className="space-y-3">
              <AnimatePresence>
                {PROMPTS.map(p => {
                  if (!activePrompts[p.id]) return null;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 border border-stone-warm/50 p-4 rounded-xl bg-stone-50/40">
                        <div className="space-y-0.5">
                          <label className="text-xs font-semibold text-stone-600 serif block leading-snug">
                            {p.question}
                          </label>
                          {p.subQuestion && (
                            <label className="text-xs text-stone-500 serif block leading-snug">
                              {p.subQuestion}
                            </label>
                          )}
                        </div>
                        <textarea
                          value={promptAnswers[p.id]}
                          onChange={e => setPromptAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Write your reflection…"
                          className="w-full h-24 p-3 bg-white border border-stone-warm rounded-lg focus:outline-none focus:ring-1 focus:ring-saffron-accent text-charcoal text-sm resize-none"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* ⑤ Save Button
               Fix #3: disabled when nothing entered
               Fix #7: single consistent label "Save Reflection" */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving || !hasEnteredData}
              className="px-8 py-3 bg-clay text-[#F4F1EC] text-sm font-semibold rounded-xl hover:bg-clay-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-clay/10"
            >
              {isSaving ? 'Storing…' : 'Save Reflection'}
            </button>
          </div>
        </section>

        {/* ── Personal Trends (only when ≥ 5 slider entries) ─────────────── */}
        {user && trendInfo.hasEnoughData && (
          <section className="bg-white border border-stone-warm rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-saffron-deep" />
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider">Personal Trends</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/50">
              {trendInfo.summaryText}
            </p>
            <div className="space-y-2">
              <div className="flex justify-end items-center gap-4 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-saffron-accent inline-block rounded-full" /> Mind
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-clay inline-block rounded-full" /> Energy
                </span>
              </div>
              {renderTrendChart()}
            </div>
          </section>
        )}

        {/* ── Recent Reflections ───────────────────────────────────────────── */}
        {user && (
          <section className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-500 px-1">
              Recent Reflections
            </h3>

            {/* Fix #15: skeleton loading cards */}
            {loading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : entries.length === 0 ? (
              <div className="bg-white/40 border border-dashed border-stone-warm rounded-2xl p-8 text-center">
                <p className="text-stone-400 text-sm italic">Your past reflections will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => {
                  const parsed = parseJournalContent(entry.content);
                  // Fix #13: left-border accent colored by mood
                  const moodColor = parsed.selected_mood
                    ? MOODS.find(m => m.name === parsed.selected_mood)?.color ?? '#E2DED6'
                    : '#E2DED6';

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/70 backdrop-blur-sm border border-stone-warm/30 rounded-2xl p-5 hover:bg-white/90 transition-colors group relative overflow-hidden"
                      style={{ borderLeft: `3px solid ${moodColor}` }}
                    >
                      {/* Header row */}
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Fix #13: human-readable date */}
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">
                            {formatEntryDate(entry.date)}
                          </span>
                          {parsed.selected_mood && (
                            <span
                              className="px-2 py-0.5 text-[9px] font-semibold rounded-full text-white"
                              style={{ backgroundColor: moodColor }}
                            >
                              {parsed.selected_mood}
                            </span>
                          )}
                          {parsed.state_of_mind !== undefined && (
                            <span className="px-2 py-0.5 text-[9px] font-semibold bg-saffron-beige/60 text-saffron-deep rounded-full border border-sandalwood-border/30">
                              {getStateOfMindLabel(parsed.state_of_mind)}
                            </span>
                          )}
                          {parsed.energy_level !== undefined && (
                            <span className="px-2 py-0.5 text-[9px] font-semibold bg-clay-tint/50 text-clay rounded-full border border-clay-tint">
                              {getEnergyLevelLabel(parsed.energy_level)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={e => handleDeleteClick(entry.id, e)}
                          className="text-stone-300 hover:text-red-400 p-1.5 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Entry"
                        >
                          <Trash size={13} />
                        </button>
                      </div>

                      {/* Body — Fix #13: line-clamp-2 preview */}
                      <div className="space-y-2">
                        {parsed.text && (
                          <p className="text-charcoal text-sm leading-relaxed line-clamp-2 whitespace-pre-wrap">
                            {parsed.text}
                          </p>
                        )}
                        {parsed.prompts && Object.entries(parsed.prompts).map(([key, value]) => {
                          if (!value) return null;
                          let label = '';
                          if (key === 'action_focus') label = 'Action Focus';
                          else if (key === 'clear_mind') label = 'Clear Mind';
                          else if (key === 'evening_review') label = 'Evening Review';
                          else if (key === 'mood_prompt') label = `${parsed.selected_mood ?? 'Mood'} Reflection`;
                          return (
                            <div key={key} className="bg-stone-50/70 border border-stone-warm/30 rounded-xl p-3 space-y-0.5">
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{label}</span>
                              <p className="text-charcoal text-xs leading-relaxed line-clamp-2 whitespace-pre-wrap">{value}</p>
                            </div>
                          );
                        })}
                        {!parsed.text && (!parsed.prompts || Object.values(parsed.prompts).every(v => !v)) && (
                          <p className="text-stone-400 text-xs italic">Quick check-in.</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
};

export default Journal;