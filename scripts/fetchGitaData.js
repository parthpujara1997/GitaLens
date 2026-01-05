import fs from 'fs';

// Curated data preservation
const CURATED_DATA = {
    '2-47': { reflection: 'Focus on the process and the effort you put in today. The outcome is often influenced by factors outside your control. Steadying your mind on your work itself brings more peace than worrying about the result.', themes: ['duty', 'detachment', 'action'] },
    '2-48': { reflection: 'Try to maintain a level head through the highs and lows of the day. Balance isn\'t about ignoring emotions, but about not letting them pull you completely off center.', themes: ['equanimity', 'duty', 'detachment'] },
    '2-14': { reflection: 'Discomfort and pleasure are temporary visitors. Neither will stay forever. Learning to observe them without being swept away is the practice of steadiness.', themes: ['equanimity', 'clarity', 'detachment'] },
    '2-62': { reflection: 'Notice the chain reaction: dwelling on something leads to wanting it, wanting it leads to frustration when we don\'t get it. Awareness of this pattern is the first step to breaking it.', themes: ['clarity', 'detachment', 'knowledge'] },
    '2-70': { reflection: 'Peace comes not from fulfilling every desire, but from remaining steady as desires come and go. Like an ocean that receives rivers without overflowing.', themes: ['equanimity', 'detachment', 'clarity'] },
    '3-19': { reflection: 'Do what needs to be done, not because you\'re chasing a specific outcome, but because it\'s the right action in this moment. This is how clarity emerges.', themes: ['action', 'duty', 'detachment'] },
    '3-27': { reflection: 'Much of what happens is beyond your personal control. Recognizing this can ease the burden of thinking you must manage everything alone.', themes: ['knowledge', 'clarity', 'surrender'] },
    '3-35': { reflection: 'Your own path, even with its imperfections, is more authentic than trying to walk someone else\'s perfect-looking journey. Stay true to what\'s yours.', themes: ['duty', 'clarity', 'courage'] },
    '4-18': { reflection: 'Sometimes the wisest action is stillness. Sometimes rest is the most productive thing you can do. True wisdom is knowing which is needed when.', themes: ['knowledge', 'clarity', 'action'] },
    '4-38': { reflection: 'Clarity doesn\'t come all at once. It emerges gradually through consistent practice and patience with yourself.', themes: ['knowledge', 'clarity', 'meditation'] },
    '5-10': { reflection: 'When you act without clinging to outcomes, you move through challenges without being weighed down by them. Like water rolling off a lotus leaf.', themes: ['detachment', 'action', 'surrender'] },
    '6-5': { reflection: 'Your internal dialogue can be your greatest ally or your biggest obstacle. Today, observe how you talk to yourself. Aim for a perspective that builds clarity rather than one that dwells on confusion.', themes: ['clarity', 'meditation', 'knowledge'] },
    '6-17': { reflection: 'Balance in daily routines—eating, working, resting—creates the foundation for mental steadiness. Small, consistent habits matter more than grand gestures.', themes: ['equanimity', 'meditation', 'action'] },
    '6-23': { reflection: 'The practice of steadying yourself is not about perfection. It\'s about returning again and again, without losing heart when you drift.', themes: ['meditation', 'courage', 'equanimity'] },
    '6-35': { reflection: 'It\'s normal for the mind to wander and resist. You\'re not failing when this happens—you\'re simply experiencing what everyone experiences.', themes: ['meditation', 'clarity', 'equanimity'] },
    '7-19': { reflection: 'Deep understanding comes through time and experience. Trust that each step, even the difficult ones, is part of a larger unfolding.', themes: ['knowledge', 'surrender', 'devotion'] },
    '9-22': { reflection: 'When you show up consistently with sincerity, clarity finds its way to you. Not through force, but through steady presence.', themes: ['devotion', 'knowledge', 'surrender'] },
    '9-27': { reflection: 'Every action, no matter how small, can be done with intention and care. This transforms ordinary tasks into meaningful practice.', themes: ['devotion', 'action', 'surrender'] },
    '12-13': { reflection: 'Kindness, humility, and steadiness in all circumstances—these qualities create inner peace and genuine connection with others.', themes: ['devotion', 'equanimity', 'clarity'] },
    '12-16': { reflection: 'Letting go of the need to control every outcome brings a lightness to life. Do what you can, then release the rest.', themes: ['detachment', 'devotion', 'equanimity'] },
    '13-8': { reflection: 'True knowledge isn\'t just intellectual—it shows up in how you treat yourself and others. These qualities are the markers of real understanding.', themes: ['knowledge', 'clarity', 'action'] },
    '14-24': { reflection: 'Equanimity doesn\'t mean you don\'t feel anything. It means you don\'t let external circumstances define your inner stability.', themes: ['equanimity', 'clarity', 'detachment'] },
    '15-7': { reflection: 'The struggle you feel is universal. You are not alone in finding life challenging. This shared experience connects all of us.', themes: ['knowledge', 'clarity', 'surrender'] },
    '16-1': { reflection: 'Cultivating these qualities is a gradual process. Start where you are, with what feels most accessible today.', themes: ['courage', 'clarity', 'knowledge'] },
    '18-48': { reflection: 'Imperfection is part of any meaningful work. Don\'t wait for perfect conditions or flawless execution. Begin where you are, with what you have.', themes: ['action', 'duty', 'courage'] },
    '18-58': { reflection: 'When you act with awareness and humility, obstacles become navigable. When you act from ego alone, you lose your way.', themes: ['surrender', 'devotion', 'clarity'] },
    '18-66': { reflection: 'Sometimes the most powerful thing you can do is let go of trying to figure everything out. Trust that you don\'t have to carry it all alone.', themes: ['surrender', 'devotion', 'courage'] },
    '18-78': { reflection: 'When wisdom and action come together, when clarity meets courage, that\'s when real transformation happens.', themes: ['knowledge', 'action', 'courage'] }
};

