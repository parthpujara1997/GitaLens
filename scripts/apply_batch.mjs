import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITA_DATA_PATH = path.join(__dirname, '../gitaData.ts');

async function main() {
    const batchPath = process.argv[2];
    if (!batchPath) {
        console.error("Please provide path to batch JSON file.");
        process.exit(1);
    }

    try {
        const modernVerses = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
        const fileContent = fs.readFileSync(GITA_DATA_PATH, 'utf-8');
        
        const arrayStartMarker = "export const GITA_VERSES: GitaVerse[] = ";
        const arrayStartIndex = fileContent.indexOf(arrayStartMarker);
        if (arrayStartIndex === -1) {
            console.error("Could not find GITA_VERSES array start.");
            return;
        }
        
        const arrayBodyStart = arrayStartIndex + arrayStartMarker.length;
        
        const arrayEndIdx = fileContent.indexOf("export const getVersesByChapter", arrayBodyStart);
        if (arrayEndIdx === -1) {
             console.error("Could not find GITA_VERSES array end.");
             return;
        }
        
        let bracketIndex = arrayEndIdx;
        while (bracketIndex > arrayBodyStart && fileContent[bracketIndex] !== ']') {
            bracketIndex--;
        }

        const arrayString = fileContent.substring(arrayBodyStart, bracketIndex + 1);
        const restOfFile = fileContent.substring(bracketIndex + 1);

        // Safely parse the array string
        // We use a simpler approach: JSON.parse after minor cleanup if possible, 
        // but since it's a TS file with potentially unquoted keys or comments, we'll use a regex or eval for now as before
        let verses;
        try {
            // Remove 'as any' or other TS-isms if present
            const sanitizedArrayString = arrayString.replace(/\s+as\s+any/g, '');
            verses = eval(sanitizedArrayString);
        } catch (e) {
            console.error("Failed to eval GITA_VERSES. Try manually inspecting the file.", e);
            return;
        }

        let updatedCount = 0;
        verses.forEach(localVerse => {
            const verseId = `${localVerse.chapter}.${localVerse.verse}`;
            if (modernVerses[verseId]) {
                localVerse.modernText = modernVerses[verseId];
                updatedCount++;
            }
        });

        console.log(`Updated ${updatedCount} verses in memory.`);

        const newVersesArrayString = JSON.stringify(verses, null, 4);
        const newContent = fileContent.substring(0, arrayBodyStart) + newVersesArrayString + restOfFile;
        fs.writeFileSync(GITA_DATA_PATH, newContent);
        console.log(`Successfully updated gitaData.ts with ${updatedCount} modern translations from ${path.basename(batchPath)}.`);
    } catch (error) {
        console.error("Error processing batch:", error);
    }
}

main();
