export interface Verse {
  reference: string;
  text: string;
  reflection: string;
}

export interface GitaVerse {
  id: string;
  chapter: number;
  verse: number;
  reference: string;
  sanskrit?: string;
  text: string;
  reflection: string;
  themes: string[];
  speaker: 'Krishna' | 'Arjuna' | 'Sanjaya' | 'Dhritarashtra';
}

export interface GitaChapter {
  number: number;
  name: string;
  description: string;
  verseCount: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
}

export interface UserProgress {
  reflection_days: number;
  last_visit_date: string | null;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  GUIDANCE = 'GUIDANCE',
  JOURNAL = 'JOURNAL',
  LIBRARY = 'LIBRARY',
  SETTINGS = 'SETTINGS',
  FAVORITES = 'FAVORITES',
  HISTORY = 'HISTORY'
}

export interface GuidanceSummary {
  id: string;
  date: string;
  topic: string;
  summary: string;
  messages?: { role: 'user' | 'ai'; content: string }[];
}

export enum LanguageLevel {
  MODERN = 'MODERN',
  ORIGINAL = 'ORIGINAL'
}

export enum InteractionMode {
  UNDECIDED = 'UNDECIDED',
  EXPLORE = 'EXPLORE',
  GUIDANCE = 'GUIDANCE'
}

export interface AppSettings {
  languageLevel: LanguageLevel;
}