import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf } from 'lucide-react';

interface FeatureGuideProps {
    title: string;
    description: string;
    featureId: string; // Key for localStorage
    className?: string;
}

const FeatureGuide: React.FC<FeatureGuideProps> = ({ title, description, featureId, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const storageKey = `guide_dismissed_${featureId}`;

    useEffect(() => {
        const dismissed = localStorage.getItem(storageKey);
        if (!dismissed) {
            const timer = setTimeout(() => setIsVisible(true), 600);
            return () => clearTimeout(timer);
        }
    }, [storageKey]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(storageKey, 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // smooth ease-out
                    className={`w-full overflow-hidden shrink-0 ${className}`}
                >
                    <div className="w-full bg-[#F9F8F6] border-b border-stone-200/50 px-6 py-4 relative">
                        <div className="max-w-2xl mx-auto flex items-start gap-4">
                            {/* Icon */}
                            <div className="mt-1 text-stone-300 shrink-0">
                                <Leaf size={14} />
                            </div>

                            <div className="flex-1 space-y-1.5">
                                <h4 className="text-[10px] uppercase tracking-[0.2em] font-serif text-stone-400 font-bold">
                                    {title}
                                </h4>
                                <p className="text-sm text-stone-600 font-light leading-relaxed max-w-lg">
                                    {description}
                                </p>
                            </div>

                            {/* Dismiss Button */}
                            <button
                                onClick={handleDismiss}
                                className="text-stone-300 hover:text-stone-500 hover:bg-stone-100 p-1.5 rounded-full transition-all shrink-0 -mr-2 -mt-2"
                                aria-label="Dismiss guide"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FeatureGuide;
