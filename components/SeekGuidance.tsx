import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, InteractionMode, LanguageLevel } from '../types';
import { getGuidance } from '../services/aiService';
import { storageService } from '../services/storageService';
import { Compass, ArrowLeft, Bookmark, Check, Quote, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getVerse } from '../gitaData';

interface SeekGuidanceProps {
  settings: AppSettings;
  onNavigate: (view: any) => void;
  initialMessages: { role: 'user' | 'ai'; content: string }[];
  onUpdateMessages: (messages: { role: 'user' | 'ai'; content: string }[]) => void;
  onEndSession: () => void;
}

const SeekGuidance: React.FC<SeekGuidanceProps> = ({ settings: initialSettings, onNavigate, initialMessages, onUpdateMessages, onEndSession }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [input, setInput] = useState('');
  const messages = initialMessages; // Use prop directly
  const [loading, setLoading] = useState(false);

  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [shouldSave, setShouldSave] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [readingVerse, setReadingVerse] = useState<{ chapter: number; verse: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleLanguageChange = (level: LanguageLevel) => {
    const newSettings = { ...settings, languageLevel: level };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setShowLevelMenu(false);
  };

  const callBackend = async (text: string, historyOverride?: typeof messages) => {
    const response = await getGuidance(
      text,
      `Language: ${settings.languageLevel}`,
      (historyOverride || messages).map(m => ({
        role: m.role,
        content: m.content
      }))
    );
    return response.text;
  };

  const endSession = async () => {
    if (messages.length === 0 || !shouldSave) {
      onEndSession();
      return;
    }

    // Identify a topic from the first message
    const firstMsg = messages.find(m => m.role === 'user')?.content || 'Guidance Session';
    const topic = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? '...' : '');

    // Create a simple summary from the last AI message
    const lastAI = [...messages].reverse().find(m => m.role === 'ai')?.content || 'No wisdom received.';
    const summary = lastAI.slice(0, 200) + (lastAI.length > 200 ? '...' : '');

    if (user) {
      await supabase.from('history').insert({
        user_id: user.id,
        topic,
        summary,
        date: new Date().toISOString()
      });
      onNavigate('HISTORY');
    } else {
      // Guests don't save history session data anymore to maintain exclusivity
      onEndSession();
    }
  };

  const handleToggleSave = () => {
    if (!user) {
      // Prompt login for guests trying to save
      // We need a way to trigger the auth modal from here too.
      // But since onNavigate is passed, we can just navigate to dashboard and it won't save.
      // Actually, let's just show a toast or alert for now if we don't want to pass onAuthRequired everywhere.
      alert('Please sign in to save your guidance history!');
      return;
    }
    const nextState = !shouldSave;
    setShouldSave(nextState);
    if (nextState) {
      setToast('Summary will be saved after the session.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const messageToSend = overrideInput || input.trim();
    if (!messageToSend || loading) return;

    if (!overrideInput) {
      onUpdateMessages([...messages, { role: 'user', content: messageToSend }]);
      setInput('');
    }

    setLoading(true);

    try {
      const aiText = await callBackend(messageToSend);
      onUpdateMessages([...messages, { role: 'user', content: messageToSend }, { role: 'ai', content: aiText }]);
    } catch {
      onUpdateMessages([
        ...messages,
        { role: 'user', content: messageToSend },
        { role: 'ai', content: 'Unable to reach the guidance service.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const findVerseReference = (text: string): { chapter: number; verse: number } | null => {
    // Look for patterns like "Chapter 2, Verse 47" or "2.47"
    const match = text.match(/Chapter (\d+), Verse (\d+)/i);
    if (match) {
      return { chapter: parseInt(match[1]), verse: parseInt(match[2]) };
    }
    return null;
  };

  // Import locally to avoid circular dependency issues if they arise, or assuming gitaData is available
  // We'll trust the gitaData import availability.
  // We need to import getVerse. Since we can't easily add top-level imports with multi_replace without context,
  // we will assume the file already imports what it needs or I'll add the import in a separate chunk.




  return (
    <div className="flex flex-col h-[75vh] md:h-[80vh] w-full max-w-xl mx-auto bg-white rounded-2xl border overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-stone-50">
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('DASHBOARD')} className="text-stone-400 hover:text-stone-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h3 className="text-xs uppercase tracking-widest font-bold text-stone-500">Guidance</h3>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowLevelMenu(!showLevelMenu)}
              className="px-3 py-1.5 border hover:bg-white rounded-full text-[10px] uppercase font-bold text-stone-600 transition-colors"
            >
              {settings.languageLevel}
            </button>

            {showLevelMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-stone-warm rounded-xl p-1 shadow-lg z-10 transition-all">
                {[LanguageLevel.MODERN, LanguageLevel.ORIGINAL].map(level => (
                  <button
                    key={level}
                    onClick={() => handleLanguageChange(level)}
                    className="w-full text-left px-3 py-2 text-[10px] uppercase font-medium hover:bg-stone-50 rounded-lg"
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleToggleSave}
            className={`p-1.5 rounded-full transition-all ${shouldSave ? 'text-saffron-accent bg-saffron-accent/10' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
            title={shouldSave ? "Conversation will be saved" : "Save conversation summary"}
          >
            <Bookmark size={18} fill={shouldSave ? "currentColor" : "none"} />
          </button>

          <button
            onClick={endSession}
            className="px-3 py-1.5 bg-saffron-accent/10 text-saffron-accent hover:bg-saffron-accent/20 rounded-full text-[10px] uppercase font-bold transition-all"
          >
            End
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-stone-50/30 relative">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="absolute bottom-6 left-1/2 z-20 bg-charcoal text-white text-[11px] font-medium px-4 py-2 rounded-full shadow-xl flex items-center space-x-2 whitespace-nowrap"
            >
              <Check size={12} className="text-saffron-accent" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
            <Compass size={48} className="text-stone-300" />
            <p className="text-stone-400 serif italic">Seek clarity through the timeless<br />wisdom of the Gita.</p>
          </div>
        )}

        {messages.map((m, idx) => {
          const verseRef = m.role === 'ai' ? findVerseReference(m.content) : null;

          return (
            <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 border ${m.role === 'user' ? 'bg-indigo text-white border-indigo' : 'bg-white text-charcoal shadow-sm border-stone-warm/30'}`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>

              {m.role === 'ai' && verseRef && (
                <button
                  onClick={() => setReadingVerse(verseRef)}
                  className="ml-2 flex items-center space-x-2 px-4 py-2 bg-saffron-light/20 hover:bg-saffron-light/30 border border-saffron-accent/20 rounded-full transition-colors group"
                >
                  <span className="text-xs font-bold text-saffron-dark uppercase tracking-wide">Read related verse</span>
                  <div className="w-4 h-4 rounded-full bg-saffron-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowLeft size={10} className="rotate-180 text-saffron-dark" />
                  </div>
                </button>
              )}
            </div>
          );
        })}



        {loading && (
          <div className="flex justify-start">
            <div className={`bg-white/50 backdrop-blur-sm rounded-2xl px-5 py-4 border border-stone-warm/30 ${loading ? 'animate-pulse' : ''}`}>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>





      <AnimatePresence>
        {readingVerse && (
          <VerseModal
            chapter={readingVerse.chapter}
            verse={readingVerse.verse}
            onClose={() => setReadingVerse(null)}
            onOpenLibrary={() => onNavigate('LIBRARY')}
          />
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's on your mind..."
            className="w-full px-5 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-full text-sm focus:outline-none focus:border-saffron-accent focus:ring-1 focus:ring-saffron-accent transition-all placeholder:text-stone-400 placeholder:italic"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 bg-charcoal text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black transition-all"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div >

  );
};

interface VerseModalProps {
  chapter: number;
  verse: number;
  onClose: () => void;
  onOpenLibrary: () => void;
}

const VerseModal: React.FC<VerseModalProps> = ({ chapter, verse, onClose, onOpenLibrary }) => {
  const verseData = getVerse(chapter, verse);

  if (!verseData) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
          <h3 className="font-serif text-lg text-charcoal">
            Chapter {chapter}, Verse {verse}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenLibrary}
              className="text-[10px] uppercase font-bold tracking-wider text-saffron-dark hover:text-saffron-light transition-colors px-2 py-1"
            >
              Open Library
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Quote className="text-saffron-accent/40 w-8 h-8" />
            <p className="font-serif text-xl leading-relaxed text-charcoal">
              {verseData.text}
            </p>
          </div>

          <div className="bg-stone-50 p-5 rounded-xl border border-stone-warm/50">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Reflection</h4>
            <p className="text-sm text-stone-600 leading-relaxed">
              {verseData.reflection}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {verseData.themes.map(theme => (
              <span key={theme} className="px-2 py-1 bg-stone-100 text-stone-500 text-[10px] uppercase tracking-wider font-bold rounded">
                {theme}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SeekGuidance;
