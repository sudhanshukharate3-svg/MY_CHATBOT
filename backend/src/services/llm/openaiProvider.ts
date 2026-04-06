import OpenAI from "openai";
import type { LlmProvider, ChatMessage, LlmResponse } from "./types.js";

export class OpenAiProvider implements LlmProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generate(messages: ChatMessage[]): Promise<LlmResponse> {
    const resp = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.4,
    });
    const text = resp.choices[0]?.message?.content?.trim() || "";
    return { text: text || "Sorry, I couldn't generate a response." };
  }
}

