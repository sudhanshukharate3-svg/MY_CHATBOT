import { io, type Socket } from "socket.io-client";
import { env } from "./env";

export type ServerToClientEvents = {
  "session:joined": (p: { sessionId: string }) => void;
  "chat:typing": (p: { sessionId: string; isTyping: boolean }) => void;
  "chat:message:created": (p: { message: any; clientMessageId?: string }) => void;
  "chat:error": (p: { message: string; clientMessageId?: string }) => void;
};

export type ClientToServerEvents = {
  "session:join": (p: { sessionId: string }) => void;
  "chat:message": (p: { sessionId: string; text: string; clientMessageId?: string }) => void;
};

export function createSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(env.socketUrl, {
    transports: ["websocket"],
    auth: { token },
  });
}

