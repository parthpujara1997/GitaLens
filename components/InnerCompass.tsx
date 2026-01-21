
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InnerState, InnerDirection, TimeBand, InnerCheckIn } from '../types';
import { storageService } from '../services/storageService';
import { Check } from 'lucide-react';

interface InnerCompassProps {
    onComplete?: () => void;
    isAuthenticated: boolean;
    onAuthRequired: (mode: 'login' | 'signup') => void;
}

type Step = 'GREETING' | 'STATE_SELECTION' | 'DIRECTION_SELECTION' | 'REFLECTION' | 'PAUSE' | 'COMPLETED';

const InnerCompass: React.FC<InnerCompassProps> = ({ onComplete, isAuthenticated, onAuthRequired }) => {
    const [step, setStep] = useState<Step>('GREETING');
    const [timeBand, setTimeBand] = useState<TimeBand>(TimeBand.MIDDAY);
    const [selectedState, setSelectedState] = useState<InnerState | null>(null);
    const [selectedDirection, setSelectedDirection] = useState<InnerDirection | null>(null);
    const [reflection, setReflection] = useState<string>('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) setTimeBand(TimeBand.EARLY);
        else if (hour >= 11 && hour < 16) setTimeBand(TimeBand.MIDDAY);
        else if (hour >= 16 && hour < 21) setTimeBand(TimeBand.LATE);
        else setTimeBand(TimeBand.NIGHT);

        const checkIns = storageService.getInnerCheckIns();
        const today = new Date().toISOString().split('T')[0];
        const todaysCheckIn = checkIns.find(c => c.date.split('T')[0] === today);
        if (todaysCheckIn) {
            setStep('COMPLETED');
        }
    }, []);

    const getGreeting = () => {
        switch (timeBand) {
            case TimeBand.EARLY: return "How is today starting for you?";
            case TimeBand.MIDDAY: return "How is your day unfolding?";
            case TimeBand.LATE: return "How is your day going so far?";
            case TimeBand.NIGHT: return "How are things sitting with you?";
        }
    };

    const getMovingOnText = () => {
        switch (timeBand) {
            case TimeBand.EARLY: return "Before moving on, notice what is actually required of you today.";
            case TimeBand.MIDDAY: return "Before moving back, notice if you need to adjust your pace for the afternoon.";
            case TimeBand.LATE: return "As the day winds down, notice what can be left for tomorrow.";
            case TimeBand.NIGHT: return "Before rest, allow yourself to release the weight of today.";
        }
    };

    const states = Object.values(InnerState);
    const directions = Object.values(InnerDirection);

    const handleStateSelect = (state: InnerState) => {
        setSelectedState(state);
        setStep('DIRECTION_SELECTION');
    };

    const handleDirectionSelect = (direction: InnerDirection) => {
        setSelectedDirection(direction);
        // Simple mock reflection logic for now - can be enhanced later
        setReflection(getReflection(selectedState!, direction));
        setStep('REFLECTION');
    };

    // State Groups
    const stateGroups = {
        [InnerState.PRESSURED]: 'A', [InnerState.ANXIOUS]: 'A', [InnerState.OVERTHINKING]: 'A', [InnerState.RESTLESS]: 'A',
        [InnerState.DRAINED]: 'B', [InnerState.NUMB]: 'B',
        [InnerState.CALM]: 'C', [InnerState.CLEAR]: 'C', [InnerState.FOCUSED]: 'C', [InnerState.CONTENT]: 'C',
        [InnerState.MOTIVATED]: 'D'
    };

    // Direction Groups
    const directionGroups = {
        [InnerDirection.STUCK]: '1', [InnerDirection.UNCLEAR]: '1',
        [InnerDirection.OVERWHELMED]: '2', [InnerDirection.BEHIND]: '2',
        [InnerDirection.ON_TRACK]: '3', [InnerDirection.AT_EASE]: '3'
    };

    const getReflection = (state: InnerState, direction: InnerDirection) => {
        const sGroup = stateGroups[state];
        const dGroup = directionGroups[direction];
        const key = `${sGroup}-${dGroup}`;

        const observations: Record<string, string[]> = {
            // A: High Inner Load (Pressured, Anxious...) + 1: Blocked (Stuck, Unclear)
            'A-1': [
                "Pressure tends to increase when effort moves ahead of clarity.",
                "When thinking loops without movement, the mind starts carrying weight it can't resolve.",
                "High inner tension often signals that the path ahead needs simplifying, not forcing.",
                "Anxiety rises when the drive to act meets a wall of ambiguity."
            ],
            // A: High Inner Load + 2: Overloaded (Overwhelmed, Behind)
            'A-2': [
                "Focus helps narrow attention, but pressure often comes from the clock, not the task.",
                "When the list is longer than the day, the mind tries to solve time by speeding up.",
                "Restlessness is often just energy that doesn't know where to land yet.",
                "Your inner state is responding to the volume of demands, not your ability to handle them."
            ],
            // A: High Inner Load + 3: Stable (On track, At ease)
            'A-3': [
                "Even when things are on track, the mind can stay in a habit of vigilance.",
                "Sometimes the outer world settles down before the inner world trusts it's safe to rest.",
                "You are moving forward, but your nervous system is still expecting resistance.",
                "Momentum is present, but the internal engine is running a bit hot."
            ],

            // B: Low Energy (Drained, Numb) + 1: Blocked (Stuck, Unclear)
            'B-1': [
                "When nothing feels accessible, movement often pauses on its own.",
                "A lack of clarity can be exhausting because the mind keeps searching for a foothold.",
                "Being stuck while drained is often a request for rest, not better strategy.",
                "Numbness is sometimes just the mind's way of asking for a break from processing."
            ],
            // B: Low Energy + 2: Overloaded (Overwhelmed, Behind)
            'B-2': [
                "Low energy makes even reasonable demands feel heavier than they are.",
                "When reserves are low, the feeling of being behind is magnified.",
                "Overwhelm happens when the input exceeds the current battery level.",
                "Your capacity is temporarily reduced, making the usual load feel surprisingly heavy."
            ],
            // B: Low Energy + 3: Stable (On track, At ease)
            'B-3': [
                "You are moving in the right direction, but doing so on a low battery.",
                "Things are working, but it implies a cost to your energy reserves right now.",
                "Success is present, but enjoyment might be muted by fatigue.",
                "It is possible to be on track and still need deep restoration."
            ],

            // C: Stable (Calm, Focused...) + 1: Blocked (Stuck, Unclear)
            'C-1': [
                "Calmness in the face of uncertainty is a powerful form of clarity.",
                "You have the steadiness to wait for the path to reveal itself.",
                "Being unclear doesn't have to mean being unsettled.",
                "A quiet mind can tolerate being stuck without turning it into a problem."
            ],
            // C: Stable + 2: Overloaded (Overwhelmed, Behind)
            'C-2': [
                "You are facing a lot, but you aren't becoming the chaos.",
                "There is a lot to do, but your center is holding.",
                "Being behind is a circumstance; remaining stuck is a reaction you are avoiding.",
                "High demands are present, but inner friction is luckily low."
            ],
            // C: Stable + 3: Stable (On track, At ease)
            'C-3': [
                "When inner noise is low and direction is steady, effort usually feels lighter.",
                "This is the dynamic where growth happens with the least resistance.",
                "Alignment between state and direction creates a quiet kind of power.",
                "Enjoy this rhythm; it is the natural result of balance."
            ],

            // D: Forward Energy (Motivated) + 1: Blocked (Stuck, Unclear)
            'D-1': [
                "Drive without direction can feel urgent without feeling satisfying.",
                "Motivation needs a target, or it turns into restlessness.",
                "You have the fuel, but the map is currently missing.",
                "The energy is ready, but the path hasn't opened up yet."
            ],
            // D: Forward Energy + 2: Overloaded (Overwhelmed, Behind)
            'D-2': [
                "Motivation to catch up is good, but check if it's burning cleaner than panic.",
                "You are ready to tackle the mountain, even if it looks tall.",
                "The gap between where you are and where you want to be is fueling you.",
                "High drive helps clear the backlog, provided you don't burn out."
            ],
            // D: Forward Energy + 3: Stable (On track, At ease)
            'D-3': [
                "This is the sweet spot where intention and reality move together.",
                "You are moving forward, and the path is rising to meet you.",
                "Motivation flows easily when the friction of the path is removed.",
                "Ride this wave; it’s the definition of flow."
            ]
        };

        const pool = observations[key] || ["Notice how your inner state interacts with your day."];
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const handlePauseComplete = () => {
        if (selectedState && selectedDirection) {
            const checkIn: InnerCheckIn = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                timestamp: Date.now(),
                timeBand,
                state: selectedState,
                direction: selectedDirection,
                reflection: reflection
            };
            storageService.saveInnerCheckIn(checkIn);
            setStep('COMPLETED');
            if (onComplete) onComplete();
        }
    };

    const todaysCheckIn = step === 'COMPLETED' ? storageService.getInnerCheckIns().find(c => c.date.split('T')[0] === new Date().toISOString().split('T')[0]) : null;

    return (
        <div className="w-full max-w-xl mx-auto">
            <AnimatePresence mode="wait">
                {/* ... existing steps ... */}
                {step === 'GREETING' && (
                    <motion.div
                        key="greeting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white/60 backdrop-blur-md border border-stone/30 rounded-2xl p-8 text-center shadow-sm"
                    >
                        <h3 className="serif text-2xl text-charcoal mb-6">{getGreeting()}</h3>
                        <button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    onAuthRequired('signup');
                                    return;
                                }
                                setStep('STATE_SELECTION');
                            }}
                            className="bg-clay text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-clay-hover transition-colors"
                        >
                            Begin Check-in
                        </button>
                    </motion.div>
                )}

                {step === 'STATE_SELECTION' && (
                    <motion.div
                        key="state"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white/60 backdrop-blur-md border border-stone/30 rounded-2xl p-6 shadow-sm"
                    >
                        <h4 className="text-center text-stone-500 text-xs uppercase tracking-widest mb-6">Select your inner state</h4>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {states.map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleStateSelect(s)}
                                    className="px-4 py-2 rounded-lg bg-white/50 border border-stone/20 text-stone-600 hover:bg-stone-warm hover:text-charcoal transition-all text-sm"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'DIRECTION_SELECTION' && (
                    <motion.div
                        key="direction"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white/60 backdrop-blur-md border border-stone/30 rounded-2xl p-6 shadow-sm"
                    >
                        <h4 className="text-center text-stone-500 text-xs uppercase tracking-widest mb-6">How does life feel right now?</h4>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {directions.map(d => (
                                <button
                                    key={d}
                                    onClick={() => handleDirectionSelect(d)}
                                    className="px-4 py-2 rounded-lg bg-white/50 border border-stone/20 text-stone-600 hover:bg-stone-warm hover:text-charcoal transition-all text-sm"
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'REFLECTION' && (
                    <motion.div
                        key="reflection"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white/60 backdrop-blur-md border border-stone/30 rounded-2xl p-8 text-center shadow-sm"
                    >
                        <p className="serif text-xl italic text-charcoal mb-8 leading-relaxed">
                            "{reflection}"
                        </p>
                        <div className="w-16 h-[1px] bg-stone-300 mx-auto my-6" />
                        <p className="text-stone-500 text-sm mb-6">
                            {getMovingOnText()}
                        </p>
                        <button
                            onClick={handlePauseComplete}
                            className="text-stone-400 hover:text-stone-600 text-xs uppercase tracking-widest transition-colors"
                        >
                            Continue
                        </button>
                    </motion.div>
                )}

                {step === 'COMPLETED' && todaysCheckIn && (
                    <motion.div
                        key="completed"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/60 backdrop-blur-md border border-stone/30 rounded-2xl p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                            <Check size={24} />
                        </div>
                        <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Today's check recorded</p>
                        <div className="flex items-center space-x-2 mb-6 text-charcoal font-medium italic">
                            <span>{todaysCheckIn.state}</span>
                            <span className="text-stone-300">|</span>
                            <span>{todaysCheckIn.direction}</span>
                        </div>
                        <p className="serif text-lg italic text-[#5A5246] leading-relaxed mb-4">
                            "{todaysCheckIn.reflection}"
                        </p>

                        <button
                            onClick={() => setStep('STATE_SELECTION')}
                            className="text-stone-400 hover:text-stone-600 text-[10px] uppercase tracking-widest border-b border-transparent hover:border-stone-400 transition-all pb-0.5"
                        >
                            Update Response
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InnerCompass;
