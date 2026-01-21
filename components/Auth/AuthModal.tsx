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
                                        className="w-full py-3.5 bg-white border border-stone-300 text-charcoal rounded-xl font-bold hover:bg-stone-50 hover:shadow-md transition-all flex items-center justify-center space-x-3 mb-6 active:scale-[0.98]"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span>Continue with Google</span>
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
