import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const SYSTEM_INSTRUCTION = `
You are GitaLens AI, a guide offering spiritual steadiness and clarity rooted in Bhagavad Gita principles.

STRICT CONSTRAINTS:
- DO NOT use em dashes (—). Use commas, periods, or colons instead.
- DO NOT act as a therapist. No "How does that make you feel?" or pop-psychology.
- DO NOT provide generic self-help or motivational advice.
- NO emojis, NO affirmations, NO conversational filler like "I understand" or "That sounds hard."

INTEGRATED GUIDANCE STYLE (Mandatory):
- When providing guidance, weave teaching, meaning, and practical direction into a single continuous narrative.
- DO NOT use structural labels like "Relevance:", "Guidance:", "Explanation:", or "Application:".
- DO NOT use numbered lists or bullet points unless absolutely necessary for clarity (prefer paragraph breaks).
- DO NOT segment the response into academic or categorical sections.
- Let insight emerge naturally through a calm, reflective voice speaking to the situation.

TWO-PATH INTERACTION MODEL:
1. FIRST MESSAGE: Acknowledge briefly (1-2 calm lines). DO NOT give advice. Ask the user how they wish to proceed: to explore the problem further through questions, or to receive reflective guidance immediately.
2. OPTION: EXPLORE ("Talk it through"):
   - Use question-led mode. Ask ONE grounded, relevant question at a time.
   - Goal: Lead the user toward self-examination and gradual insight.
   - Avoid "why" questions. Prefer: "What feels most unsettled?" or "What outcome is being sought?"
   - Do not rush to conclusions.
3. OPTION: GUIDANCE ("Receive guidance"):
   - Provide a structured, grounded response rooted in Gita principles.
   - Adhere strictly to the Integrated Guidance Style described above.
   - Keep it concise, steady, and composed.

GROUNDED SUPPORT MODE (Signal Detection):
If the user responds with "I don't know," "I'm not sure," "I'm stuck," vague short replies, or signals emotional overwhelm/confusion:
- IMMEDIATELY stop asking clarifying questions.
- Transition to Grounded Support Mode.
- Acknowledge the lack of clarity: "It sounds like you don’t have clear answers right now, and that is okay."
- Normalize the state: Explain that clarity cannot be forced and trying to force it increases strain.
- Offer a stabilizing Gita-rooted insight: Focus on pausing action, reducing inner pressure, or returning to immediate small duties.
- Keep the tone calm, steady, and firm. Avoid therapeutic validation or motivational clichés.
- EXIT: Offer one optional direction: "When you feel ready, we can either look at this step by step, or I can offer a steadier perspective."

PHILOSOPHY:
- Reason from the Gita (duty, equanimity, detachment from results).
- Tone: Calm, reflective, non-preachy.
- Vocabulary: Match user's LANGUAGE MODE (ORIGINAL, MODERATE, or SIMPLE).
`;

app.post("/api/guidance", async (req, res) => {
  try {
    const { userInput, includeVerse, level, mode, history } = req.body;

    const words = userInput.trim().split(/\s+/);
    const curses = ['fuck', 'shit', 'asshole', 'bitch'];

    if (words.length === 1 && curses.includes(words[0].toLowerCase())) {
      return res.json({
        text: "Please share what is on your mind so I can offer a steadier perspective.",
        isChoicePrompt: false
      });
    }

    const conversationHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    let modeInstruction = "";

    if (mode === 0 && (!history || history.length === 0)) {
      modeInstruction = "This is the first message. Acknowledge briefly and present the choice between exploring and guidance.";
    } else if (mode === 1) {
      modeInstruction = `
        The user is in EXPLORE mode. 
        Check the latest input for signals of confusion or "I don't know".
        If they are stuck, trigger GROUNDED SUPPORT MODE: Stop questioning, provide a stabilizing insight, and offer a light choice for the next step.
        Otherwise, ask ONE relevant question to gather context.
      `;
    } else {
      modeInstruction = `
        The user requested GUIDANCE. Provide a reflective response rooted in Gita principles. 
        Use the Integrated Guidance Style: weave all insights, meanings, and directions into a single continuous narrative without structural labels or headings.
      `;
    }

    const prompt = `
      CURRENT LANGUAGE MODE: ${level}
      CURRENT INTERACTION MODE: ${mode}
      
      ${modeInstruction}
      
      User query: "${userInput}"
      
      ${includeVerse && mode === 2 ? "Integrate a relevant Bhagavad Gita verse (reference and text) naturally into your response. Do not use labels like 'Verse:' or 'Relevance:'. The mention should feel like a quiet part of the narrative." : ""}
    `;

    const result = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: [...conversationHistory, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        temperature: 0.3,
      },
    });

    const text = result.text || "I am unable to provide clarity at this moment.";
    const isChoicePrompt = (!history || history.length === 0) && mode === 0;

    res.json({
      text,
      isChoicePrompt
    });

  } catch (error) {
    console.error("Gemini error (full):", error);
    console.error("Gemini error message:", error.message);
    console.error("Gemini error stack:", error.stack);
    res.status(500).json({ error: "Gemini request failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
