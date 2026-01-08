import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trash } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

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

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

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
      fetchEntries(); // Refresh list
    } catch (err) {
      console.error('Error saving journal:', err);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEntryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      const { error } = await supabase
        .from('journal')
        .delete()
        .eq('id', entryToDelete);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== entryToDelete));
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Could not delete entry.');
    } finally {
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Reflection?"
        message="This action cannot be undone. Are you sure you want to delete this specific reflection?"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmLabel="Delete"
        isDestructive={true}
      />

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

        {user && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xs uppercase tracking-widest font-bold text-stone-500 px-2">Recent Reflections</h3>
            {entries.length === 0 ? (
              <div className="bg-white/40 border border-dashed border-stone-warm rounded-2xl p-8 text-center">
                <p className="text-stone-400 text-sm italic">Your past reflections will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 backdrop-blur-sm border border-stone-warm/30 rounded-2xl p-5 hover:bg-white/80 transition-colors group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={(e) => handleDeleteClick(entry.id, e)}
                        className="text-stone-300 hover:text-red-400 p-1.5 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Entry"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    <p className="text-charcoal text-sm leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="p-6 bg-parchment-bubble/50 border border-stone-warm/30 rounded-2xl">
          <p className="text-stone-500 text-xs leading-relaxed text-center">
            "The mind is the friend of the conditioned soul, and his enemy as well."
            <span className="block mt-1 font-semibold uppercase tracking-tighter opacity-60">Chapter 6, Verse 5</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Journal;