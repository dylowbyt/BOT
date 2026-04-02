import OpenAI from "openai";
import { logger } from "../lib/logger.js";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const client = new OpenAI({ apiKey });

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const chatSessions = new Map<string, ChatMessage[]>();

const SYSTEM_PROMPT =
  "Kamu adalah asisten AI yang ramah dan helpful. Jawab dalam bahasa yang sama dengan pengguna. Jika pengguna berbicara Indonesia, jawab dalam bahasa Indonesia. Jika Inggris, jawab dalam Inggris. Tetaplah singkat, jelas, dan membantu.";

function getOrCreateSession(sessionId: string): ChatMessage[] {
  if (!chatSessions.has(sessionId)) {
    chatSessions.set(sessionId, []);
  }
  return chatSessions.get(sessionId)!;
}

export async function generateAIResponse(
  sessionId: string,
  message: string,
): Promise<string> {
  try {
    const history = getOrCreateSession(sessionId);
    history.push({ role: "user", content: message });

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1000,
    });

    const reply = response.choices[0]?.message?.content ?? "Maaf, tidak ada respons dari AI.";
    history.push({ role: "assistant", content: reply });

    if (history.length > 40) {
      history.splice(0, 2);
    }

    return reply;
  } catch (err) {
    logger.error({ err, sessionId }, "Error generating AI response");
    return "Maaf, terjadi error saat memproses pesanmu. Coba lagi ya!";
  }
}

export function clearSession(sessionId: string): void {
  chatSessions.delete(sessionId);
}
