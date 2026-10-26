import './env';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Falls back to a random secret in dev so the server never crashes;
// in production always set JWT_SECRET.
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions;
  return jwt.sign(payload, SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}
