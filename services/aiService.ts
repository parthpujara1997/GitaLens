export async function getGuidance(
  userInput: string,
  systemInstruction: string,
  history: { role: string; content: string }[] = [],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const response = await fetch(`${API_URL}/api/guidance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: userInput, // Changed to match backend expected field 'message'
      history
    })
  });

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  // Handle streaming response if onChunk is provided
  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let resultText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      resultText += chunk;
      onChunk(chunk);
    }

    return resultText;
  }

  // Fallback for non-streaming (though backend is now strictly streaming)
  // This handles the case where the stream might have already been consumed or closed quickly
  const text = await response.text();
  return text;
}