const CHAPTERS = [
    { number: 1, name: 'Arjuna\'s Dejection', description: 'Arjuna\'s moral dilemma on the battlefield', verseCount: 46 },
    { number: 2, name: 'Sankhya Yoga', description: 'The yoga of knowledge and the immortal soul', verseCount: 72 },
    { number: 3, name: 'Karma Yoga', description: 'The yoga of selfless action', verseCount: 43 },
    { number: 4, name: 'Jnana Yoga', description: 'The yoga of knowledge and wisdom', verseCount: 42 },
    { number: 5, name: 'Karma Sanyasa Yoga', description: 'The yoga of renunciation of action', verseCount: 29 },
    { number: 6, name: 'Dhyana Yoga', description: 'The yoga of meditation', verseCount: 47 },
    { number: 7, name: 'Jnana Vijnana Yoga', description: 'The yoga of knowledge and realization', verseCount: 30 },
    { number: 8, name: 'Akshara Brahma Yoga', description: 'The yoga of the imperishable absolute', verseCount: 28 },
    { number: 9, name: 'Raja Vidya Yoga', description: 'The yoga of royal knowledge', verseCount: 34 },
    { number: 10, name: 'Vibhuti Yoga', description: 'The yoga of divine glories', verseCount: 42 },
    { number: 11, name: 'Vishwarupa Darshana Yoga', description: 'The yoga of the cosmic vision', verseCount: 55 },
    { number: 12, name: 'Bhakti Yoga', description: 'The yoga of devotion', verseCount: 20 },
    { number: 13, name: 'Kshetra Kshetrajna Vibhaga Yoga', description: 'The yoga of the field and the knower', verseCount: 34 },
    { number: 14, name: 'Gunatraya Vibhaga Yoga', description: 'The yoga of the three qualities', verseCount: 27 },
    { number: 15, name: 'Purushottama Yoga', description: 'The yoga of the supreme person', verseCount: 20 },
    { number: 16, name: 'Daivasura Sampad Vibhaga Yoga', description: 'The yoga of divine and demonic natures', verseCount: 24 },
    { number: 17, name: 'Shraddhatraya Vibhaga Yoga', description: 'The yoga of the threefold faith', verseCount: 28 },
    { number: 18, name: 'Moksha Sanyasa Yoga', description: 'The yoga of liberation through renunciation', verseCount: 78 }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const determineSpeaker = (text, chapter, verse) => {
    if (text.includes('Dhritarashtra said') || (chapter === 1 && verse === 1)) return 'Dhritarashtra';
    if (text.includes('Sanjaya said') || (chapter === 1 && verse < 20)) return 'Sanjaya';
    if (text.includes('Arjuna said')) return 'Arjuna';
    if (text.includes('Blessed Lord said') || text.includes('Bhagavan said')) return 'Krishna';
    if (chapter === 1) return (verse > 20 && verse < 26) ? 'Arjuna' : 'Sanjaya';
    return 'Krishna';
};

const cleanText = (text) => {
    return text
        .replace(/Dhritarashtra (said|uvacha|asked):?/i, '')
        .replace(/Sanjaya (said|uvacha):?/i, '')
        .replace(/Arjuna (said|uvacha):?/i, '')
        .replace(/The Blessed Lord (said|uvacha):?/i, '')
        .replace(/Sri Bhagavan (said|uvacha):?/i, '')
        .replace(/King Dhritarashtra asked:?/i, '')
        .replace(/\"/g, '')
        .trim();
};

async function fetchVerseRef(chapter, verse) {
    const url = `https://vedicscriptures.github.io/slok/${chapter}/${verse}`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Node.js/1.0' }
        });
        if (!res.ok) {
            console.warn(`Failed to fetch ${chapter}-${verse}: ${res.status}`);
            return null;
        }
        const data = await res.json();
        return data;
    } catch (e) {
        console.error(`Error fetching ${chapter}-${verse}:`, e);
        return null;
    }
}

