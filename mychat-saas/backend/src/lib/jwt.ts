import jwt from "jsonwebtoken";

export type JwtUser = { sub: string; email: string; name: string };

export function signAccessToken(payload: JwtUser, secret: string, expiresIn: string) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function signRefreshToken(payload: JwtUser, secret: string, expiresIn: string) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken<T>(token: string, secret: string): T {
  return jwt.verify(token, secret) as T;
}

