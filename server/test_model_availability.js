
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from parent or current
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }
    console.log("API Key found (length):", apiKey.length);

    const ai = new GoogleGenAI({ apiKey });

    const modelsToTest = [
        "gemini-2.5-pro",
        "models/gemini-2.5-pro",
        "gemini-1.5-pro",
        "models/gemini-1.5-pro"
    ];

    for (const model of modelsToTest) {
        console.log(`\nTesting model: ${model}...`);
        try {
            const result = await ai.models.generateContent({
                model: model,
                contents: [{ role: 'user', parts: [{ text: "Hello, just checking if you are there." }] }]
            });
            console.log(`SUCCESS: ${model} responded:`, result.text ? result.text.substring(0, 20) + "..." : "No text");
        } catch (error) {
            console.log(`FAILED: ${model} - Error: ${error.message}`);
        }
    }
}

testModels();
