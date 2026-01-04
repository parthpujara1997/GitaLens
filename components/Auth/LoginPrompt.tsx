import React from 'react';
import { motion } from 'framer-motion';
import { Lock, LogIn, UserPlus } from 'lucide-react';

interface LoginPromptProps {
    title: string;
    description: string;
    onLogin: () => void;
    onSignup: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ title, description, onLogin, onSignup }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white/40 border border-dashed border-stone-warm rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 bg-saffron-accent/10 rounded-full flex items-center justify-center text-saffron-accent">
                <Lock size={32} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-semibold text-charcoal serif">{title}</h3>
                <p className="text-stone-500 max-w-xs mx-auto">
                    {description}
                </p>
            </div>
            <div className="flex flex-col w-full space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                <button
                    onClick={onLogin}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-stone/50 text-charcoal rounded-xl font-medium hover:bg-stone-light transition-all shadow-sm"
                >
                    <LogIn size={18} />
                    <span>Sign In</span>
                </button>
                <button
                    onClick={onSignup}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-clay text-white rounded-xl font-semibold hover:bg-clay-hover shadow-lg shadow-clay/10 transition-all"
                >
                    <UserPlus size={18} />
                    <span>Join Now</span>
                </button>
            </div>
        </div>
    );
};

export default LoginPrompt;
