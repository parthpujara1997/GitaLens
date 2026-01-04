
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { JournalEntry } from '../types';

const Reflections: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    setEntries(storageService.getJournalEntries());
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-xl mx-auto">
      <div className="text-center md:text-left mb-6">
        <h2 className="text-3xl font-semibold text-charcoal serif">Reflections</h2>
        <p className="text-stone-500 text-sm italic">Your past inner dialogues.</p>
      </div>

      <section className="space-y-4">
        {entries.length === 0 ? (
          <div className="bg-white border border-stone-warm rounded-2xl p-12 text-center">
            <p className="text-stone-400 text-sm italic">No reflections stored yet. Returning to silence can also be a step.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white border border-stone-warm/50 rounded-xl p-6 shadow-sm hover:border-stone-warm transition-colors group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest group-hover:text-stone-500 transition-colors">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-charcoal-dark text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Reflections;
