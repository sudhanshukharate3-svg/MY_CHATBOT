import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyToken, type JwtUser } from "./lib/jwt.js";
import { ChatSession } from "./models/ChatSession.js";
import { Message } from "./models/Message.js";
import type { LlmProvider } from "./services/llm/types.js";
import { getRecentContext } from "./services/chatMemory.js";

export function initSocket(opts: {
  httpServer: HttpServer;
  webOrigin: string;
  jwtAccessSecret: string;
  llm: LlmProvider;
}) {
  const io = new Server(opts.httpServer, {
    cors: { origin: opts.webOrigin, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || "");
      if (!token) return next(new Error("Unauthorized"));
      const user = verifyToken<JwtUser>(token, opts.jwtAccessSecret);
      (socket as any).user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user as JwtUser;

    socket.on("session:join", async ({ sessionId }: { sessionId: string }) => {
      const session = await ChatSession.findOne({ _id: sessionId, userId: user.sub }).lean();
      if (!session) return socket.emit("error", { message: "Session not found" });
      socket.join(`session:${sessionId}`);
      socket.emit("session:joined", { sessionId });
    });

    socket.on(
      "chat:message",
      async (payload: { sessionId: string; text: string; clientMessageId?: string }) => {
        try {
          const { sessionId, text, clientMessageId } = payload;
          const cleaned = String(text ?? "").replace(/\0/g, "").trim();
          if (!cleaned) return;
          if (cleaned.length > 4000) {
            return socket.emit("chat:error", { message: "Message too long (max 4000 chars).", clientMessageId });
          }
          const session = await ChatSession.findOne({ _id: sessionId, userId: user.sub });
          if (!session) return socket.emit("chat:error", { message: "Session not found", clientMessageId });

          const userMsg = await Message.create({
            sessionId,
            userId: user.sub,
            role: "user",
            content: cleaned,
          });

          io.to(`session:${sessionId}`).emit("chat:message:created", {
            message: userMsg,
            clientMessageId,
          });

          io.to(`session:${sessionId}`).emit("chat:typing", { sessionId, isTyping: true });

          try {
            const context = await getRecentContext(sessionId, 30);
            const system = {
              role: "system" as const,
              content:
                "You are MYCHAT APP, a production-grade assistant. " +
                "Be accurate, context-aware, and concise. Use markdown for code and lists. " +
                "If you are unsure, ask a clarifying question.",
            };

            const llmResp = await opts.llm.generate([system, ...context, { role: "user", content: cleaned }]);

            if (!llmResp.text) {
              throw new Error("Empty response from LLM");
            }

            const botMsg = await Message.create({
              sessionId,
              userId: user.sub,
              role: "assistant",
              content: llmResp.text,
            });

            session.lastMessageAt = new Date();
            if (session.title === "New chat") {
              session.title = text.slice(0, 48);
            }
            await session.save();

            io.to(`session:${sessionId}`).emit("chat:typing", { sessionId, isTyping: false });
            io.to(`session:${sessionId}`).emit("chat:message:created", { message: botMsg });
          } catch (llmError) {
            console.error("LLM Error:", llmError);
            io.to(`session:${sessionId}`).emit("chat:typing", { sessionId, isTyping: false });
            io.to(`session:${sessionId}`).emit("chat:error", {
              message: `Failed to generate response: ${llmError instanceof Error ? llmError.message : "Unknown error"}`,
              clientMessageId,
            });
          }
        } catch (error) {
          console.error("Chat message error:", error);
          socket.emit("chat:error", { message: "An error occurred while processing your message" });
        }
      }
    );
  });

  return io;
}

