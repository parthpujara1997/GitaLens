import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, InteractionMode, LanguageLevel } from '../types';
import { getGuidance } from '../services/aiService';
import { storageService } from '../services/storageService';
import { Compass, ArrowLeft, Bookmark, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SeekGuidanceProps {
  settings: AppSettings;
  onNavigate: (view: any) => void;
}

const SeekGuidance: React.FC<SeekGuidanceProps> = ({ settings: initialSettings, onNavigate }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.UNDECIDED);
  const [showChoices, setShowChoices] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [shouldSave, setShouldSave] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, showChoices]);

  const handleLanguageChange = (level: LanguageLevel) => {
    const newSettings = { ...settings, languageLevel: level };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    setShowLevelMenu(false);
  };

  const callBackend = async (text: string, historyOverride?: typeof messages) => {
    const response = await getGuidance(
      text,
      `Mode: ${mode}, Language: ${settings.languageLevel}, Verses: ${settings.showSupportingVerses}`,
      (historyOverride || messages).map(m => ({
        role: m.role,
        content: m.content
      }))
    );
    return response.text;
  };

  const endSession = async () => {
    if (messages.length === 0 || !shouldSave) {
      onNavigate('DASHBOARD');
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
      onNavigate('DASHBOARD');
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
      setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
      setInput('');
    }

    setLoading(true);
    setShowChoices(false);

    try {
      const aiText = await callBackend(messageToSend);
      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      if (mode === InteractionMode.UNDECIDED) {
        setShowChoices(true);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: 'Unable to reach the guidance service.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (selectedMode: InteractionMode) => {
    setMode(selectedMode);
    setShowChoices(false);

    const choiceText =
      selectedMode === InteractionMode.EXPLORE
        ? 'I want to talk this through.'
        : 'I want to receive guidance.';

    const updatedHistory = [...messages, { role: 'user', content: choiceText }];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const aiText = await callBackend(
        `User selected ${selectedMode}. Continue accordingly.`,
        updatedHistory
      );
      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
    } finally {
      setLoading(false);
    }
  };

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
                {[LanguageLevel.SIMPLE, LanguageLevel.MODERATE, LanguageLevel.ORIGINAL].map(level => (
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

        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 border ${m.role === 'user' ? 'bg-indigo text-white border-indigo' : 'bg-white text-charcoal shadow-sm border-stone-warm/30'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}

        {showChoices && (
          <div className="flex flex-col space-y-3 pt-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold text-center">How shall we proceed?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChoice(InteractionMode.EXPLORE)}
                className="px-4 py-3 bg-white border border-stone-warm rounded-xl text-sm font-medium hover:border-saffron-accent transition-all"
              >
                Talk this through
              </button>
              <button
                onClick={() => handleChoice(InteractionMode.GUIDANCE)}
                className="px-4 py-3 bg-white border border-stone-warm rounded-xl text-sm font-medium hover:border-saffron-accent transition-all"
              >
                Receive guidance
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl px-5 py-4 border border-stone-warm/30 animate-pulse">
              <p className="text-sm text-stone-400 italic">Anticipating wisdom...</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading || showChoices}
          placeholder="What's weighing on your mind?"
          className="w-full px-5 py-4 bg-stone-50 border border-stone-warm/50 rounded-2xl text-sm focus:outline-none focus:border-saffron-accent transition-all placeholder:text-stone-400"
        />
      </form>
    </div>
  );
};

export default SeekGuidance;
