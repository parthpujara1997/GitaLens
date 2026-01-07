import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Verse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoginPrompt from './Auth/LoginPrompt';
import { VerseCardSkeleton } from './Skeleton';

interface FavoritesProps {
    onBack: () => void;
    onAuthRequired: (mode: 'login' | 'signup') => void;
}

const Favorites: React.FC<FavoritesProps> = ({ onBack, onAuthRequired }) => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<Verse[]>([]);
    const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        } else {
            setFavorites(storageService.getBookmarks());
            setLoading(false);
        }
    }, [user]);

    const fetchFavorites = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedFavorites: Verse[] = data.map(f => ({
                reference: f.verse_id,
                text: f.content,
                reflection: '',
            }));

            setFavorites(mappedFavorites);
        } catch (err) {
            console.error('Error fetching favorites:', err);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (e: React.MouseEvent, verse: Verse) => {
        e.stopPropagation();
        if (user) {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('verse_id', verse.reference);

            if (!error) {
                setFavorites(prev => prev.filter(f => f.reference !== verse.reference));
            }
        } else {
            storageService.toggleBookmark(verse);
            setFavorites(storageService.getBookmarks());
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col space-y-8 animate-in fade-in duration-700 w-full max-w-xl mx-auto pb-10">
                <div className="flex items-center justify-between pt-2">
                    <button onClick={onBack} className="p-2 hover:bg-stone-warm/50 rounded-full transition-colors text-stone-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-semibold text-saffron-brown serif">Favorites</h2>
                    <div className="w-10" />
                </div>
                <LoginPrompt
                    title="Your Sacred Collection"
                    description="Log in to save your favorite verses across all your devices and keep them forever."
                    onLogin={() => onAuthRequired('login')}
                    onSignup={() => onAuthRequired('signup')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-700 w-full max-w-xl mx-auto pb-10">
            <div className="flex items-center justify-between pt-2">
                <button onClick={onBack} className="p-2 hover:bg-stone-warm/50 rounded-full transition-colors text-stone-600">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-semibold text-saffron-brown serif">Favorites</h2>
                <div className="w-10" />
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        <VerseCardSkeleton />
                        <VerseCardSkeleton />
                        <VerseCardSkeleton />
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="bg-white/40 border border-dashed border-stone-warm rounded-3xl p-12 text-center">
                        <Heart className="mx-auto mb-4 text-stone-300" size={32} />
                        <p className="text-stone-500 font-medium">No bookmarks yet</p>
                        <p className="text-stone-400 text-sm mt-1">Verses you heart will appear here.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {favorites.map((verse) => (
                            <motion.div
                                key={verse.reference}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-sandalwood/30 border border-sandalwood-border/40 rounded-2xl p-6 relative group overflow-hidden"
                            >
                                <div className="flex flex-col space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-saffron-accent uppercase tracking-widest text-[10px] font-bold">{verse.reference}</span>
                                        <button
                                            onClick={(e) => removeFavorite(e, verse)}
                                            className="text-stone-400 hover:text-red-400 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <p className="serif text-lg italic text-charcoal-dark leading-relaxed">
                                        "{verse.text}"
                                    </p>

                                    {verse.reflection && (
                                        <>
                                            <button
                                                onClick={() => setSelectedVerse(selectedVerse === verse.reference ? null : verse.reference)}
                                                className="text-stone-500 text-[10px] uppercase font-semibold flex items-center space-x-1 hover:text-saffron-deep transition-colors"
                                            >
                                                <span>{selectedVerse === verse.reference ? 'Hide Reflection' : 'View Reflection'}</span>
                                            </button>

                                            <AnimatePresence>
                                                {selectedVerse === verse.reference && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="bg-white/40 rounded-xl p-4 mt-2 border-l-2 border-saffron-accent italic text-sm text-[#5A5246]">
                                                            {verse.reflection}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Favorites;
