
import React from 'react';
import { AppSettings, LanguageLevel } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onBack }) => {
  const levels = [
    { id: LanguageLevel.SIMPLE, label: 'Simple', desc: 'Concrete and direct language.' },
    { id: LanguageLevel.MODERATE, label: 'Moderate', desc: 'Modern and clear language.' },
    { id: LanguageLevel.ORIGINAL, label: 'Original', desc: 'Formal and classical reasoning.' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="text-stone-600 hover:text-charcoal transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
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
                className={`w-full flex flex-col items-start p-4 rounded-xl transition-all ${
                  settings.languageLevel === level.id
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

        <section className="bg-white border border-stone-warm rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-charcoal">Supporting verses</h4>
              <p className="text-xs text-stone-600 italic">Show Gita references in AI guidance.</p>
            </div>
            <button 
              onClick={() => onUpdate({ ...settings, showSupportingVerses: !settings.showSupportingVerses })}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.showSupportingVerses ? 'bg-olive' : 'bg-[#BDB8AE]'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.showSupportingVerses ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
