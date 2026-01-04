export interface Verse {
  reference: string;
  text: string;
  reflection: string;
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
  SETTINGS = 'SETTINGS',
  FAVORITES = 'FAVORITES',
  HISTORY = 'HISTORY'
}

export interface GuidanceSummary {
  id: string;
  date: string;
  topic: string;
  summary: string;
}

export enum LanguageLevel {
  ORIGINAL = 'ORIGINAL',
  MODERATE = 'MODERATE',
  SIMPLE = 'SIMPLE'
}

export enum InteractionMode {
  UNDECIDED = 'UNDECIDED',
  EXPLORE = 'EXPLORE',
  GUIDANCE = 'GUIDANCE'
}

export interface AppSettings {
  showSupportingVerses: boolean;
  languageLevel: LanguageLevel;
}