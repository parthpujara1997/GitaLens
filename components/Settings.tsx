
import React from 'react';
import { AppSettings, LanguageLevel } from '../types';
import { useTour } from '../contexts/TourContext';
import { Sparkles } from 'lucide-react'; // Assuming Sparkles icon is available

interface SettingsProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
    onBack: () => void;
    onRestartTour?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onBack, onRestartTour }) => {
    const { startTour } = useTour();
    const levels = [
        { id: LanguageLevel.MODERN, label: 'Modern', desc: 'Clear, grounded, contemporary language.' },
        { id: LanguageLevel.ORIGINAL, label: 'Original', desc: 'Profound, nuanced, and poetic.' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
                <button onClick={onBack} className="text-stone-600 hover:text-charcoal transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h2 className="text-2xl font-semibold text-charcoal serif">Settings</h2>
            </div>

            <div className="space-y-6">
                <section className="bg-stone-neutral border border-stone-warm rounded-2xl p-6 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-6">Language Mode</h3>
                    <div className="space-y-2">
                        {levels.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => onUpdate({ ...settings, languageLevel: level.id })}
                                className={`w-full flex flex-col items-start p-4 rounded-xl transition-all ${settings.languageLevel === level.id
                                    ? 'bg-indigo-active text-[#F3F0EA] shadow-md'
                                    : 'bg-white/50 text-[#6E6B64] border border-stone-warm hover:border-stone'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <span className={`font-medium text-sm`}>
                                        {level.label}
                                    </span>
                                    {settings.languageLevel === level.id && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F3F0EA]" />
                                    )}
                                </div>
                                <span className={`text-[11px] text-left leading-relaxed opacity-70`}>
                                    {level.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>


                <section className="bg-stone-neutral border border-stone-warm rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-1">Guided Tour</h3>
                            <p className="text-xs text-stone-500">Revisit the introduction to GitaLens.</p>
                        </div>
                        <button
                            onClick={() => {
                                startTour();
                                // Allow a tiny yield to ensure state update propagates, though usually not strictly necessary with React 18 auto-batching, 
                                // but safe to run navigation immediately after state set.
                                if (onRestartTour) {
                                    onRestartTour();
                                } else {
                                    onBack();
                                }
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-stone-warm rounded-xl text-xs font-semibold text-stone-600 hover:text-charcoal hover:shadow-sm transition-all"
                        >
                            <Sparkles size={14} className="text-saffron-deep" />
                            <span>Restart Tour</span>
                        </button>
                    </div>
                </section>
            </div >
        </div >
    );
};

export default Settings;
