import React from 'react';
import { View } from '../types';
import { Home, Compass, PenLine, Settings, Heart, History, BookOpen, LucideIcon, User, Feather } from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  activeView: View;
  onNavigate: (view: View) => void;
  orientation: 'horizontal' | 'vertical';
}

interface NavItem {
  view: View;
  label: string;
  icon: LucideIcon;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onNavigate, orientation }) => {
  const { user, isAdmin } = useAuth();

  const allItems: NavItem[] = [
    { view: View.DASHBOARD, label: 'Home', icon: Home },
    { view: View.GUIDANCE, label: 'Guidance', icon: Compass },

    { view: View.LIBRARY, label: 'Library', icon: BookOpen },
    { view: View.BLOG, label: 'Insights', icon: Feather },
    ...(isAdmin ? [{ view: View.BLOG_ADMIN, label: 'Admin', icon: Settings }] : []),
    { view: View.ACCOUNT, label: 'Account', icon: User },
  ];

  const items = allItems;

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              data-tour={
                item.view === View.GUIDANCE ? 'nav-guidance' :
                  item.view === View.JOURNAL ? 'nav-journal' :
                    item.view === View.LIBRARY ? 'nav-library' :
                      undefined
              }
              onClick={() => onNavigate(item.view)}
              className="group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabVertical"
                  className="absolute inset-0 bg-stone-neutral border border-stone-warm shadow-sm rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className={`relative z-10 transition-colors ${isActive ? 'text-charcoal' : 'text-stone-600 group-hover:text-charcoal'}`}>
                <Icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"} />
              </span>
              <span className={`relative z-10 text-sm font-medium transition-colors ${isActive ? 'text-charcoal font-semibold' : 'text-stone-600 group-hover:text-charcoal'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    );
  }

  return (
    <div className="flex justify-around items-center h-16 w-full max-w-lg mx-auto overflow-x-auto no-scrollbar">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.view;

        return (
          <button
            key={item.view}
            data-tour={
              item.view === View.GUIDANCE ? 'nav-guidance' :
                item.view === View.JOURNAL ? 'nav-journal' :
                  item.view === View.LIBRARY ? 'nav-library' :
                    item.view === View.CLARITY_CHAIN ? 'nav-clarity-chain' :
                      undefined
            }
            onClick={() => onNavigate(item.view)}
            className="relative flex flex-col items-center justify-center min-w-[60px] flex-1 h-full space-y-1"
          >
            {isActive && (
              <motion.div
                layoutId="activeTabHorizontal"
                className="absolute inset-x-1 top-2 bottom-2 bg-white/40 rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <div className={`relative z-10 transition-all duration-300 ${isActive ? 'text-charcoal scale-110' : 'text-stone-500'}`}>
              <Icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"} />
            </div>
            <span className={`relative z-10 text-[9px] font-medium tracking-tight transition-colors ${isActive ? 'text-charcoal' : 'text-stone-500'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  );
};

export default Navigation;
