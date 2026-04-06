import { Message } from "../models/Message.js";
import type { ChatMessage } from "./llm/types.js";
import mongoose from "mongoose";

export async function getRecentContext(sessionId: string, limit = 20): Promise<ChatMessage[]> {
  const sid = new mongoose.Types.ObjectId(sessionId);
  const msgs = await Message.find({ sessionId: sid }).sort({ createdAt: 1 }).limit(limit).lean();
  return msgs.map((m) => ({ role: m.role as ChatMessage["role"], content: m.content }));
}

