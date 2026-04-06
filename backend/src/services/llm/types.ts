export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type LlmResponse = {
  text: string;
};

export interface LlmProvider {
  generate(messages: ChatMessage[]): Promise<LlmResponse>;
}

