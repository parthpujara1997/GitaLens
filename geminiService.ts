import { LanguageLevel, InteractionMode } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/guidance";

export const getGuidance = async (
  userInput: string,
  includeVerse: boolean,
  level: LanguageLevel,
  mode: InteractionMode,
  history: { role: 'user' | 'ai', content: string }[]
) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userInput,
        includeVerse,
        level,
        mode,
        history
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return { text: "A moment of silence is needed. Please try again soon.", isChoicePrompt: false };
  }
};
