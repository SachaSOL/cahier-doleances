import Anthropic from "@anthropic-ai/sdk";

// Vrai pipeline IA si la clé est présente, sinon le mode secours prend le relais.
export function claudeDisponible(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function askClaudeJSON<T>(
  system: string,
  userText: string,
  model: string = "claude-sonnet-5"
): Promise<T> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: userText }],
  });
  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
