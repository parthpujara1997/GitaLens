import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { analyzePatterns, PatternInsight } from '../services/patternAnalysis';
import { InnerCheckIn } from '../types';
import { Compass, Leaf, Calendar, Waves } from 'lucide-react';

const CompassPatterns: React.FC = () => {
    const [stats, setStats] = useState<PatternInsight | null>(null);
    const [checkIns, setCheckIns] = useState<InnerCheckIn[]>([]);

    useEffect(() => {
        const data = storageService.getInnerCheckIns();
        setCheckIns(data);
        const analysis = analyzePatterns(data);
        setStats(analysis);
    }, []);

    if (!stats || checkIns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-stone-500 animate-in fade-in">
                <Compass size={48} className="mb-4 text-stone-300" />
                <h3 className="text-lg font-serif text-charcoal mb-2">No Reflections Yet</h3>
                <p className="text-sm max-w-xs text-stone-400">Your inner journey will appear here as you begin to pause and reflect.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-lg font-serif text-charcoal">Your Emotional Landscape</h2>
                <p className="text-xs text-stone-500 mt-1">Patterns arising from your inner check-ins.</p>
            </div>

            {/* Header Cards */}
            {/* Header Cards */}
            <div className="w-full">
                <div className="bg-stone-neutral/30 p-5 rounded-2xl border border-stone-warm/50">
                    <div className="flex items-center space-x-2 mb-3 text-stone-500">
                        <Waves size={16} className="text-ocean" />
                        <span className="text-[10px] uppercase tracking-widest font-medium">Recurring Theme</span>
                    </div>
                    {stats.topState ? (
                        <div>
                            <p className="text-xl font-serif text-charcoal capitalize">{stats.topState.state}</p>
                            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                                A feeling that has surfaced repeatedly in your recent pauses.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-stone-400 italic">Gathering insights...</p>
                    )}
                </div>
            </div>

            {/* Recent History List */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2 text-stone-600 px-1">
                    <Leaf size={16} />
                    <h3 className="text-sm font-medium uppercase tracking-widest">Recent Reflections</h3>
                </div>

                <div className="relative border-l border-stone-200 ml-2 space-y-6 py-2">
                    {checkIns.slice(0, 5).map((checkIn) => (
                        <div key={checkIn.id} className="relative pl-6 group">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-stone-300 group-hover:border-charcoal transition-colors" />

                            <div className="flex flex-col items-start">
                                <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mb-1">
                                    {new Date(checkIn.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} • {checkIn.timeBand}
                                </span>
                                <div className="p-4 w-full bg-white rounded-xl border border-stone-warm shadow-sm group-hover:shadow-md transition-all">
                                    <p className="text-sm text-charcoal leading-relaxed">
                                        You felt <span className="font-medium font-serif italic">{checkIn.state}</span> and sought <span className="font-medium font-serif italic lowercase">{checkIn.direction}</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {checkIns.length > 5 && (
                <div className="text-center pt-2">
                    <p className="text-[10px] text-stone-400 italic">"Ideally, the mind should be like a lamp in a windless place."</p>
                </div>
            )}
        </div>
    );
};

export default CompassPatterns;
