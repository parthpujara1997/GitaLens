import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '../../contexts/TourContext';
import { X, ChevronRight } from 'lucide-react';

const TourOverlay: React.FC = () => {
    const { isActive, currentStep, nextStep, skipTour, hasSeenTour, startTour, currentStepIndex, totalSteps } = useTour();
    const [targetRect, setTargetRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);

    // Initial check for welcome screen
    useEffect(() => {
        if (!hasSeenTour && !isActive) {
            // Slight delay to allow app to load visual check
            const timer = setTimeout(() => setShowWelcome(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [hasSeenTour, isActive]);

    useEffect(() => {
        if (isActive && currentStep) {
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds

            const findElement = () => {
                // Find the element by data-tour attribute which matches targetId
                const element = document.querySelector(`[data-tour="${currentStep.targetId}"]`);

                if (element) {
                    // Scroll into view if needed
                    element.scrollIntoView({ behavior: 'auto', block: 'center' });

                    // Wait for any layout shifts or animations
                    setTimeout(() => {
                        const rect = element.getBoundingClientRect();
                        // Add some padding
                        const padding = 16;
                        setTargetRect({
                            x: rect.left - padding,
                            y: rect.top - padding,
                            width: rect.width + (padding * 2),
                            height: rect.height + (padding * 2)
                        });
                    }, 300);
                } else {
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(findElement, 100);
                    } else {
                        setTargetRect(null); // Clear highlight if target not found
                    }
                }
            };

            findElement();
        }
    }, [isActive, currentStep]);

    // Resize handler
    // Resize & Scroll handler to keep highlight in sync
    useEffect(() => {
        const updateRect = () => {
            if (isActive && currentStep) {
                const element = document.querySelector(`[data-tour="${currentStep.targetId}"]`);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const padding = 16;
                    setTargetRect({
                        x: rect.left - padding,
                        y: rect.top - padding,
                        width: rect.width + (padding * 2),
                        height: rect.height + (padding * 2)
                    });
                }
            }
        };

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, { capture: true, passive: true }); // Capture needed for internal scrolling containers

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, { capture: true });
        };
    }, [isActive, currentStep]);


    // Welcome Modal
    if (showWelcome && !isActive) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#F2EFE9] rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-stone-100 text-center relative overflow-hidden"
                    >
                        {/* Accents */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-saffron-deep/20" />

                        <h2 className="text-2xl font-serif text-charcoal mb-4">Welcome to GitaLens</h2>
                        <p className="text-stone-600 mb-8 leading-relaxed">
                            Would you like a quick tour of how it works?
                        </p>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={() => {
                                    setShowWelcome(false);
                                    startTour();
                                }}
                                className="w-full py-3 bg-charcoal text-white rounded-xl font-medium tracking-wide shadow-lg hover:bg-black transition-all hover:-translate-y-0.5"
                            >
                                Start Tour
                            </button>
                            <button
                                onClick={() => {
                                    setShowWelcome(false);
                                    skipTour(); // Mark as seen
                                }}
                                className="w-full py-3 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium"
                            >
                                No thanks, I'll explore
                            </button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    if (!isActive || !currentStep || !targetRect) return null;

    // Calculate mask path for SVG
    // We create a path that covers the whole screen but has a 'hole' at the targetRect
    // M 0 0 h width v height h -width z (outer rect)
    // M x y h w v h h -w z (inner rect - reverse winding order to create hole?) 
    // Easier approach: Use a mask definition in SVG

    // Determine Tooltip Position
    // Simple logic: if target is on the left, put tooltip on right, etc.
    // For now, let's just float it near the center or contextually.

    // Intelligent Positioning Logic
    const isDeskTopSidebar = targetRect.x < 300 && targetRect.height > 400;
    // Smart Positioning Logic
    const viewportHeight = window.innerHeight;
    const estimatedTooltipHeight = 250;

    // Default: Below the target
    let tooltipStyle: React.CSSProperties = isDeskTopSidebar
        ? { left: targetRect.width + 40, top: targetRect.y + 100 }
        : { left: '50%', top: targetRect.y + targetRect.height + 20, transform: 'translateX(-50%)' };

    // Check if it overflows bottom
    const overflowsBottom = !isDeskTopSidebar && (targetRect.y + targetRect.height + estimatedTooltipHeight > viewportHeight - 20);

    if (overflowsBottom) {
        // Try to flip ABOVE
        // Check if there is space above (need targetRect.y > estimatedHeight + padding)
        const spaceAbove = targetRect.y > estimatedTooltipHeight + 20;

        if (spaceAbove) {
            // Flip to above: Position bottom of tooltip at top of target - 20px
            tooltipStyle = {
                left: '50%',
                bottom: viewportHeight - targetRect.y + 20,
                transform: 'translateX(-50%)'
            };
        } else {
            // No space below AND no space above? (Giant element or small screen)
            // Center it on screen or pin to bottom of viewport
            // Let's pin to bottom of viewport with some padding, so it's always visible
            tooltipStyle = {
                left: '50%',
                bottom: 20,
                transform: 'translateX(-50%)',
                zIndex: 70 // Ensure it's on top
            };
        }
    }

    // Mobile specific override (Navigation bar area)
    if (targetRect.y > viewportHeight - 100) {
        tooltipStyle = {
            left: '50%',
            bottom: viewportHeight - targetRect.y + 20,
            transform: 'translateX(-50%)'
        };
    }

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none">
            {/* SVG Overlay */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {/* The 'hole' - animating this requires motion.rect or controlled state */}
                        <motion.rect
                            initial={false}
                            animate={{
                                x: targetRect.x,
                                y: targetRect.y,
                                width: targetRect.width,
                                height: targetRect.height,
                                rx: 16 // Rounded corners
                            }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 200
                            }}
                            fill="black"
                        />
                    </mask>
                </defs>
                {/* The Backdroop */}
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.6)" // Dimmed background
                    mask="url(#tour-mask)"
                    className="backdrop-blur-[2px]"
                />
            </svg>

            {/* Tooltip Card */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.title} // Remount on step change for fresh animation
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        style={tooltipStyle as any}
                        className={`absolute w-80 bg-[#F2EFE9] rounded-xl shadow-2xl p-6 border border-white/50
                            ${isDeskTopSidebar ? '' : 'transform -translate-x-1/2'} `}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-serif text-xl text-charcoal">{currentStep.title}</h3>
                            <button
                                onClick={skipTour}
                                className="text-stone-400 hover:text-stone-600 p-1"
                                aria-label="Close tour"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="text-sm text-stone-600 leading-relaxed mb-6">
                            {currentStep.description}
                        </p>

                        <div className="flex justify-between items-center">
                            <div className="flex space-x-1.5">
                                {Array.from({ length: totalSteps }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors 
                                            ${i === currentStepIndex
                                                ? 'bg-saffron-deep'
                                                : 'bg-stone-300'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextStep}
                                className="flex items-center space-x-1 px-4 py-2 bg-charcoal text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-colors"
                            >
                                <span>{currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}</span>
                                <ChevronRight size={12} />
                            </button>
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TourOverlay;
