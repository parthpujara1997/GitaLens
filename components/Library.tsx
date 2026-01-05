import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Heart, Tag } from 'lucide-react';
import { GITA_VERSES, CHAPTERS, THEMES, getVersesByChapter, getVersesByTheme } from '../gitaData';
import { GitaVerse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface LibraryProps {
    onBack: () => void;
    onAuthRequired: (mode: 'login' | 'signup') => void;
}

type ViewMode = 'chapters' | 'themes';

const Library: React.FC<LibraryProps> = ({ onBack, onAuthRequired }) => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('chapters');
    const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [selectedVerse, setSelectedVerse] = useState<GitaVerse | null>(null);
    const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            loadBookmarks();
        }
    }, [user]);

    const loadBookmarks = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('verse_id')
                .eq('user_id', user.id);

            if (!error && data) {
                setBookmarkedVerses(new Set(data.map(f => f.verse_id)));
            }
        } catch (err) {
            console.error('Error loading bookmarks:', err);
        }
    };

    const handleBookmark = async (verse: GitaVerse) => {
        if (!user) {
            onAuthRequired('login');
            return;
        }

        const isBookmarked = bookmarkedVerses.has(verse.reference);

        try {
            if (isBookmarked) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('verse_id', verse.reference);

                setBookmarkedVerses(prev => {
                    const next = new Set(prev);
                    next.delete(verse.reference);
                    return next;
                });
            } else {
                await supabase
                    .from('favorites')
                    .insert({
                        user_id: user.id,
                        verse_id: verse.reference,
                        content: verse.text
                    });

                setBookmarkedVerses(prev => new Set(prev).add(verse.reference));
            }
        } catch (err) {
            console.error('Error toggling bookmark:', err);
        }
    };

    const renderChapterView = () => (
        <div className="space-y-3">
            {CHAPTERS.map(chapter => {
                const verses = getVersesByChapter(chapter.number);
                const isExpanded = expandedChapter === chapter.number;

                return (
                    <motion.div
                        key={chapter.number}
                        layout
                        className="bg-white border border-stone-warm rounded-2xl overflow-hidden shadow-sm"
                    >
                        <button
                            onClick={() => setExpandedChapter(isExpanded ? null : chapter.number)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-saffron-accent/10 flex items-center justify-center">
                                    <span className="text-sm font-bold text-saffron-accent">{chapter.number}</span>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-charcoal">{chapter.name}</h3>
                                    <p className="text-xs text-stone-600 mt-0.5">{chapter.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-xs text-stone-500">{verses.length} verses</span>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" className="text-stone-400">
                                        <path d="M5 7.5L10 12.5L15 7.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </motion.div>
                            </div>
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-stone-warm"
                                >
                                    <div className="p-4 space-y-3 bg-stone-50/50">
                                        {verses.map(verse => (
                                            <motion.div
                                                key={verse.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-xl p-4 border border-stone-warm/50 hover:border-saffron-accent/30 transition-all cursor-pointer group"
                                                onClick={() => setSelectedVerse(verse)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-xs font-bold text-saffron-accent uppercase tracking-wider">
                                                        Verse {verse.verse}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBookmark(verse);
                                                        }}
                                                        className={`p-1.5 rounded-full transition-colors ${bookmarkedVerses.has(verse.reference)
                                                            ? 'text-red-500 bg-red-50'
                                                            : 'text-stone-400 hover:text-red-500 hover:bg-red-50'
                                                            }`}
                                                    >
                                                        <Heart size={14} fill={bookmarkedVerses.has(verse.reference) ? 'currentColor' : 'none'} />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-charcoal leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                                    <span className="font-bold text-xs text-stone-500 mr-1 uppercase">{verse.speaker}:</span>
                                                    {verse.text}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {verse.themes.map(theme => (
                                                        <span
                                                            key={theme}
                                                            className="text-[9px] px-2 py-1 bg-stone-100 text-stone-600 rounded-full uppercase tracking-wider font-medium"
                                                        >
                                                            {theme}
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );

    const renderThemeView = () => (
        <div className="space-y-4">
            {selectedTheme ? (
                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedTheme(null)}
                        className="flex items-center space-x-2 text-sm text-stone-600 hover:text-charcoal transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to themes</span>
                    </button>

                    <div className="bg-sandalwood/30 border border-sandalwood-border/50 rounded-2xl p-6">
                        <div className="flex items-center space-x-3 mb-2">
                            <Tag size={20} className="text-saffron-accent" />
                            <h3 className="text-xl font-semibold text-charcoal capitalize">
                                {THEMES.find(t => t.id === selectedTheme)?.name}
                            </h3>
                        </div>
                        <p className="text-sm text-stone-600 italic">
                            {THEMES.find(t => t.id === selectedTheme)?.description}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {getVersesByTheme(selectedTheme).map(verse => (
                            <motion.div
                                key={verse.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl p-5 border border-stone-warm shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => setSelectedVerse(verse)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs font-bold text-saffron-accent uppercase tracking-wider">
                                        {verse.reference}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBookmark(verse);
                                        }}
                                        className={`p-1.5 rounded-full transition-colors ${bookmarkedVerses.has(verse.reference)
                                            ? 'text-red-500 bg-red-50'
                                            : 'text-stone-400 hover:text-red-500 hover:bg-red-50'
                                            }`}
                                    >
                                        <Heart size={14} fill={bookmarkedVerses.has(verse.reference) ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                                <p className="text-sm text-charcoal leading-relaxed italic mb-3">
                                    <span className="font-bold text-xs text-stone-500 mr-1 not-italic uppercase">{verse.speaker}:</span>
                                    "{verse.text}"
                                </p>
                                <p className="text-xs text-stone-600 leading-relaxed">
                                    {verse.reflection}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {THEMES.map(theme => {
                        const verseCount = getVersesByTheme(theme.id).length;

                        return (
                            <motion.button
                                key={theme.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedTheme(theme.id)}
                                className="bg-white border border-stone-warm rounded-2xl p-5 text-left hover:border-saffron-accent/50 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <Tag size={18} className="text-saffron-accent" />
                                    <span className="text-xs text-stone-500">{verseCount} verses</span>
                                </div>
                                <h3 className="font-semibold text-charcoal mb-1 group-hover:text-saffron-accent transition-colors">
                                    {theme.name}
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed">
                                    {theme.description}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="text-stone-600 hover:text-charcoal transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-semibold text-charcoal serif">Library</h2>
                        <p className="text-sm text-stone-600 mt-1">Explore the wisdom of the Bhagavad Gita</p>
                    </div>
                </div>
                <BookOpen size={28} className="text-saffron-accent opacity-60" />
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 bg-stone-neutral/50 p-1.5 rounded-2xl border border-stone-warm">
                <button
                    onClick={() => {
                        setViewMode('chapters');
                        setSelectedTheme(null);
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'chapters'
                        ? 'bg-white text-charcoal shadow-sm'
                        : 'text-stone-600 hover:text-charcoal'
                        }`}
                >
                    By Chapter
                </button>
                <button
                    onClick={() => {
                        setViewMode('themes');
                        setExpandedChapter(null);
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'themes'
                        ? 'bg-white text-charcoal shadow-sm'
                        : 'text-stone-600 hover:text-charcoal'
                        }`}
                >
                    By Theme
                </button>
            </div>

            {/* Content */}
            <div className="pb-8">
                {viewMode === 'chapters' ? renderChapterView() : renderThemeView()}
            </div>

            {/* Verse Detail Modal */}
            <AnimatePresence>
                {selectedVerse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedVerse(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-sandalwood/95 backdrop-blur-md border border-sandalwood-border rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <span className="text-xs font-bold text-saffron-accent uppercase tracking-widest">
                                        {selectedVerse.reference}
                                    </span>
                                    <h3 className="text-lg font-semibold text-charcoal mt-1">
                                        {CHAPTERS.find(c => c.number === selectedVerse.chapter)?.name}
                                    </h3>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookmark(selectedVerse);
                                    }}
                                    className={`p-2 rounded-full transition-colors ${bookmarkedVerses.has(selectedVerse.reference)
                                        ? 'text-red-500 bg-red-50'
                                        : 'text-stone-400 hover:text-red-500 hover:bg-red-50'
                                        }`}
                                >
                                    <Heart size={20} fill={bookmarkedVerses.has(selectedVerse.reference) ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white/60 rounded-2xl p-6 border-l-4 border-saffron-accent">
                                    <p className="serif text-lg italic text-charcoal-dark leading-relaxed">
                                        <span className="font-bold text-xs text-stone-500 mr-2 not-italic uppercase block mb-1">{selectedVerse.speaker}</span>
                                        "{selectedVerse.text}"
                                    </p>
                                </div>

                                <div className="bg-white/40 rounded-2xl p-5">
                                    <h4 className="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3">Reflection</h4>
                                    <p className="text-sm text-stone-700 leading-relaxed">
                                        {selectedVerse.reflection}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3">Themes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedVerse.themes.map(theme => (
                                            <span
                                                key={theme}
                                                className="px-3 py-1.5 bg-white/60 text-stone-700 rounded-full text-xs font-medium capitalize"
                                            >
                                                {theme}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedVerse(null)}
                                className="mt-8 w-full py-3 bg-saffron-accent/10 hover:bg-saffron-accent/20 text-saffron-accent rounded-2xl font-medium transition-all"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Library;
