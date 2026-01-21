import React, { useState } from 'react';
import { View, UserProgress, AppSettings } from './types';
import { storageService } from './services/storageService';
import Dashboard from './components/Dashboard';
import SanctuaryDashboard from './components/SanctuaryDashboard';
import SeekGuidance from './components/SeekGuidance';
import Journal from './components/Journal';
import Library from './components/Library';
import LensPractice from './components/LensPractice';
import ClarityChain from './components/ClarityChain';
import InnerCompass from './components/InnerCompass';
import Account from './components/Account';
import Blog from './components/Blog';
import BlogAdmin from './components/BlogAdmin';
import Navigation from './components/Navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { TourProvider } from './contexts/TourContext';
import TourOverlay from './components/Tour/TourOverlay';
import AuthModal from './components/Auth/AuthModal';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [progress, setProgress] = useState<UserProgress>(storageService.getProgress());
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'update-password'>('login');
  const [chatSession, setChatSession] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [navigationParams, setNavigationParams] = useState<any>(null);

  React.useEffect(() => {
    // Check for deep link
    const params = new URLSearchParams(window.location.search);
    const vid = params.get('vid');
    if (vid) {
      setNavigationParams({ verseId: vid });
      setCurrentView(View.LIBRARY);
      // Optional: clear query param to avoid sticky state on refresh?
      // window.history.replaceState({}, '', window.location.pathname);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password');
        setIsAuthModalOpen(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (user) {
      syncUserProgress();
    } else {
      setProgress(storageService.getProgress());
    }
  }, [user]);

  // Scroll to top when view changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const syncUserProgress = async () => {
    if (!user) return;

    try {
      // 1. Fetch current profile from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const localProgress = storageService.getProgress();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it as a NEW user (start at 1 or use today's visit)
        const today = new Date().toISOString().split('T')[0];
        const initialProgress = {
          reflection_days: 1,
          last_visit_date: today
        };

        await supabase.from('profiles').insert({
          id: user.id,
          reflection_days: initialProgress.reflection_days,
          last_visit_date: initialProgress.last_visit_date
        });

        setProgress(initialProgress);
        localStorage.setItem('gitalens_progress', JSON.stringify(initialProgress));
      } else if (profile) {
        // Profile exists, use it as the source of truth
        const today = new Date().toISOString().split('T')[0];
        let finalProgress = {
          reflection_days: profile.reflection_days,
          last_visit_date: profile.last_visit_date
        };

        // Check for daily increment
        if (profile.last_visit_date !== today) {
          finalProgress = {
            reflection_days: profile.reflection_days + 1,
            last_visit_date: today
          };

          await supabase.from('profiles').update({
            reflection_days: finalProgress.reflection_days,
            last_visit_date: finalProgress.last_visit_date,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
        }

        setProgress(finalProgress);
        localStorage.setItem('gitalens_progress', JSON.stringify(finalProgress));
      }
    } catch (err) {
      console.error('Error syncing progress:', err);
    }
  };

  const handleNavigate = (view: View, params?: any) => {
    // If not logged in, handle guest progress increment on dashboard navigation
    if (!user && view === View.DASHBOARD) {
      const updated = storageService.updateProgress();
      setProgress(updated);
    }

    // Restrict Protected Features to signed-in users
    if (!user && (
      view === View.GUIDANCE ||
      view === View.JOURNAL ||
      view === View.INNER_COMPASS ||
      view === View.LENS_PRACTICE ||
      view === View.CLARITY_CHAIN
    )) {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

    setNavigationParams(params || null);
    setCurrentView(view);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  return (
    <TourProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-parchment overflow-hidden">
        <TourOverlay />
        {/* Skip to Content Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-saffron-accent focus:text-white focus:rounded-lg focus:outline-none"
        >
          Skip to Content
        </a>

        {/* Sidebar Navigation for PC */}
        <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 bg-stone-neutral/50 backdrop-blur-sm border-r border-stone-warm p-6 z-20">
          <div className="mb-0 px-2 flex justify-center">
            <button
              onClick={() => handleNavigate(View.DASHBOARD)}
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/logo.png"
                alt="GitaLens"
                className="w-56 h-auto object-contain select-none mix-blend-multiply"
              />
            </button>
          </div>
          <Navigation activeView={currentView} onNavigate={handleNavigate} orientation="vertical" />

        </aside>

        {/* Main Content Area */}
        <main id="main-content" className="flex-grow flex flex-col md:ml-64 mb-20 md:mb-0 min-h-screen relative overflow-y-auto overflow-x-hidden">
          {/* Top Right Auth Header */}
          <header className="sticky top-0 right-0 z-30 flex justify-end p-4 md:p-6 pointer-events-none">
            <div className="pointer-events-auto flex items-center space-x-3">
              {user ? (
                <button
                  onClick={() => setCurrentView(View.ACCOUNT)}
                  className="flex items-center bg-white/40 backdrop-blur-md border border-stone/30 rounded-2xl p-1.5 pl-4 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex flex-col items-end mr-3">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest group-hover:text-charcoal transition-colors">
                      {user.user_metadata.full_name || 'Seeker'}
                    </span>
                    <span className="text-[8px] text-stone-400 truncate max-w-[100px]">{user.email}</span>
                  </div>
                  <div
                    className="flex items-center space-x-2 px-3 py-2 bg-white/80 text-sm font-semibold text-stone-600 rounded-xl transition-all"
                  >
                    <UserIcon size={16} />
                  </div>
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-white/40 backdrop-blur-md border border-stone/30 rounded-2xl p-1.5 shadow-sm">
                  <button
                    onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                    className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-charcoal hover:bg-stone-warm/50 rounded-xl transition-all"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                    className="px-4 py-2 bg-clay text-white text-sm font-bold rounded-xl hover:bg-clay-hover shadow-lg shadow-clay/10 transition-all"
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="flex-grow max-w-2xl mx-auto w-full px-4 sm:px-6 py-4 md:py-6 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                {currentView === View.DASHBOARD && (
                  <SanctuaryDashboard
                    onNavigate={handleNavigate}
                    onProgressUpdate={setProgress}
                    onAuthRequired={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }}
                    progress={progress}
                  />
                )}
                {currentView === View.GUIDANCE && (
                  <SeekGuidance
                    settings={settings}
                    onNavigate={handleNavigate}
                    initialMessages={chatSession}
                    onUpdateMessages={setChatSession}
                    onEndSession={() => {
                      setChatSession([]);
                      handleNavigate(View.DASHBOARD);
                    }}
                  />
                )}
                {currentView === View.JOURNAL && (
                  <Journal
                    onComplete={() => setCurrentView(View.DASHBOARD)}
                    onAuthRequired={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }}
                  />
                )}
                {currentView === View.LIBRARY && (
                  <Library
                    onBack={() => setCurrentView(View.DASHBOARD)}
                    onAuthRequired={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }}
                    initialVerseId={navigationParams?.verseId}
                  />
                )}
                {currentView === View.ACCOUNT && (
                  <Account
                    onBack={() => setCurrentView(View.DASHBOARD)}
                    onAuthRequired={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }}
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onNavigate={handleNavigate}
                  />
                )}
                {currentView === View.BLOG && (
                  <Blog onBack={() => setCurrentView(View.DASHBOARD)} />
                )}
                {currentView === View.BLOG_ADMIN && (
                  isAdmin ? (
                    <BlogAdmin onBack={() => setCurrentView(View.ACCOUNT)} />
                  ) : (
                    <div className="p-8 text-center text-stone-500">
                      Unauthorized view.
                    </div>
                  )
                )}
                {currentView === View.LENS_PRACTICE && (
                  <LensPractice
                    onBack={() => setCurrentView(View.DASHBOARD)}
                    onNavigate={handleNavigate}
                  />
                )}
                {currentView === View.CLARITY_CHAIN && (
                  <ClarityChain
                    onBack={() => setCurrentView(View.DASHBOARD)}
                    onNavigate={handleNavigate}
                  />
                )}
                {currentView === View.INNER_COMPASS && (
                  <div className="w-full">
                    <button
                      onClick={() => setCurrentView(View.DASHBOARD)}
                      className="mb-6 flex items-center space-x-2 text-stone-500 hover:text-charcoal transition-colors uppercase tracking-widest text-[10px]"
                    >
                      <span>← Back to Dashboard</span>
                    </button>
                    {/* Reuse the component, it handles its own state */}
                    {/* Ideally this would show history/patterns in the future */}
                    <InnerCompass
                      isAuthenticated={!!user}
                      onAuthRequired={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }}
                    />
                  </div>
                )}


              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="py-12 mt-auto text-center space-y-2 select-none">
            <p className="text-stone-600 text-sm italic opacity-40">
              "A steadier way to look at life."
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 opacity-30">
              © 2026 GitaLens • All rights reserved
            </p>
          </footer>
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-neutral/80 backdrop-blur-md border-t border-stone-warm px-2 pb-safe z-50">
          <Navigation activeView={currentView} onNavigate={handleNavigate} orientation="horizontal" />
        </nav>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultMode={authMode}
        />
      </div>
    </TourProvider>
  );
};

export default App;