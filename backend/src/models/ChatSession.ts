import mongoose, { type InferSchemaType } from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    title: { type: String, required: true, default: "New chat" },
    lastMessageAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export type ChatSessionDoc = InferSchemaType<typeof chatSessionSchema> & { _id: mongoose.Types.ObjectId };
export const ChatSession =
  mongoose.models.ChatSession || mongoose.model("ChatSession", chatSessionSchema);

