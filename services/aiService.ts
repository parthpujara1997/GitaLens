export async function getGuidance(
  userInput: string,
  systemInstruction: string,
  history: { role: string; content: string }[] = []
) {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const response = await fetch(`${API_URL}/api/guidance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userInput,
      systemInstruction,
      history
    })
  });

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  return response.json();
}
