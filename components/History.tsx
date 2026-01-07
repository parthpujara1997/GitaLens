import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowLeft, Trash, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { GuidanceSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoginPrompt from './Auth/LoginPrompt';
import { VerseCardSkeleton } from './Skeleton';

interface HistoryProps {
    onBack: () => void;
    onAuthRequired: (mode: 'login' | 'signup') => void;
}

const HistoryView: React.FC<HistoryProps> = ({ onBack, onAuthRequired }) => {
    const { user } = useAuth();
    const [summaries, setSummaries] = useState<GuidanceSummary[]>([]);
    const [selectedSummary, setSelectedSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            setSummaries(storageService.getHistorySummaries());
            setLoading(false);
        }
    }, [user]);

    const fetchHistory = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('history')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (error) throw error;

            const mappedHistory: GuidanceSummary[] = data.map(h => ({
                id: h.id,
                date: h.date,
                topic: h.topic,
                summary: h.summary
            }));

            setSummaries(mappedHistory);
        } catch (err) {
            console.error('Error fetching history:', err);
            setSummaries([]);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm('Are you sure you want to clear your guidance history?')) return;

        if (user) {
            const { error } = await supabase
                .from('history')
                .delete()
                .eq('user_id', user.id);

            if (!error) setSummaries([]);
        } else {
            localStorage.removeItem('gitalens_history');
            setSummaries([]);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col space-y-8 animate-in fade-in duration-700 w-full max-w-xl mx-auto pb-10">
                <div className="flex items-center justify-between pt-2">
                    <button onClick={onBack} className="p-2 hover:bg-stone-warm/50 rounded-full transition-colors text-stone-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-semibold text-saffron-brown serif">History</h2>
                    <div className="w-10" />
                </div>
                <LoginPrompt
                    title="Your Spiritual Archive"
                    description="Log in to preserve your journey and access your past guidance sessions from any device."
                    onLogin={() => onAuthRequired('login')}
                    onSignup={() => onAuthRequired('signup')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-700 w-full max-w-xl mx-auto pb-10">
            <div className="flex items-center justify-between pt-2">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-stone-warm/50 rounded-full transition-colors text-stone-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-semibold text-saffron-brown serif">History</h2>
                {summaries.length > 0 ? (
                    <button
                        onClick={clearHistory}
                        className="p-2 hover:bg-stone-warm/50 rounded-full transition-colors text-stone-400 hover:text-red-400"
                    >
                        <Trash size={18} />
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-4">
                        <VerseCardSkeleton />
                        <VerseCardSkeleton />
                        <VerseCardSkeleton />
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="bg-white/40 border border-dashed border-stone-warm rounded-3xl p-12 text-center">
                        <History className="mx-auto mb-4 text-stone-300" size={32} />
                        <p className="text-stone-500 font-medium">A journey yet to begin</p>
                        <p className="text-stone-400 text-sm mt-1">Summaries of your guidance sessions will be saved here.</p>
                    </div>
                ) : (
                    summaries.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 rounded-2xl group cursor-pointer"
                            onClick={() => setSelectedSummary(selectedSummary === item.id ? null : item.id)}
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <h3 className="text-charcoal font-semibold mt-1 serif text-base">{item.topic}</h3>
                                    </div>
                                </div>

                                <div className={`transition-all duration-300 overflow-hidden ${selectedSummary === item.id ? 'max-h-[500px] opacity-100' : 'max-h-12 opacity-60'}`}>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {item.summary}
                                    </p>
                                </div>

                                {selectedSummary !== item.id && (
                                    <button className="text-[10px] uppercase font-bold text-saffron-accent tracking-tighter">
                                        Read Summary
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryView;
