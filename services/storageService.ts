
import { UserProgress, JournalEntry, AppSettings, LanguageLevel } from '../types';

const PROGRESS_KEY = 'gitalens_progress';
const JOURNAL_KEY = 'gitalens_journal';
const SETTINGS_KEY = 'gitalens_settings';
const FAVORITES_KEY = 'gitalens_favorites';
const HISTORY_KEY = 'gitalens_history';

export const storageService = {
  // ... existing methods ...
  getProgress: (): UserProgress => {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : { reflection_days: 0, last_visit_date: null };
  },

  updateProgress: () => {
    const progress = storageService.getProgress();
    const today = new Date().toISOString().split('T')[0];

    if (progress.last_visit_date !== today) {
      const updated = {
        reflection_days: progress.reflection_days + 1,
        last_visit_date: today
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      return updated;
    }
    return progress;
  },

  getJournalEntries: (): JournalEntry[] => {
    const data = localStorage.getItem(JOURNAL_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveJournalEntry: (content: string) => {
    const entries = storageService.getJournalEntries();
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content
    };
    localStorage.setItem(JOURNAL_KEY, JSON.stringify([newEntry, ...entries]));
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      languageLevel: LanguageLevel.MODERATE
    };
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Bookmarks
  getBookmarks: (): any[] => {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  },

  toggleBookmark: (verse: any) => {
    const favorites = storageService.getBookmarks();
    const index = favorites.findIndex(v => v.reference === verse.reference);
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(verse);
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return index === -1; // returns true if added, false if removed
  },

  isBookmarked: (reference: string): boolean => {
    const favorites = storageService.getBookmarks();
    return favorites.some(v => v.reference === reference);
  },

  // History Summaries
  getHistorySummaries: (): any[] => {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  addHistorySummary: (topic: string, summary: string) => {
    const history = storageService.getHistorySummaries();
    const newSummary = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      topic,
      summary
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([newSummary, ...history]));
  }
};
