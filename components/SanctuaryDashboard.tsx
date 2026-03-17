import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, UserProgress } from '../types';
import { getRandomFamousVerse } from '../gitaData';
import { Share2, Copy, Check, Heart, Search, ChevronRight, Wind, Link, PenLine } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

import ShareModal from './ShareModal';
// @ts-ignore
import reflectionsData from '../src/data/ai_reflections.json';

interface DashboardProps {
    onNavigate: (view: View) => void;
    onProgressUpdate: (progress: UserProgress) => void;
    onAuthRequired: (mode: 'login' | 'signup') => void;
    progress: UserProgress;
}

const SanctuaryDashboard: React.FC<DashboardProps> = ({ onNavigate, onProgressUpdate, onAuthRequired, progress }) => {
    const { user } = useAuth();
    const [showReflection, setShowReflection] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Daily Verse Logic
    const dailyVerse = useMemo(() => getRandomFamousVerse(), []);

    useEffect(() => {
        if (user) checkSupabaseBookmark();
        else setIsBookmarked(false);
    }, [dailyVerse.reference, user]);

    const checkSupabaseBookmark = async () => {
        try {
            const { data } = await supabase.from('favorites').select('id').eq('user_id', user?.id).eq('verse_id', dailyVerse.reference).maybeSingle();
            setIsBookmarked(!!data);
        } catch (err) { console.error(err); }
    };

    const handleBookmark = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (user) {
            if (isBookmarked) {
                const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('verse_id', dailyVerse.reference);
                if (!error) setIsBookmarked(false);
            } else {
                const { error } = await supabase.from('favorites').insert({ user_id: user.id, verse_id: dailyVerse.reference, content: dailyVerse.text });
                if (!error) setIsBookmarked(true);
            }
        } else onAuthRequired('login');
    };

    const handleProtectedNavigate = (view: View) => {
        if (!user) {
            onAuthRequired('signup');
            return;
        }
        onNavigate(view);
    };

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(`"${dailyVerse.text}"\n\n${dailyVerse.reference}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { console.error(err); }
    };

    // Date & Greeting
    const today = new Date();
    const dateString = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const getGreeting = () => {
        const hour = today.getHours();
        const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Seeker';
        if (hour >= 5 && hour < 12) return `Good Morning, ${name}.`;
        if (hour >= 12 && hour < 17) return `Good Afternoon, ${name}.`;
        if (hour >= 17 && hour < 22) return `Good Evening, ${name}.`;
        return `Peaceful Night, ${name}.`;
    };

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-xl mx-auto px-4 pb-20 pt-6 space-y-10 w-full"
        >
            {/* 1. Header: Date & Personal Greeting */}
            <motion.header variants={item} className="text-center space-y-1">
                <p className="text-[#8C8C80] text-[11px] uppercase tracking-[0.2em] font-medium">{dateString}</p>
                <h1 className="font-serif text-3xl text-charcoal tracking-tight">{getGreeting()}</h1>
            </motion.header>

            {/* 2. The Daily Scroll (Verse) */}
            <motion.section
                variants={item}
                data-tour="daily-verse-card"
                onClick={() => setShowReflection(!showReflection)}
                className="relative group cursor-pointer"
            >
                {/* Subtle Paper Background - Added back lift and shadow on hover */}
                <div className="absolute inset-0 bg-[#F5F5F0] rounded-2xl transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                <div className="relative bg-[#FBFBF9] rounded-2xl p-8 shadow-sm border border-[#EBEBE5] flex flex-col items-center text-center space-y-6 transition-all duration-500 group-hover:-translate-y-1">

                    <div className="flex items-center justify-center w-full opacity-60 px-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-[1px] w-6 bg-saffron-deep hidden sm:block" />
                            <span className="serif text-xs text-saffron-deep">Today's Wisdom</span>
                            <div className="h-[1px] w-6 bg-saffron-deep hidden sm:block" />
                        </div>
                    </div>

                    <p className="font-serif text-xl md:text-2xl text-charcoal/90 leading-loose tracking-wide italic">
                        "{dailyVerse.modernText || dailyVerse.text}"
                    </p>

                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                        {dailyVerse.reference}
                    </p>

                    {/* Reflection Reveal */}
                    <AnimatePresence>
                        {showReflection && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden w-full"
                            >
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.4 }}
                                    className="pt-6 border-t border-stone-100 text-[#6B6B63] text-sm leading-relaxed serif"
                                >
                                    {(reflectionsData as Record<string, string>)[`${dailyVerse.chapter}.${dailyVerse.verse}`] || dailyVerse.reflection || "Reflect deeply on this wisdom."}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions Row */}
                    <div className="flex items-center justify-center w-full space-x-2 pt-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300">
                        <button onClick={handleBookmark} className={`p-2 rounded-full hover:bg-stone-100 transition-colors ${isBookmarked ? 'text-[#C96A52]' : 'text-stone-400 hover:text-stone-600'}`}>
                            <Heart size={16} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                        <button onClick={handleCopy} className="p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                                onAuthRequired('signup');
                                return;
                            }
                            setShowShareModal(true);
                        }} className="p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>
            </motion.section>

            {/* 3. The Offering (Conversational Input) */}
            <motion.section variants={item}>
                <button
                    data-tour="dashboard-card-guidance"
                    onClick={() => handleProtectedNavigate(View.GUIDANCE)}
                    className="w-full bg-white group rounded-full p-4 px-6 shadow-sm border border-stone-200 hover:border-saffron-accent/50 hover:shadow-md transition-all duration-300 flex items-center justify-between relative overflow-hidden"
                >
                    <div className="flex items-center space-x-3 text-stone-400 group-hover:text-charcoal transition-colors">
                        <Search size={18} className="text-stone-300 group-hover:text-saffron-accent transition-colors" />
                        <span className="text-base font-serif flex items-center">
                            What is on your mind?
                            <span className="ml-1 w-0.5 h-4 bg-saffron-accent/70 animate-pulse hidden group-hover:block" />
                        </span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-stone-50/50 flex items-center justify-center text-stone-300 group-hover:text-saffron-deep group-hover:bg-orange-50 transition-all">
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </button>
            </motion.section>

            {/* 4. The Toolkit (Practices Strip) */}
            <motion.section variants={item} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Daily Practices</span>
                </div>

                <div className="flex space-x-3 overflow-x-auto pb-4 px-1 no-scrollbar sm:grid sm:grid-cols-3 sm:space-x-0 sm:gap-4">
                    {/* Reflect */}
                    <ToolCard
                        title="Reflect"
                        subtitle="Daily Journal"
                        icon={<PenLine size={20} />}
                        onClick={() => handleProtectedNavigate(View.JOURNAL)}
                        dataTour="dashboard-card-journal"
                    />

                    {/* Lens */}
                    <ToolCard
                        title="Reframe"
                        subtitle="Lens Practice"
                        icon={<Wind size={20} />}
                        onClick={() => handleProtectedNavigate(View.LENS_PRACTICE)}
                        dataTour="dashboard-card-lens"
                    />

                    {/* Clarity */}
                    <ToolCard
                        title="Untangle"
                        subtitle="Clarity Chain"
                        icon={<Link size={20} />}
                        onClick={() => handleProtectedNavigate(View.CLARITY_CHAIN)}
                        dataTour="dashboard-card-clarity"
                    />
                </div>
            </motion.section>

            {/* Journey Footer - Minimal */}
            <motion.div variants={item} className="text-center opacity-60 pt-4">
                <p className="font-serif text-sm text-stone-500">
                    Day {progress.reflection_days} of your journey
                </p>
            </motion.div>

            {
                showShareModal && (
                    <ShareModal
                        verse={dailyVerse}
                        // @ts-ignore
                        customReflection={(reflectionsData as Record<string, string>)[`${dailyVerse.chapter}.${dailyVerse.verse}`]}
                        onClose={() => setShowShareModal(false)}
                    />
                )
            }
        </motion.div>
    );
};

interface ToolCardProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    completed?: boolean;
    dataTour?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, subtitle, icon, onClick, active = false, completed = false, dataTour }) => {
    return (
        <button
            data-tour={dataTour}
            onClick={onClick}
            className={`relative min-w-[100px] flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300
            ${active
                    ? 'bg-white border-saffron-accent/30 shadow-sm shadow-orange-50/50 hover:shadow-md hover:-translate-y-1'
                    : 'bg-white/40 border-transparent hover:bg-white hover:border-stone-100 hover:shadow-sm'
                }
            ${completed ? 'opacity-70 grayscale-[0.5]' : ''}
          `}
        >
            <div className={`mb-2 p-2 rounded-full ${active ? 'bg-orange-50 text-saffron-deep' : 'bg-stone-50 text-stone-400'}`}>
                {icon}
            </div>
            <span className="text-stone-700 font-medium text-xs">{title}</span>
            <span className="text-stone-400 text-[9px] uppercase tracking-wide mt-0.5">{subtitle}</span>

            {completed && (
                <div className="absolute top-2 right-2">
                    <Check size={10} className="text-[#6B6B63]" />
                </div>
            )}
        </button>
    )
}

export default SanctuaryDashboard;
