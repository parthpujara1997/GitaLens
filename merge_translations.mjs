import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GITA_DATA_PATH = path.join(__dirname, 'gitaData.ts');
const TRANSLATIONS_PATH = path.join(__dirname, 'translations_update.json');

function extractVerses(fileContent) {
    const match = fileContent.match(/export const GITA_VERSES: GitaVerse\[\] = (\[[\s\S]*?\]);/);
    if (match && match[1]) {
        try {
            return eval(match[1]);
        } catch (e) {
            console.error("Failed to eval GITA_VERSES:", e);
            return null;
        }
    }
    return null;
}

async function main() {
    try {
        if (!fs.existsSync(TRANSLATIONS_PATH)) {
            console.error("Translations file not found.");
            return;
        }

        const translations = JSON.parse(fs.readFileSync(TRANSLATIONS_PATH, 'utf-8'));
        const fileContent = fs.readFileSync(GITA_DATA_PATH, 'utf-8');

        // Extract existing verses
        const verses = extractVerses(fileContent);

        if (!verses) {
            console.error("Could not parse GITA_VERSES from file.");
            return;
        }

        console.log(`Loaded ${verses.length} verses from gitaData.ts`);
        console.log(`Loaded ${translations.length} updates.`);

        let updatedCount = 0;
        translations.forEach(update => {
            const verse = verses.find(v => v.id === update.id);
            if (verse) {
                // Keep the "1.1 " prefix if it exists in the new text? 
                // The user provided text WITHOUT prefix (e.g., "Dhritarashtra said...").
                // The current app logic might rely on it, OR it might handle it.
                // Looking at current gitaData, it has "1.1 The King...".
                // Let's add the prefix to match existing format for consistency, 
                // OR clean it up if the UI adds it.
                // UI: "1.1 {text}" is often manually added in data.
                // Let's check a verse. Verse 1.1: "1.1 The King..."
                // User text: "Dhritarashtra said..."
                // If I replace strictly, it becomes "Dhritarashtra said...".
                // Does UI display verse number separately? 
                // Library Modal: Reference "Chapter 1, Verse 1" is shown.
                // Text: "{selectedVerse.text}"
                // If I remove "1.1", it might look cleaner.
                // But typically gitaData had it.
                // I will Add it for consistency: `${update.id.replace('-', '.')} ${update.text}`.
                // Example: "1.1 Dhritarashtra said..."

                const prefix = `${verse.chapter}.${verse.verse}`;
                // check if user text already starts with it
                if (update.text.startsWith(prefix)) {
                    verse.text = update.text;
                } else {
                    verse.text = `${prefix} ${update.text}`;
                }
                updatedCount++;
            } else {
                console.warn(`Verse not found: ${update.id}`);
            }
        });

        console.log(`Updated ${updatedCount} verses.`);

        // Replace in file content
        const newVersesArrayString = JSON.stringify(verses, null, 4);

        // Regex replacement to preserve surrounding code
        const newFileContent = fileContent.replace(
            /export const GITA_VERSES: GitaVerse\[\] = \[[\s\S]*?\];/,
            `export const GITA_VERSES: GitaVerse[] = ${newVersesArrayString};`
        );

        if (newFileContent === fileContent) {
            console.error("Replacement failed (regex didn't match).");
            // Backup fallback (manual split)
            const marker = "export const GITA_VERSES: GitaVerse[] = ";
            const parts = fileContent.split(marker);
            // Risky if helpers are at bottom.
            console.log("Attempting to reconstruct file safely...");
            // logic: finding the end of the array is hard without regex.
            return;
        }

        fs.writeFileSync(GITA_DATA_PATH + '.bak', fileContent);
        fs.writeFileSync(GITA_DATA_PATH, newFileContent);

        console.log("Successfully updated gitaData.ts with new translations.");

    } catch (error) {
        console.error("Uncaught error:", error);
    }
}

main();
