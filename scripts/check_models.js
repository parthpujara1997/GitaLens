
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function listModels() {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
        // The SDK might have a different way to list models depending on version, 
        // but typically it's via the API. 
        // Since @google/genai is the new SDK (v1?), let's try the models endpoint.
        // If this SDK doesn't support list directly easily, I'll just try a simple generation with "gemini-1.5-pro" to see if that works.

        // Actually, looking at the pattern, let's just try to generate with gemini-2.5-pro and if it fails, try gemini-1.5-pro.

        console.log("Attempting to list models or test known models...");

        // Testing gemini-2.5-pro
        try {
            console.log("Testing gemini-2.5-pro...");
            await ai.models.generateContent({
                model: "models/gemini-2.5-pro",
                contents: [{ role: 'user', parts: [{ text: "Hello" }] }]
            });
            console.log("SUCCESS: gemini-2.5-pro works.");
        } catch (e) {
            console.log("FAILED: gemini-2.5-pro failed: " + e.message);
        }

        // Testing gemini-1.5-pro
        try {
            console.log("Testing gemini-1.5-pro...");
            await ai.models.generateContent({
                model: "models/gemini-1.5-pro",
                contents: [{ role: 'user', parts: [{ text: "Hello" }] }]
            });
            console.log("SUCCESS: gemini-1.5-pro works.");
        } catch (e) {
            console.log("FAILED: gemini-1.5-pro failed: " + e.message);
        }

    } catch (error) {
        console.error("Setup error:", error);
    }
}

listModels();
