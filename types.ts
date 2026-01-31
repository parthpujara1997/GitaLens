export interface Verse {
  reference: string;
  text: string;
  reflection: string;
}

// Feature types
export interface SharedVerse {
  id: string;
  verse_id: string;
  image_url: string;
  created_at: string;
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
  hindi?: string;
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

export interface UserProfile extends UserProgress {
  id: string;
  email?: string;
  full_name?: string;
  is_admin?: boolean; // New flag for admin access
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
}



export interface GuidanceSummary {
  id: string;
  date: string;
  topic: string;
  summary: string;
  messages?: { role: 'user' | 'ai'; content: string }[];
}

export interface Lens {
  id: string;
  label: string;
  sanskritTerm?: string;
  groundingText: string;
  orientationLine: string;
  attentionPrompt: string;
  closureLine: string;
  verseId: string;
  labelHindi?: string;
  groundingTextHindi?: string;
  orientationLineHindi?: string;
  attentionPromptHindi?: string;
  closureLineHindi?: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  GUIDANCE = 'GUIDANCE',
  JOURNAL = 'JOURNAL',
  LIBRARY = 'LIBRARY',
  SETTINGS = 'SETTINGS',
  FAVORITES = 'FAVORITES',
  HISTORY = 'HISTORY',
  LENS_PRACTICE = 'LENS_PRACTICE',
  CLARITY_CHAIN = 'CLARITY_CHAIN',
  BLOG = 'BLOG',
  BLOG_ADMIN = 'BLOG_ADMIN',
  ACCOUNT = 'ACCOUNT',



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

export enum InnerState {
  PRESSURED = 'Pressured',
  ANXIOUS = 'Anxious',
  OVERTHINKING = 'Overthinking',
  DRAINED = 'Drained',
  RESTLESS = 'Restless',
  NUMB = 'Numb',
  CALM = 'Calm',
  FOCUSED = 'Focused',
  CLEAR = 'Clear',
  MOTIVATED = 'Motivated',
  CONTENT = 'Content'
}

export enum InnerDirection {
  STUCK = 'Stuck',
  UNCLEAR = 'Unclear',
  OVERWHELMED = 'Overwhelmed',
  BEHIND = 'Behind',
  ON_TRACK = 'On track',
  AT_EASE = 'At ease'
}

export enum TimeBand {
  EARLY = 'EARLY',     // 5 AM - 11 AM
  MIDDAY = 'MIDDAY',   // 11 AM - 4 PM
  LATE = 'LATE',       // 4 PM - 9 PM
  NIGHT = 'NIGHT'      // 9 PM - 5 AM
}

export interface InnerCheckIn {
  id: string;
  date: string; // ISO string
  timestamp: number;
  timeBand: TimeBand;
  state: InnerState;
  direction: InnerDirection;
  reflection: string;
}

export interface AppSettings {
  languageLevel: LanguageLevel;
}


