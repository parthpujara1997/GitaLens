import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { TextRoll } from "./text-roll";
import { EyeIcon } from "./eye-icon";
import { Lock } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, value, onChange, placeholder, ...props }, ref) => {
        const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 z-10" size={18} />
                
                <input
                    ref={(node) => {
                        (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
                        if (typeof ref === 'function') ref(node);
                        else if (ref) ref.current = node;
                    }}
                    value={value}
                    // Keep type password so browsers recognize it as a password field natively where possible,
                    // but we need type="text" when unmasked to avoid rendering bullets.
                    // Wait, if it's type="password", standard font is big dots, but text-transparent hides them.
                    // However, caret position and spacing might be tricky. Let's stick with type="text" when unveiled
                    // and type="password" when veiled but with transparent text.
                    // The user's snippet uses type="password" always and hides text. 
                    // Let's use type="password" always as it enforces proper semantics, BUT
                    // wait, if we use text-transparent, the bullets are hidden anyway.
                    type={isPasswordVisible ? "text" : "password"}
                    onChange={handleChange}
                    onSelect={syncScroll}
                    onKeyUp={syncScroll}
                    onClick={syncScroll}
                    className={cn(
                        "w-full pl-12 pr-12 py-3 rounded-xl glass-input outline-none",
                        "font-mono text-transparent caret-charcoal transition-colors",
                        className
                    )}
                    placeholder=""
                    {...props}
                />

                {/* Animated text overlay */}
                <div
                    aria-hidden
                    className="absolute inset-0 pl-12 py-3 pr-12 flex items-center pointer-events-none font-mono text-charcoal"
                >
                    <div className="overflow-hidden w-full flex">
                        {!stringValue ? (
                            <span className="text-stone-400 tracking-normal font-sans">{placeholder}</span>
                        ) : (
                            <TextRoll
                                className="whitespace-nowrap w-full leading-none tracking-widest mt-0.5 max-w-full"
                                initialText={stringValue}
                                rollingText={stringValue.split("").map(() => "•").join("")}
                                isRolling={!isPasswordVisible}
                                scrollLeft={scrollLeft}
                            />
                        )}
                    </div>
                </div>

                {/* Show/hide toggle */}
                <div className="absolute top-1/2 -translate-y-1/2 right-3 z-10">
                    <motion.button
                        type="button"
                        title={isPasswordVisible ? "Hide password" : "Show password"}
                        className={cn(
                            "flex items-center justify-center p-1 rounded-md transition-colors",
                            isPasswordVisible ? "text-charcoal" : "text-stone-400 hover:text-stone-600"
                        )}
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <EyeIcon open={isPasswordVisible} size={18} />
                    </motion.button>
                </div>
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";