async function main() {
    console.log("Starting fetch...");
    const verses = [];
    const CHUNK_SIZE = 20; // smaller chunks

    let queue = [];
    for (const chapter of CHAPTERS) {
        for (let v = 1; v <= chapter.verseCount; v++) {
            queue.push({ chapter: chapter.number, verse: v });
        }
    }

    console.log(`Total verses to fetch: ${queue.length}`);

    // Process queue in chunks
    for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
        const chunk = queue.slice(i, i + CHUNK_SIZE);
        console.log(`Processing batch ${i} - ${i + chunk.length}...`);

        const promises = chunk.map(async (item) => {
            const data = await fetchVerseRef(item.chapter, item.verse);
            const id = `${item.chapter}-${item.verse}`;

            // Fallback text if fetch fails
            let text = "Text unavailable";
            let speaker = 'Krishna'; // Default

            if (data) {
                const translation = data.purohit?.et || data.siva?.et || data.chinmay?.hc || '';
                speaker = determineSpeaker(translation, item.chapter, item.verse);
                text = cleanText(translation) || text;
            }

            const curated = CURATED_DATA[id];

            return {
                id: id,
                chapter: item.chapter,
                verse: item.verse,
                reference: `Chapter ${item.chapter}, Verse ${item.verse}`,
                text: text,
                reflection: curated ? curated.reflection : '',
                themes: curated ? curated.themes : [],
                speaker: speaker
            };
        });

        const results = await Promise.all(promises);
        verses.push(...results);
        await sleep(200);
    }

    verses.sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });

    console.log(`Fetched ${verses.length} verses.`);

    const fileContent = `import { GitaVerse, GitaChapter, Theme } from './types';

export const THEMES: Theme[] = [
    { id: 'duty', name: 'Duty', description: 'Understanding and performing one\\'s responsibilities' },
    { id: 'detachment', name: 'Detachment', description: 'Freedom from attachment to outcomes' },
    { id: 'clarity', name: 'Clarity', description: 'Clear vision and discernment' },
    { id: 'action', name: 'Action', description: 'The path of selfless action' },
    { id: 'devotion', name: 'Devotion', description: 'Love and surrender to the divine' },
    { id: 'knowledge', name: 'Knowledge', description: 'Wisdom and self-realization' },
    { id: 'equanimity', name: 'Equanimity', description: 'Balance and steadiness of mind' },
    { id: 'courage', name: 'Courage', description: 'Strength in facing challenges' },
    { id: 'meditation', name: 'Meditation', description: 'Inner stillness and contemplation' },
    { id: 'surrender', name: 'Surrender', description: 'Letting go and trusting the process' }
];

export const CHAPTERS: GitaChapter[] = ${JSON.stringify(CHAPTERS, null, 4)};

export const GITA_VERSES: GitaVerse[] = ${JSON.stringify(verses, null, 4)};

// Helper function to get verses by chapter
export function getVersesByChapter(chapterNumber: number): GitaVerse[] {
    return GITA_VERSES.filter(v => v.chapter === chapterNumber);
}

// Helper function to get verses by theme
export function getVersesByTheme(themeId: string): GitaVerse[] {
    return GITA_VERSES.filter(v => v.themes.includes(themeId));
}

// Helper function to get a specific verse
export function getVerse(chapterNumber: number, verseNumber: number): GitaVerse | undefined {
    return GITA_VERSES.find(v => v.chapter === chapterNumber && v.verse === verseNumber);
}
`;

    fs.writeFileSync('gitaData.ts', fileContent);
    console.log('gitaData.ts generated successfully.');
}

main();
