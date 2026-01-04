
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Fallback to check if key is loaded
if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
    console.log("Testing @google/genai with model: gemini-1.5-flash");
    try {
        const result = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: "Hello",
        });
        console.log("Success! Response:", result.text);
    } catch (error) {
        console.error("Fail with gemini-1.5-flash:");
        console.error(error);

        // Try with 'models/' prefix
        console.log("\nRetrying with 'models/gemini-1.5-flash'...");
        try {
            const result2 = await ai.models.generateContent({
                model: "models/gemini-1.5-flash",
                contents: "Hello",
            });
            console.log("Success with prefix! Response:", result2.text);
        } catch (error2) {
            console.error("Fail with prefix:");
            console.error(error2);
        }
    }
}

test();
