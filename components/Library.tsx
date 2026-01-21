import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { BookOpen, Search, Palette, X, ChevronRight, ChevronLeft, Heart, Tag, ArrowLeft, Scroll, Share2 } from 'lucide-react';
import { GITA_VERSES, CHAPTERS, THEMES, getVersesByChapter, getVersesByTheme } from '../gitaData';
import { GitaVerse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import reflectionsData from '../src/data/ai_reflections.json';
// @ts-ignore
import hindiVerses from '../src/data/hindiVerses.json';

import ShareModal from './ShareModal';

interface LibraryProps {
    onBack: () => void;
    onAuthRequired: (mode: 'login' | 'signup') => void;
    initialVerseId?: string;
}

type ViewMode = 'chapters' | 'themes';
const Library: React.FC<LibraryProps> = ({ onBack, onAuthRequired, initialVerseId }) => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('chapters');
    const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [selectedVerse, setSelectedVerse] = useState<GitaVerse | null>(null);
    const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Sharing state
    const [showShareModal, setShowShareModal] = useState(false);
    const [verseToShare, setVerseToShare] = useState<GitaVerse | null>(null);
    // Language state for Verse Detail View
    const [language, setLanguage] = useState<'EN' | 'SA' | 'HI'>('EN');


    useEffect(() => {
        if (initialVerseId) {
            const verse = GITA_VERSES.find(v => v.id === initialVerseId);
            if (verse) {
                setSelectedVerse(verse);
            }
        }
    }, [initialVerseId]);

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

    const handleShare = (verse: GitaVerse) => {
        if (!user) {
            onAuthRequired('signup');
            return;
        }
        setVerseToShare(verse);
        setShowShareModal(true);
    };

    // Filter verses based on search query
    const filteredVerses = searchQuery.trim() === '' ? [] : GITA_VERSES.filter(verse =>
        verse.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        verse.reference.includes(searchQuery) ||
        verse.speaker.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderSearchResults = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-widest">
                    Search Results ({filteredVerses.length})
                </h3>
                <button
                    onClick={() => { setSearchQuery(''); setIsSearching(false); }}
                    className="text-xs text-saffron-accent hover:underline"
                >
                    Clear Search
                </button>
            </div>

            {filteredVerses.length === 0 ? (
                <div className="text-center py-12 bg-white/50 rounded-2xl border border-stone-warm/50">
                    <Search className="mx-auto text-stone-300 mb-3" size={32} />
                    <p className="text-stone-500 font-medium">No verses found</p>
                    <p className="text-stone-400 text-sm mt-1">Try searching for keywords like "duty", "peace", or "meditation"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filteredVerses.map(verse => (
                        <motion.div
                            key={verse.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-4 border border-stone-warm hover:border-saffron-accent/30 transition-all cursor-pointer group shadow-sm"
                            onClick={() => setSelectedVerse(verse)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-bold text-saffron-accent uppercase tracking-wider">
                                    {verse.reference} • {CHAPTERS.find(c => c.number === verse.chapter)?.name}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookmark(verse);
                                    }}
                                    className={`p-1.5 rounded-full transition-colors ${bookmarkedVerses.has(verse.reference) ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}
                                >
                                    <Heart size={14} fill={bookmarkedVerses.has(verse.reference) ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                            <p className="text-sm text-charcoal leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                <span className="font-bold text-xs text-stone-500 mr-1 uppercase">{verse.speaker}:</span>
                                {verse.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );

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
                                                        className={`p-1.5 rounded-full transition-colors ${bookmarkedVerses.has(verse.reference) ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}
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
            })
            }
        </div >
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
                                        className={`p-1.5 rounded-full transition-colors ${bookmarkedVerses.has(verse.reference) ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}
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
            {/* Header Section */}
            <div className="space-y-6 mb-8 pt-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-8 max-w-2xl">
                        <button
                            onClick={onBack}
                            className="group flex items-center space-x-2 text-stone-500 hover:text-charcoal transition-colors mb-2"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                            <span className="text-sm font-medium tracking-wide uppercase">Return to Dashboard</span>
                        </button>

                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-charcoal serif mb-6 tracking-tight">The Eternal Archive</h2>
                            <p className="text-lg text-stone-600 leading-relaxed font-serif italic max-w-xl">
                                "The Bhagavad Gita is more than a scripture; it is a dialogue between the finite and the infinite. Preserved here are 700 verses of timeless wisdom. An eternal archive of duty, clarity, and the path to inner freedom."
                            </p>
                        </div>
                    </div>
                    <BookOpen size={64} strokeWidth={1} className="text-stone-300 hidden md:block" />
                </div>

                {/* Search Bar */}
                <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by keyword, verse (2.47), or speaker..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearching(e.target.value.length > 0);
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-stone-warm rounded-xl text-charcoal placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-saffron-accent/20 focus:border-saffron-accent/50 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setIsSearching(false); }}
                            className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {!isSearching && (
                    /* Tab Navigation */
                    <div className="flex space-x-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200 w-full md:w-auto inline-flex">
                        <button
                            onClick={() => {
                                setViewMode('chapters');
                                setSelectedTheme(null);
                            }}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${viewMode === 'chapters'
                                ? 'bg-white text-charcoal shadow-sm ring-1 ring-black/5'
                                : 'text-stone-500 hover:text-charcoal'
                                }`}
                        >
                            Chapters
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('themes');
                                setExpandedChapter(null);
                            }}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${viewMode === 'themes'
                                ? 'bg-white text-charcoal shadow-sm ring-1 ring-black/5'
                                : 'text-stone-500 hover:text-charcoal'
                                }`}
                        >
                            Themes
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="pb-12 min-h-[60vh]">
                {isSearching ? renderSearchResults() : (viewMode === 'chapters' ? renderChapterView() : renderThemeView())}
            </div>

            {/* Verse Detail Modal */}
            {selectedVerse && createPortal(
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedVerse(null)}
                >
                    {(() => {
                        const currentIndex = GITA_VERSES.findIndex(v => v.id === selectedVerse.id);
                        const hasPrev = currentIndex > 0;
                        const hasNext = currentIndex < GITA_VERSES.length - 1;

                        return (
                            <>
                                {hasPrev && (
                                    <button
                                        className="fixed left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-60"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVerse(GITA_VERSES[currentIndex - 1]);
                                        }}
                                        aria-label="Previous verse"
                                    >
                                        <ChevronLeft size={48} />
                                    </button>
                                )}
                                {hasNext && (
                                    <button
                                        className="fixed right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-60"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVerse(GITA_VERSES[currentIndex + 1]);
                                        }}
                                        aria-label="Next verse"
                                    >
                                        <ChevronRight size={48} />
                                    </button>
                                )}
                            </>
                        );
                    })()}

                    <div
                        key={selectedVerse.id}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#EFE6D8] border border-[#D8CBB5] rounded-3xl p-5 md:p-10 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col mx-0 md:mx-12"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <span className="text-xs font-bold text-saffron-accent uppercase tracking-widest">
                                    {selectedVerse.reference}
                                </span>
                                <h3 className="text-xl font-semibold text-charcoal mt-1">
                                    {CHAPTERS.find(c => c.number === selectedVerse.chapter)?.name}
                                </h3>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(selectedVerse);
                                    }}
                                    className="p-2 rounded-full transition-colors text-stone-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Share Verse"
                                >
                                    <Share2 size={24} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookmark(selectedVerse);
                                    }}
                                    className={`p-2 rounded-full transition-colors ${bookmarkedVerses.has(selectedVerse.reference) ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}`}
                                >
                                    <Heart size={24} fill={bookmarkedVerses.has(selectedVerse.reference) ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Language Toggle */}
                            <div className="flex justify-center">
                                <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                                    <button
                                        onClick={() => setLanguage('EN')}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${language === 'EN'
                                            ? 'bg-white text-charcoal shadow-sm'
                                            : 'text-stone-400 hover:text-stone-600'
                                            }`}
                                    >
                                        ENGLISH
                                    </button>
                                    <button
                                        onClick={() => setLanguage('SA')}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${language === 'SA'
                                            ? 'bg-white text-saffron-accent shadow-sm'
                                            : 'text-stone-400 hover:text-stone-600'
                                            }`}
                                    >
                                        SANSKRIT
                                    </button>
                                    <button
                                        onClick={() => setLanguage('HI')}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${language === 'HI'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-stone-400 hover:text-stone-600'
                                            }`}
                                    >
                                        HINDI
                                    </button>
                                </div>
                            </div>

                            {/* Verse Content */}
                            {language === 'SA' ? (
                                <div className="bg-white/60 rounded-2xl p-8 border-l-4 border-saffron-accent shadow-sm min-h-[200px] flex items-center justify-center text-center">
                                    <p className="font-serif text-xl md:text-2xl text-charcoal-dark leading-relaxed whitespace-pre-wrap">
                                        {selectedVerse.sanskrit || "Sanskrit text unavailable."}
                                    </p>
                                </div>
                            ) : language === 'HI' ? (
                                <div className="bg-white/60 rounded-2xl p-8 border-l-4 border-saffron-accent shadow-sm min-h-[200px] flex items-center justify-center text-center">
                                    <p className="font-serif text-xl md:text-2xl text-charcoal-dark leading-relaxed whitespace-pre-wrap">
                                        {/* @ts-ignore */}
                                        {(hindiVerses as Record<string, string>)[`${selectedVerse.chapter}-${selectedVerse.verse}`] || "Hindi translation unavailable."}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white/60 rounded-2xl p-8 border-l-4 border-saffron-accent shadow-sm min-h-[200px] flex items-center justify-center">
                                    <p className="serif text-xl md:text-2xl italic text-charcoal-dark leading-relaxed w-full">
                                        <span className="font-bold text-xs text-stone-500 mr-2 not-italic uppercase block mb-2">{selectedVerse.speaker}</span>
                                        "{selectedVerse.text}"
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-white/40 rounded-2xl p-6 border border-stone-warm/50">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Scroll size={16} className="text-saffron-accent" />
                                        <h4 className="text-xs uppercase tracking-widest font-bold text-stone-600">
                                            Insight
                                        </h4>
                                    </div>

                                    <p className="text-base text-stone-700 leading-relaxed max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {/* @ts-ignore */}
                                        {(reflectionsData as Record<string, string>)[`${selectedVerse.chapter}.${selectedVerse.verse}`] || selectedVerse.reflection || "Insight pending..."}
                                    </p>
                                </div>

                                <div className="bg-white/40 rounded-2xl p-6">
                                    <h4 className="text-xs uppercase tracking-widest font-bold text-stone-600 mb-3">Themes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedVerse.themes.map(theme => (
                                            <span
                                                key={theme}
                                                className="px-3 py-1.5 bg-white/60 text-stone-700 rounded-full text-xs font-medium capitalize border border-stone-warm/50"
                                            >
                                                {theme}
                                            </span>
                                        ))}
                                        {selectedVerse.themes.length === 0 && (
                                            <span className="text-xs text-stone-400 italic">No themes tagged</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedVerse(null)}
                            className="mt-8 w-full py-3 bg-saffron-accent/10 hover:bg-saffron-accent/20 text-saffron-accent rounded-2xl font-medium transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {showShareModal && verseToShare && (
                <ShareModal
                    verse={verseToShare}
                    onClose={() => {
                        setShowShareModal(false);
                        setVerseToShare(null);
                    }}
                    // @ts-ignore
                    customReflection={(reflectionsData as Record<string, string>)[`${verseToShare.chapter}.${verseToShare.verse}`]}
                />
            )}
        </div>
    );
};

export default Library;
