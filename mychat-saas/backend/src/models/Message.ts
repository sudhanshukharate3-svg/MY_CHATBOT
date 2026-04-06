import mongoose, { type InferSchemaType } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "ChatSession" },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    role: { type: String, required: true, enum: ["user", "assistant", "system"] },
    content: { type: String, required: true },
    tokens: { type: Number },
  },
  { timestamps: true }
);

export type MessageDoc = InferSchemaType<typeof messageSchema> & { _id: mongoose.Types.ObjectId };
export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

