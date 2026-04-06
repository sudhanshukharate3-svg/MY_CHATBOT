import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";

export function authRouter(opts: {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
}) {
  const r = Router();

  r.post("/signup", async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2).max(50),
      password: z.string().min(8).max(100),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const { email, name, password } = parsed.data;
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, name, passwordHash });

    const payload = { sub: String(user._id), email: user.email, name: user.name };
    const accessToken = signAccessToken(payload, opts.jwtAccessSecret, opts.accessTtl);
    const refreshToken = signRefreshToken(payload, opts.jwtRefreshSecret, opts.refreshTtl);

    res.status(201).json({ accessToken, refreshToken, user: payload });
  });

  r.post("/login", async (req, res) => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const payload = { sub: String(user._id), email: user.email, name: user.name };
    const accessToken = signAccessToken(payload, opts.jwtAccessSecret, opts.accessTtl);
    const refreshToken = signRefreshToken(payload, opts.jwtRefreshSecret, opts.refreshTtl);
    res.json({ accessToken, refreshToken, user: payload });
  });

  return r;
}

