import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TourStep {
    targetId: string;
    mobileTargetId?: string; // Optional: different target for mobile layout
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    mobilePosition?: 'top' | 'bottom' | 'left' | 'right'; // Optional: different position for mobile
}

interface TourContextType {
    isActive: boolean;
    currentStepIndex: number;
    currentStep: TourStep | null;
    startTour: () => void;
    endTour: () => void;
    nextStep: () => void;
    skipTour: () => void;
    hasSeenTour: boolean;
    totalSteps: number;
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'daily-verse-card',
        title: 'Your Daily Anchor',
        description: 'Every morning, receive a unique verse and a deep reflection to center your mind before the day begins.',
        position: 'bottom'
    },
    {
        targetId: 'dashboard-card-guidance',
        title: 'Seek Guidance',
        description: 'Wisdom at your fingertips. Ask questions about life, dilemmas, or purpose, and receive guidance rooted directly in the Bhagavad Gita.',
        position: 'bottom'
    },
    {
        targetId: 'dashboard-card-compass',
        title: 'Check-in',
        description: 'Tune into your inner state. A quick daily check-in to recognize how you are feeling and find your center.',
        position: 'top'
    },
    {
        targetId: 'dashboard-card-journal',
        title: 'Journal & Reflect',
        description: 'Capture your thoughts. Save verses that resonate and record your own reflections to see how your clarity grows over time.',
        position: 'top'
    },
    {
        targetId: 'dashboard-card-lens',
        title: 'Lens Practice',
        description: 'Shift your perspective. A powerful tool to reframe difficult situations through the lens of Gita\'s wisdom.',
        position: 'top'
    },
    {
        targetId: 'dashboard-card-clarity',
        title: 'Clarity Chain',
        description: 'Untangle stress. Break down complex emotions step-by-step to detach from the story and regain your peace.',
        position: 'top'
    },
    {
        targetId: 'nav-library-desktop',
        mobileTargetId: 'nav-library-mobile',
        title: 'The Library',
        description: 'The full path. Explore every chapter and verse of the Gita at your own pace, with translations that speak to modern life.',
        position: 'right',
        mobilePosition: 'top'
    }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [hasSeenTour, setHasSeenTour] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem('gitalens_tour_seen');
        if (seen) {
            setHasSeenTour(true);
        } else {
            // Small delay on first load before showing the welcome prompt/tour
            // We'll manage the "Welcome" prompt in the Overlay component itself, 
            // but for now, we just initialize the state.
            // Logic: If not seen, application should eventually trigger the "Invite".
            // For now, we rely on the component using this context to check 'hasSeenTour'.
        }
    }, []);

    const startTour = () => {
        setIsActive(true);
        setCurrentStepIndex(0);
    };

    const endTour = () => {
        setIsActive(false);
        setCurrentStepIndex(0);
        localStorage.setItem('gitalens_tour_seen', 'true');
        setHasSeenTour(true);
    };

    const skipTour = () => {
        endTour();
    };

    const nextStep = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            endTour();
        }
    };

    return (
        <TourContext.Provider value={{
            isActive,
            currentStepIndex,
            currentStep: TOUR_STEPS[currentStepIndex],
            startTour,
            endTour,
            nextStep,
            skipTour,
            hasSeenTour,
            totalSteps: TOUR_STEPS.length
        }}>
            {children}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};
