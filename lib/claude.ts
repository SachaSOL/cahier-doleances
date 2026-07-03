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
  // Les modèles Claude 5 peuvent renvoyer un bloc "thinking" avant le texte :
  // on ne lit que les blocs texte.
  const raw = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
