
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

async function listModels() {
    console.log("Listing available models for this API key...");
    try {
        const list = await ai.models.list();
        console.log("List type:", typeof list);
        console.log("List keys:", Object.keys(list));

        // Try iterating if it's iterable
        console.log("Iterating...");
        for await (const model of list) {
            console.log(`- ${model.name}`);
        }
    } catch (error) {
        console.error("List failed:", error);
    }
}

listModels();
