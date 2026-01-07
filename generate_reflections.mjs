
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

// Load environment variables manually since we might not have dotenv configured for ES modules in this env
// Assuming .env.local exists in root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');

// Try to get API key from: 1) CLI arg, 2) env var, 3) .env file
let apiKey = process.argv[2] || process.env.VITE_GEMINI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('VITE_GEMINI_API_KEY=')) {
            apiKey = line.substring('VITE_GEMINI_API_KEY='.length).trim();
            break;
        }
    }
}

if (!apiKey) {
    console.error("Error: VITE_GEMINI_API_KEY not found.");
    console.error("Usage: node generate_reflections.mjs [API_KEY]");
    console.error("Or set VITE_GEMINI_API_KEY in .env.local");
    process.exit(1);
}

console.log("API key loaded successfully.");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const REFLECTIONS_SOURCE_PATH = path.join(__dirname, 'src', 'data', 'reflections.json');
const OUTPUT_PATH = path.join(__dirname, 'src', 'data', 'ai_reflections.json');

// Helper to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("Starting AI Reflection Generation...");

    // 1. Read source verses
    if (!fs.existsSync(REFLECTIONS_SOURCE_PATH)) {
        console.error(`Source file not found: ${REFLECTIONS_SOURCE_PATH}`);
        return;
    }
    const sourceData = JSON.parse(fs.readFileSync(REFLECTIONS_SOURCE_PATH, 'utf-8'));
    const verseKeys = Object.keys(sourceData); // e.g., ["1.1", "1.2", ...]

    // Sort keys numerically/logically
    verseKeys.sort((a, b) => {
        const [c1, v1] = a.split('.').map(Number);
        const [c2, v2] = b.split('.').map(Number);
        return c1 - c2 || v1 - v2;
    });

    console.log(`Found ${verseKeys.length} verses to process.`);

    // 2. Load existing progress
    let generatedReflections = {};
    if (fs.existsSync(OUTPUT_PATH)) {
        try {
            generatedReflections = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
            console.log(`Loaded ${Object.keys(generatedReflections).length} existing reflections.`);
        } catch (e) {
            console.warn("Could not parse existing output file, starting fresh.");
        }
    }

    // 3. Batch Process
    const BATCH_SIZE = 10;
    const missingKeys = verseKeys.filter(k => !generatedReflections[k]);

    if (missingKeys.length === 0) {
        console.log("All verses already completed!");
        return;
    }

    console.log(`${missingKeys.length} verses remaining to generate.`);

    for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
        const batchKeys = missingKeys.slice(i, i + BATCH_SIZE);
        console.log(`\nProcessing Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingKeys.length / BATCH_SIZE)} (Verses: ${batchKeys[0]} - ${batchKeys[batchKeys.length - 1]})`);

        const prompt = `You are a thoughtful spiritual guide helping modern readers understand the Bhagavad Gita.

For each verse below, decide authentically whether it offers practical wisdom OR if it's primarily narrative context.

GUIDELINES - Use your judgment naturally:

**Write a REFLECTION when:**
- The verse contains genuine emotional truth (fear, doubt, resolve, compassion)
- There's a clear teaching about action, duty, detachment, knowledge, or self
- Character dialogue reveals a universal human struggle
- There's practical wisdom applicable to modern life (work stress, decision-making, relationships)
- Ask yourself: "Would this genuinely help someone today?"

**Write CONTEXT when:**
- It's purely scene-setting without deeper insight ("Sanjaya said", narrator transitions)
- Lists of names/warriors without emotional or moral weight
- Technical descriptions (battlefield positions, conch shells) 
- Simple factual statements
- Ask yourself: "Is this just telling us what happened?"

IMPORTANT: Don't force wisdom where it doesn't naturally exist. Be honest about what's context vs reflection.

TONE: Warm, modern, conversational. No archaic language or preaching.
LENGTH: 2-3 sentences that feel natural, not stretched.
FORMAT: Valid JSON. Keys = verse IDs (e.g. "1.1"), Values = your text.

VERSES:
${JSON.stringify(batchKeys.map(k => ({ key: k, text: sourceData[k] })), null, 2)}`;

        let retries = 3;
        let success = false;

        while (retries > 0 && !success) {
            try {
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                });

                const responseText = result.response.text();
                const jsonResponse = JSON.parse(responseText);

                // Merge results
                Object.assign(generatedReflections, jsonResponse);

                // Validate that we got what we asked for
                const missingInBatch = batchKeys.filter(k => !generatedReflections[k]);
                if (missingInBatch.length > 0) {
                    console.warn(`Warning: Batch missing keys: ${missingInBatch.join(', ')}`);
                }

                // Save immediately
                fs.writeFileSync(OUTPUT_PATH, JSON.stringify(generatedReflections, null, 2));
                console.log(`  Saved batch progress.`);
                success = true;

            } catch (err) {
                console.error(`  Error in batch (Attempt ${4 - retries}/3):`, err.message);
                retries--;
                if (retries > 0) await delay(2000); // Wait before retry
            }
        }

        if (!success) {
            console.error("  Failed to process batch after retries. Stopping script to preserve state.");
            break;
        }

        // Rate limiting pause
        await delay(1500);
    }

    console.log("\nGeneration complete!");
}

main().catch(console.error);
