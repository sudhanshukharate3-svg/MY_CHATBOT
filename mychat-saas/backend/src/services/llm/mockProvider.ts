import type { LlmProvider, ChatMessage, LlmResponse } from "./types.js";

/**
 * Mock LLM Provider for testing without OpenAI API key
 * Returns instant responses for demo/testing
 */
export class MockProvider implements LlmProvider {
  private responses: { [key: string]: string } = {
    "what is data science":
      "Data science is an interdisciplinary field that combines statistics, programming, and domain expertise to extract insights from data. It involves collecting, processing, and analyzing data to make informed business decisions.",
    "hello":
      "Hello! I'm MYCHAT, your AI assistant. How can I help you today?",
    "hi":
      "Hi there! What would you like to chat about?",
    "default":
      "That's an interesting question! I'm currently running in demo mode with mock responses. For real AI responses, please configure an OpenAI API key in your environment.",
  };

  async generate(messages: ChatMessage[]): Promise<LlmResponse> {
    // Get last user message
    const lastMessage = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastMessage?.content?.toLowerCase() || "";

    // Find matching response
    for (const [key, response] of Object.entries(this.responses)) {
      if (userText.includes(key)) {
        return { text: response };
      }
    }

    // Default response
    return { text: this.responses.default };
  }
}
