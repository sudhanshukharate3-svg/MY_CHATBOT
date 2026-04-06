import type { LlmProvider, ChatMessage, LlmResponse } from "./types.js";

/**
 * Flask Provider - Calls the Python Flask app at port 5000
 * Uses the robust VoiceAssistant implementation with caching and fallback chains
 */
export class FlaskProvider implements LlmProvider {
  private flaskUrl: string;

  constructor(flaskUrl: string = "http://localhost:5000") {
    this.flaskUrl = flaskUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  async generate(messages: ChatMessage[]): Promise<LlmResponse> {
    try {
      // Get last user message
      const lastMessage = [...messages].reverse().find((m) => m.role === "user");
      const userText = lastMessage?.content || "";

      if (!userText) {
        return { text: "Please provide a message" };
      }

      console.log(`[FlaskProvider] Calling Flask API at ${this.flaskUrl}/api/chat`);
      console.log(`[FlaskProvider] Query: "${userText.substring(0, 100)}"`);

      // Call Flask API using fetch
      const response = await fetch(`${this.flaskUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FlaskProvider] HTTP ${response.status}: ${errorText}`);
        return {
          text: `Error from Flask API: HTTP ${response.status}. Make sure Flask is running with: python app_web.py`,
        };
      }

      const data = (await response.json()) as any;
      const text = data?.response || "";

      if (!text) {
        console.error("[FlaskProvider] Empty response from Flask");
        return {
          text: "Sorry, I couldn't fetch a response from the Flask API. Check Flask logs for errors.",
        };
      }

      console.log(`[FlaskProvider] Got response: "${text.substring(0, 100)}..."`);
      return { text };
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(`[FlaskProvider] Error:`, errorMsg);

      // Check if Flask is running
      if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("connect")) {
        return {
          text: `❌ Cannot connect to Flask API at ${this.flaskUrl}\n\n🐍 Start Flask with:\n\`\`\`\npython app_web.py\n\`\`\`\n\nOr set FLASK_API_URL in .env to the correct Flask server address.`,
        };
      }

      return {
        text: `Error calling Flask API: ${errorMsg}`,
      };
    }
  }
}
