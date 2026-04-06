import { Router } from "express";
import { z } from "zod";
import { ChatSession } from "../models/ChatSession.js";
import { Message } from "../models/Message.js";

export function sessionsRouter() {
  const r = Router();

  r.get("/", async (req, res) => {
    const userId = req.user!.sub;
    const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({ sessions });
  });

  r.post("/", async (req, res) => {
    const userId = req.user!.sub;
    const schema = z.object({ title: z.string().min(1).max(80).optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const session = await ChatSession.create({ userId, title: parsed.data.title ?? "New chat" });
    res.status(201).json({ session });
  });

  r.get("/:id/messages", async (req, res) => {
    const userId = req.user!.sub;
    const session = await ChatSession.findOne({ _id: req.params.id, userId }).lean();
    if (!session) return res.status(404).json({ error: "Session not found" });
    const messages = await Message.find({ sessionId: session._id }).sort({ createdAt: 1 }).lean();
    res.json({ session, messages });
  });

  return r;
}

