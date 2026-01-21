import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, UserProgress } from '../types';
import { storageService } from '../services/storageService';
import { getRandomFamousVerse } from '../gitaData';
import { Share2, Copy, Check, Heart, Compass, Search, ChevronRight, Wind, Link, PenLine } from 'lucide-react'; // Wind for Lens, Link for Chain
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

const SanctuaryDashboard: React.FC<DashboardProps> = ({ onNavigate, onProgressUpdate, onAuthRequired, progress }) => {
    const { user } = useAuth();
    const [showReflection, setShowReflection] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [hasCheckedIn, setHasCheckedIn] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Daily Verse Logic
    const dailyVerse = useMemo(() => getRandomFamousVerse(), []);

    useEffect(() => {
        if (user) checkSupabaseBookmark();
        else setIsBookmarked(false);
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
            const { data } = await supabase.from('favorites').select('id').eq('user_id', user?.id).eq('verse_id', dailyVerse.reference).single();
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
                {/* Subtle Paper Background */}
                <div className="absolute inset-0 bg-[#F5F5F0] rounded-2xl -rotate-1 scale-[0.98] transition-transform group-hover:rotate-0 group-hover:scale-100 duration-500 ease-out" />
                <div className="relative bg-[#FBFBF9] rounded-2xl p-8 shadow-sm border border-[#EBEBE5] flex flex-col items-center text-center space-y-5 transition-shadow group-hover:shadow-md duration-500">

                    <div className="flex items-center space-x-2 opacity-50">
                        <div className="h-[1px] w-8 bg-saffron-deep" />
                        <span className="serif text-xs text-saffron-deep">Today's Verse</span>
                        <div className="h-[1px] w-8 bg-saffron-deep" />
                    </div>

                    <p className="font-serif text-xl md:text-2xl text-charcoal/90 leading-relaxed italic">
                        "{dailyVerse.text}"
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
                                className="overflow-hidden w-full pt-2"
                            >
                                <div className="pt-4 border-t border-stone-100 text-[#6B6B63] text-sm leading-relaxed serif">
                                    {(reflectionsData as Record<string, string>)[`${dailyVerse.chapter}.${dailyVerse.verse}`] || dailyVerse.reflection || "Reflect deeply on this wisdom."}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions Row */}
                    <div className={`flex items-center space-x-1 pt-2 transition-all duration-300 ${showReflection ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button onClick={handleBookmark} className={`p-2 rounded-full hover:bg-stone-100 transition-colors ${isBookmarked ? 'text-red-500' : 'text-stone-400 hover:text-stone-600'}`}>
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
                    className="w-full bg-white group rounded-full p-4 px-6 shadow-sm border border-stone-200 hover:border-saffron-accent/50 hover:shadow-md transition-all duration-300 flex items-center justify-between"
                >
                    <span className="text-stone-400 text-base font-serif group-hover:text-charcoal transition-colors">
                        What is on your mind?
                    </span>
                    <div className="h-8 w-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:text-saffron-deep group-hover:translate-x-1 transition-all">
                        <ChevronRight size={18} />
                    </div>
                </button>
            </motion.section>

            {/* 4. The Toolkit (Practices Strip) */}
            <motion.section variants={item} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Daily Practices</span>
                    {!hasCheckedIn && <span className="text-[10px] text-saffron-deep font-medium animate-pulse">Start here</span>}
                </div>

                <div className="flex space-x-3 overflow-x-auto pb-4 px-1 no-scrollbar sm:grid sm:grid-cols-4 sm:space-x-0 sm:gap-4">
                    {/* Reflect */}
                    <ToolCard
                        title="Reflect"
                        subtitle="Daily Journal"
                        icon={<PenLine size={20} />}
                        onClick={() => handleProtectedNavigate(View.JOURNAL)}
                        dataTour="dashboard-card-journal"
                    />

                    {/* Inner Compass */}
                    <ToolCard
                        title="Check-in"
                        subtitle="Inner Compass"
                        icon={<Compass size={20} />}
                        onClick={() => handleProtectedNavigate(View.INNER_COMPASS)}
                        active={!hasCheckedIn}
                        completed={hasCheckedIn}
                        dataTour="dashboard-card-compass"
                    />

                    {/* Lens */}
                    <ToolCard
                        title="Reframing"
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
        </motion.div >
    );
};

// Helper Sub-component for Tool Cards
const ToolCard = ({ title, subtitle, icon, onClick, active = false, completed = false, action, dataTour }: any) => {
    // If action is provided (like InnerCompass embedded), we render that or a placeholder. 
    // But for the strip, we might just want buttons.
    // Special handling for InnerCompass: if not checked in, maybe we render it in a modal?
    // OR for this "Sanctuary" design, clicking "Check-in" opens the view.

    // For now, simple buttons.
    // If InnerCompass needs to be embedded, this design needs a tweak.
    // Let's assume onNavigate(View.INNER_COMPASS) works fine.
    // BUT the original dashboard embedded InnerCompass directly if not checked in.
    // Let's stick to onNavigate for consistency in this clean layout, OR conditionally render the large card.

    // Actually, the user liked the "Embedded" check-in.
    // In this "Toolkit" strip, if we embed a whole compass it breaks the strip.
    // Let's keep it as a button that navigates OR expands.
    // I will stick to "Click to Navigate" for now to keep the "Strip" aesthetic clean.

    // Correction: In the code above, for InnerCompass, I passed `action`.
    // Let's handle InnerCompass specially.

    if (action && !completed) {
        // Embed case (Active Check-in) - Render a larger card taking full width?
        // No, let's keep it simple. Just navigate.
        // Wait, the original code had `<InnerCompass />` embedded.
        // If I replace `Dashboard`, I lose that embedding.
        // I should probably make `InnerCompass` a view or a modal if I want this strip look.
        // Reverting to `onNavigate` for InnerCompass is safer for this specific "clean" design.
        // Use `onClick` for everything.
    }

    return (
        <button
            data-tour={dataTour}
            onClick={onClick || (() => { })}
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
                    <Check size={10} className="text-green-500" />
                </div>
            )}
        </button>
    )
}

export default SanctuaryDashboard;
