import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { TextRoll } from "./text-roll";
import { Mail } from "lucide-react";

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
    ({ className, value, onChange, placeholder, ...props }, ref) => {
        const [scrollLeft, setScrollLeft] = useState(0);

        const internalRef = useRef<HTMLInputElement>(null);
        const frameRef = useRef<number | null>(null);

        const syncScroll = useCallback(() => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            frameRef.current = requestAnimationFrame(() => {
                if (internalRef.current) {
                    setScrollLeft(internalRef.current.scrollLeft);
                }
            });
        }, []);

        useEffect(() => {
            return () => {
                if (frameRef.current) cancelAnimationFrame(frameRef.current);
            };
        }, []);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onChange) onChange(e);
            syncScroll();
        };

        const stringValue = (value as string) || "";

        return (
            <div className="relative w-full">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 z-10" size={18} />
                
                <input
                    ref={(node) => {
                        (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
                        if (typeof ref === 'function') ref(node);
                        else if (ref) ref.current = node;
                    }}
                    value={value}
                    type="text"
                    onChange={handleChange}
                    onSelect={syncScroll}
                    onKeyUp={syncScroll}
                    onClick={syncScroll}
                    className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-xl glass-input outline-none",
                        "font-mono text-transparent caret-charcoal transition-colors",
                        className
                    )}
                    placeholder=""
                    {...props}
                />

                {/* Animated text overlay */}
                <div
                    aria-hidden
                    className="absolute inset-0 pl-12 py-3 pr-4 flex items-center pointer-events-none font-mono text-charcoal"
                >
                    <div className="overflow-hidden w-full flex">
                        {!stringValue ? (
                            <span className="text-stone-400 tracking-normal font-sans">{placeholder}</span>
                        ) : (
                            <TextRoll
                                className="whitespace-nowrap w-full leading-none tracking-normal mt-0.5 max-w-full"
                                initialText={stringValue}
                                rollingText={stringValue}
                                isRolling={false}
                                scrollLeft={scrollLeft}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

AnimatedInput.displayName = "AnimatedInput";
