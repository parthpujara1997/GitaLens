import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface JournalProps {
  onComplete?: () => void;
  onAuthRequired: (mode: 'login' | 'signup') => void;
}

const Journal: React.FC<JournalProps> = ({ onComplete, onAuthRequired }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      fetchEntries();
    }
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

  const handleSave = async () => {
    if (!content.trim()) return;

    if (!user) {
      onAuthRequired('signup');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('journal').insert({
        user_id: user.id,
        content: content,
        date: new Date().toISOString()
      });

      if (error) throw error;

      setContent('');
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error saving journal:', err);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-xl mx-auto">
      <div className="text-center md:text-left mb-6">
        <h2 className="text-3xl font-semibold text-charcoal serif">Journal</h2>
        <p className="text-stone-500 text-sm italic">Capture your inner dialogue.</p>
      </div>

      <section className="bg-white border border-stone-warm rounded-2xl p-6 shadow-sm">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="How are you observing your mind today?"
          className="w-full h-64 p-4 bg-parchment/30 border border-stone-warm rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron-accent text-charcoal text-sm resize-none transition-all placeholder:italic placeholder:text-stone-400"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
            className="px-8 py-3 bg-clay text-[#F4F1EC] text-sm font-medium rounded-xl hover:bg-clay-hover disabled:bg-stone-warm transition-all shadow-lg shadow-clay/10"
          >
            {isSaving ? 'Storing...' : 'Store Reflection'}
          </button>
        </div>
      </section>

      {user && entries.length > 0 && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-xs uppercase tracking-widest font-bold text-stone-500 px-2">Recent Reflections</h3>
          <div className="space-y-3">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-sm border border-stone-warm/30 rounded-2xl p-5 hover:bg-white/80 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-charcoal text-sm leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="p-6 bg-parchment-bubble/50 border border-stone-warm/30 rounded-2xl">
        <p className="text-stone-500 text-xs leading-relaxed text-center">
          "The mind is the friend of the conditioned soul, and his enemy as well."
          <span className="block mt-1 font-semibold uppercase tracking-tighter opacity-60">Chapter 6, Verse 5</span>
        </p>
      </div>
    </div>
  );
};

export default Journal;