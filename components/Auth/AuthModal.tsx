import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, LogIn, UserPlus, Github, Chrome } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'login' | 'signup' | 'update-password';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'update-password'>(defaultMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync mode with prop when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setMode(defaultMode);
            setError(null);
            setEmail('');
            setPassword('');
            setFullName('');
        }
    }, [isOpen, defaultMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
                onClose();
            } else if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}`,
                });
                if (error) throw error;
                alert('Password reset link sent to your email!');
                setMode('login');
            } else if (mode === 'update-password') {
                const { error } = await supabase.auth.updateUser({
                    password: password
                });
                if (error) throw error;
                alert('Password updated successfully!');
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/20 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-md bg-parchment rounded-3xl shadow-2xl border border-stone/50 flex flex-col max-h-[90vh] overflow-hidden relative"
                    >
                        {/* Static Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-stone-500 hover:text-charcoal transition-colors hover:bg-stone-warm/50 rounded-full z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Scrollable Content Area */}
                        <div className="flex-grow overflow-y-auto p-8 pt-12 custom-scrollbar">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-saffron-brown serif mb-2">
                                    {mode === 'login' && 'Welcome Back'}
                                    {mode === 'signup' && 'Begin Your Journey'}
                                    {mode === 'forgot' && 'Reset Password'}
                                    {mode === 'update-password' && 'New Password'}
                                </h2>
                                <p className="text-stone-600">
                                    {mode === 'login' && 'Continue your journey to spiritual clarity'}
                                    {mode === 'signup' && 'Join our community of seekers'}
                                    {mode === 'forgot' && 'Enter your email to receive a reset link'}
                                    {mode === 'update-password' && 'Set a steady new password for your account'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'signup' && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                placeholder="Arjuna"
                                                value={fullName}
                                                autoComplete="name"
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl glass-input outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                            <input
                                                type="email"
                                                required
                                                placeholder="seeker@gitalens.ai"
                                                value={email}
                                                autoComplete="email"
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl glass-input outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {(mode === 'login' || mode === 'signup' || mode === 'update-password') && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                                                {mode === 'update-password' ? 'New Password' : 'Password'}
                                            </label>
                                            {mode === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('forgot')}
                                                    className="text-[10px] font-bold text-saffron-accent uppercase tracking-tighter hover:underline"
                                                >
                                                    Forgot?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={password}
                                                autoComplete={mode === 'signup' || mode === 'update-password' ? 'new-password' : 'current-password'}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl glass-input outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-clay text-white rounded-xl font-semibold shadow-lg shadow-clay/20 hover:bg-clay-hover transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {mode === 'login' && <LogIn size={20} />}
                                            {mode === 'signup' && <UserPlus size={20} />}
                                            <span>
                                                {mode === 'login' && 'Sign In'}
                                                {mode === 'signup' && 'Create Account'}
                                                {mode === 'forgot' && 'Send Reset Link'}
                                                {mode === 'update-password' && 'Update Password'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {mode !== 'update-password' && (
                                <>
                                    <div className="relative my-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-stone/30"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                            <span className="bg-parchment px-4 text-stone-400 font-bold">Or continue with</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGoogleLogin}
                                        className="w-full py-3 bg-white border border-stone/50 text-charcoal rounded-xl font-medium hover:bg-stone-light transition-all flex items-center justify-center space-x-3 mb-6"
                                    >
                                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                        <span>Google Account</span>
                                    </button>
                                </>
                            )}

                            <p className="text-center text-stone-600 text-sm mt-4">
                                {mode === 'login' && "Don't have an account?"}
                                {mode === 'signup' && "Already have an account?"}
                                {mode === 'forgot' && "Remembered your password?"}
                                {mode === 'update-password' && "Go back to "}
                                {' '}
                                <button
                                    onClick={() => {
                                        if (mode === 'forgot') setMode('login');
                                        else if (mode === 'update-password') setMode('login');
                                        else setMode(mode === 'login' ? 'signup' : 'login');
                                    }}
                                    className="text-saffron-accent font-bold hover:underline"
                                >
                                    {(mode === 'login' || mode === 'forgot' || mode === 'update-password') ? 'Sign In' : 'Join Now'}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
