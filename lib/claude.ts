import Anthropic from "@anthropic-ai/sdk";

// Les 4 prompts du pipeline sont dans kit/prompts/*.md (source de vérité).
// Usage type :
//   const json = await askClaudeJSON(PROMPT_SYSTEME, texteCitoyen);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function askClaudeJSON<T>(
  system: string,
  userText: string,
  model: string = "claude-sonnet-5"
): Promise<T> {
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: userText }],
  });
  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  // Tolère un éventuel bloc ```json ... ``` autour de la réponse.
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
