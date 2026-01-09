import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Configuration ---
const GITA_DATA_PATH = path.join(__dirname, 'gitaData.ts');
const SANSKRIT_SOURCE_URL = 'https://raw.githubusercontent.com/gita/gita/main/data/verse.json';

// --- Helper Functions ---

function fetchSanskritData() {
    return new Promise((resolve, reject) => {
        https.get(SANSKRIT_SOURCE_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

function extractVerses(fileContent) {
    // Basic extraction of the array part
    const match = fileContent.match(/export const GITA_VERSES: GitaVerse\[\] = (\[[\s\S]*?\]);/);
    if (match && match[1]) {
        try {
            return eval(match[1]); // Caution: trusted content only
        } catch (e) {
            console.error("Failed to eval GITA_VERSES:", e);
            return null;
        }
    }
    return null;
}

function cleanSanskrit(text) {
    if (!text) return "";
    // Remove the trailing numbers like ||1.1|| or .1.
    return text.replace(/\|\|\d+\.\d+\|\|/g, '').replace(/\|\|/g, '').trim();
}

// --- Main Process ---

async function main() {
    try {
        console.log("Fetching Sanskrit data...");
        const externalData = await fetchSanskritData();
        console.log(`Fetched ${externalData.length} verses from external source.`);

        const fileContent = fs.readFileSync(GITA_DATA_PATH, 'utf-8');
        const verses = extractVerses(fileContent);

        if (!verses) {
            console.error("Could not parse GITA_VERSES from file.");
            return;
        }

        console.log(`Processing ${verses.length} local verses...`);

        let updatedCount = 0;
        verses.forEach(localVerse => {
            const ext = externalData.find(e => e.chapter_number === localVerse.chapter && e.verse_number === localVerse.verse);
            if (ext) {
                localVerse.sanskrit = cleanSanskrit(ext.text);
                updatedCount++;
            } else {
                console.warn(`Warning: No Sanskrit found for ${localVerse.chapter}-${localVerse.verse}`);
            }
        });

        console.log(`Updated ${updatedCount} verses with Sanskrit text.`);

        // Reconstruct file
        const newVersesArrayString = JSON.stringify(verses, null, 4);
        const marker = "export const GITA_VERSES: GitaVerse[] = ";
        const parts = fileContent.split(marker);

        if (parts.length === 2) {
            // Backup
            fs.writeFileSync(GITA_DATA_PATH + '.bak', fileContent);

            const newContent = parts[0] + marker + newVersesArrayString + ";\n";
            fs.writeFileSync(GITA_DATA_PATH, newContent);
            console.log("Successfully updated gitaData.ts with Sanskrit.");
        } else {
            console.error("Could not find marker in file.");
        }

    } catch (error) {
        console.error("Uncaught error:", error);
    }
}

main();
