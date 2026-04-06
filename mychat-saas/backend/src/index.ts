import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { loadEnv } from "./config.js";
import { connectMongo } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { sessionsRouter } from "./routes/sessions.js";
import { requireAuth } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { OpenAiProvider } from "./services/llm/openaiProvider.js";
import { MockProvider } from "./services/llm/mockProvider.js";
import { initSocket } from "./socket.js";

const env = loadEnv();

async function main() {
  await connectMongo(env.MONGODB_URI);

  const app = express();
  const server = http.createServer(app);

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true, name: "mychat-backend" }));

  app.use(
    "/api/auth",
    authRouter({
      jwtAccessSecret: env.JWT_ACCESS_SECRET,
      jwtRefreshSecret: env.JWT_REFRESH_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshTtl: env.JWT_REFRESH_TTL,
    })
  );

  app.use("/api/sessions", requireAuth(env.JWT_ACCESS_SECRET), sessionsRouter());

  app.use(notFound);
  app.use(errorHandler);

  // Use MockProvider for testing/demo, OpenAI for production
  let llm;
  if (!env.OPENAI_API_KEY) {
    console.log("✨ OPENAI_API_KEY not set. Using MOCK provider for instant responses (demo mode)");
    console.log("📝 To use real AI: Set OPENAI_API_KEY in .env file");
    llm = new MockProvider();
  } else {
    console.log("🔑 Using OpenAI API provider");
    llm = new OpenAiProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  }
  initSocket({
    httpServer: server,
    webOrigin: env.WEB_ORIGIN,
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    llm,
  });

  server.listen(env.PORT, () => {
    console.log(`Backend listening on http://localhost:${env.PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

