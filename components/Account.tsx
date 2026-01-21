
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppSettings, View } from '../types';
import Favorites from './Favorites';
import HistoryView from './History';
import Settings from './Settings';
import CompassPatterns from './CompassPatterns';
import { User, LogOut, Heart, History, Settings as SettingsIcon, ArrowLeft, Trash2, Activity, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccountProps {
    onBack: () => void;
    onAuthRequired: (mode: 'login' | 'signup') => void;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    onNavigate: (view: View) => void;
}

type AccountTab = 'profile' | 'favorites' | 'history' | 'settings' | 'patterns';

const Account: React.FC<AccountProps> = ({ onBack, onAuthRequired, settings, onUpdateSettings, onNavigate }) => {
    const { user, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!user && activeTab !== 'settings') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-8 text-center animate-in fade-in">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                    <User size={40} className="text-stone-300" />
                </div>
                <div className="max-w-xs">
                    <h2 className="text-2xl font-serif text-charcoal mb-2">My Account</h2>
                    <p className="text-stone-500 mb-6">Sign in to sync your journey, save favorite verses, and track your history.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => onAuthRequired('login')}
                        className="px-6 py-3 bg-stone-200 text-charcoal font-medium rounded-xl hover:bg-stone-300 transition-colors"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => onAuthRequired('signup')}
                        className="px-6 py-3 bg-clay text-white font-medium rounded-xl hover:bg-clay-hover transition-colors"
                    >
                        Join Now
                    </button>
                </div>
                <button onClick={onBack} className="text-stone-400 text-sm hover:text-charcoal mt-8">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const handleDeleteAccount = async () => {
        // In a real app, you'd call a Supabase Edge Function to delete the user admin-side
        // For now, we'll just sign out and show an alert as a placeholder
        alert("Account deletion request received. Currently this requires manual processing.");
        setShowDeleteConfirm(false);
    };

    const renderSidebar = () => (
        <div className="w-full md:w-64 flex-shrink-0 space-y-2 mb-8 md:mb-0">
            <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm ring-1 ring-black/5 text-charcoal' : 'text-stone-500 hover:text-charcoal hover:bg-stone-100'
                    }`}
            >
                <User size={18} />
                <span className="font-medium">Profile</span>
            </button>
            <button
                onClick={() => setActiveTab('favorites')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-white shadow-sm ring-1 ring-black/5 text-charcoal' : 'text-stone-500 hover:text-charcoal hover:bg-stone-100'
                    }`}
            >
                <Heart size={18} />
                <span className="font-medium">Favorites</span>
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-white shadow-sm ring-1 ring-black/5 text-charcoal' : 'text-stone-500 hover:text-charcoal hover:bg-stone-100'
                    }`}
            >
                <History size={18} />
                <span className="font-medium">History</span>
            </button>
            <button
                onClick={() => setActiveTab('patterns')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'patterns' ? 'bg-white shadow-sm ring-1 ring-black/5 text-charcoal' : 'text-stone-500 hover:text-charcoal hover:bg-stone-100'
                    }`}
            >
                <Activity size={18} />
                <span className="font-medium">Patterns</span>
            </button>
            <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm ring-1 ring-black/5 text-charcoal' : 'text-stone-500 hover:text-charcoal hover:bg-stone-100'
                    }`}
            >
                <SettingsIcon size={18} />
                <span className="font-medium">Settings</span>
            </button>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'favorites':
                return <Favorites onBack={() => setActiveTab('profile')} onAuthRequired={onAuthRequired} />;
            case 'history':
                return <HistoryView onBack={() => setActiveTab('profile')} onAuthRequired={onAuthRequired} />;
            case 'patterns':
                return <CompassPatterns />;
            case 'settings':
                return (
                    <Settings
                        settings={settings}
                        onUpdate={onUpdateSettings}
                        onBack={() => setActiveTab('profile')}
                        onRestartTour={onBack}
                    />
                );
            case 'profile':
            default:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white border border-stone-warm rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-16 h-16 bg-saffron-accent/10 rounded-full flex items-center justify-center text-saffron-accent">
                                    <span className="text-2xl font-serif">
                                        {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'S'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif text-charcoal">
                                        {user?.user_metadata?.full_name || 'Seeker'}
                                    </h3>
                                    <p className="text-stone-500 text-sm">{user?.email}</p>
                                </div>
                            </div>

                            <div className="border-t border-stone-100 py-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Member Since</span>
                                    <span className="text-charcoal font-medium">
                                        {new Date(user?.created_at || Date.now()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-between items-center">
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center space-x-2 text-stone-500 hover:text-charcoal transition-colors px-4 py-2 rounded-lg hover:bg-stone-50"
                                >
                                    <LogOut size={18} />
                                    <span>Sign Out</span>
                                </button>

                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-red-400 hover:text-red-600 text-xs font-medium px-4 py-2"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex items-center mb-8">
                <button onClick={onBack} className="mr-4 text-stone-500 hover:text-charcoal transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-serif text-charcoal">Account</h1>
            </div>

            <div className="flex flex-col md:flex-row md:space-x-8">
                {user && renderSidebar()}
                <div className="flex-grow min-h-[500px]">
                    {renderContent()}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-xl font-serif text-center mb-2">Delete Account?</h3>
                        <p className="text-stone-500 text-center text-sm mb-6">
                            This action cannot be undone. All your journal entries, favorites, and history will be permanently lost.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleDeleteAccount}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                            >
                                Yes, Delete My Account
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Account;
