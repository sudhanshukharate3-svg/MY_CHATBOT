import type { LlmProvider, ChatMessage, LlmResponse } from "./types.js";

/**
 * Mock LLM Provider for testing without OpenAI API key
 * Returns instant responses for demo/testing
 */
export class MockProvider implements LlmProvider {
  private responses: { [key: string]: string } = {
    "data science":
      "Data science is an interdisciplinary field that combines statistics, mathematics, programming, and domain expertise to extract actionable insights from data. Key aspects include:\n\n📊 **Core Areas:**\n- Data collection & cleaning  \n- Exploratory data analysis\n- Statistical modeling\n- Machine learning\n- Data visualization\n\n💼 **Applications:**\n- Business intelligence\n- Healthcare diagnostics\n- Fraud detection\n- Recommendation systems\n- Predictive analytics",

    "artificial intelligence":
      "Artificial Intelligence (AI) refers to computer systems designed to perform tasks that typically require human intelligence. Categories include:\n\n🤖 **Types of AI:**\n- Narrow AI (task-specific)\n- General AI (human-like intelligence)\n- Super AI (hypothetical)\n\n🧠 **Key Techniques:**\n- Machine Learning\n- Deep Learning\n- Natural Language Processing\n- Computer Vision\n- Robotics\n\n🎯 **Applications:** Virtual assistants, image recognition, autonomous vehicles, medical diagnosis",

    "machine learning":
      "Machine Learning (ML) is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.\n\n📚 **Types:**\n- **Supervised Learning**: Learn from labeled data\n- **Unsupervised Learning**: Find patterns in unlabeled data  \n- **Reinforcement Learning**: Learn through rewards/penalties\n\n🔧 **Common Algorithms:**\n- Linear Regression\n- Decision Trees\n- Neural Networks\n- Random Forests\n- K-Means Clustering",

    "hello": "👋 Hello! I'm MYCHAT, your AI assistant. I can help you with questions about data science, AI, technology, and more. What would you like to know?",
    "hi": "Hey there! 👋 What can I help you with today?",
    "help": "I can help with queries about:\n- 🤖 AI & Machine Learning\n- 📊 Data Science & Statistics  \n- 💻 Programming & Technology\n- 🧠 Deep Learning & Neural Networks\n\nJust ask me anything!",
  };

  async generate(messages: ChatMessage[]): Promise<LlmResponse> {
    // Get last user message
    const lastMessage = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastMessage?.content?.toLowerCase() || "";

    console.log(`[MockProvider] Processing: "${userText}"`);

    // Find matching response (check each key)
    for (const [key, response] of Object.entries(this.responses)) {
      if (key && userText.includes(key.toLowerCase())) {
        console.log(`[MockProvider] Matched key: "${key}"`);
        return { text: response };
      }
    }

    // Default response for unknown queries
    const defaultResponse = `That's an interesting question about "${userText.slice(0, 50)}..."\n\nDemo Mode: Using instant mock responses. For real AI-powered answers, add your OpenAI API key to .env and restart the backend! 🚀`;
    console.log(`[MockProvider] Using default response`);
    return { text: defaultResponse };
  }
}
