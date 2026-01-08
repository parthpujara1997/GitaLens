import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowLeft, Trash, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { GuidanceSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoginPrompt from './Auth/LoginPrompt';
import { VerseCardSkeleton } from './Skeleton';
import ConfirmationModal from './ConfirmationModal';

interface HistoryProps {
    onBack: () => void;
    onAuthRequired: (mode: 'login' | 'signup') => void;
}

const HistoryView: React.FC<HistoryProps> = ({ onBack, onAuthRequired }) => {
    const { user } = useAuth();
    const [summaries, setSummaries] = useState<GuidanceSummary[]>([]);
    const [selectedSummary, setSelectedSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'SINGLE' | 'ALL' | null;
        itemId?: string;
    }>({
        isOpen: false,
        type: null
    });

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
                summary: h.summary,
                messages: h.messages || []
            }));

            setSummaries(mappedHistory);
        } catch (err) {
            console.error('Error fetching history:', err);
            setSummaries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearAllClick = () => {
        setModalConfig({ isOpen: true, type: 'ALL' });
    };

    const handleDeleteItemClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setModalConfig({ isOpen: true, type: 'SINGLE', itemId: id });
    };

    const confirmAction = async () => {
        if (modalConfig.type === 'ALL') {
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
        } else if (modalConfig.type === 'SINGLE' && modalConfig.itemId) {
            if (user) {
                const { error } = await supabase
                    .from('history')
                    .delete()
                    .eq('id', modalConfig.itemId);

                if (!error) {
                    setSummaries(prev => prev.filter(item => item.id !== modalConfig.itemId));
                }
            }
        }
        setModalConfig({ isOpen: false, type: null });
    };

    // Render logic for conversation view
    const renderConversation = (messages: { role: 'user' | 'ai'; content: string }[]) => (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
                    <div className={`max-w-[90%] rounded-2xl px-4 py-3 border text-sm ${m.role === 'user' ? 'bg-indigo text-white border-indigo' : 'bg-white text-charcoal shadow-sm border-stone-warm/30'}`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );

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
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.type === 'ALL' ? "Clear History?" : "Delete Session?"}
                message={modalConfig.type === 'ALL'
                    ? "Are you sure you want to clear your entire guidance history? This cannot be undone."
                    : "Are you sure you want to delete this specific session?"}
                onConfirm={confirmAction}
                onCancel={() => setModalConfig({ isOpen: false, type: null })}
                confirmLabel="Delete"
                isDestructive={true}
            />

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
                        onClick={handleClearAllClick}
                        className="p-2 hover:bg-stone-warm/50 rounded-full transition-colors text-stone-400 hover:text-red-400"
                        title="Clear All History"
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
                            className="glass-card p-6 rounded-2xl group cursor-pointer hover:shadow-md transition-all relative"
                            onClick={() => setSelectedSummary(selectedSummary === item.id ? null : item.id)}
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="pr-8">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <h3 className="text-charcoal font-semibold mt-1 serif text-base">{item.topic}</h3>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteItemClick(e, item.id)}
                                        className="p-2 -mr-2 -mt-2 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Session"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>

                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedSummary === item.id ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
                                    {item.messages && item.messages.length > 0 ? (
                                        renderConversation(item.messages)
                                    ) : (
                                        <p className="text-stone-600 text-sm leading-relaxed italic">
                                            {item.summary || "No details available."}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                                        {selectedSummary === item.id ? 'Close' : 'View Conversation'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryView;
