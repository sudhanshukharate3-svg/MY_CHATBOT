import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtUser } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function requireAuth(jwtAccessSecret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = verifyToken<JwtUser>(token, jwtAccessSecret);
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

