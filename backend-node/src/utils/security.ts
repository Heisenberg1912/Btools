import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { config } from '../config/index.js';

const secretKey = new TextEncoder().encode(config.SECRET_KEY);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch {
    return false;
  }
}

export async function createAccessToken(userId: string): Promise<string> {
  return new jose.SignJWT({ sub: userId, type: 'access' })
    .setProtectedHeader({ alg: config.ALGORITHM })
    .setExpirationTime(`${config.ACCESS_TOKEN_EXPIRE_MINUTES}m`)
    .sign(secretKey);
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new jose.SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: config.ALGORITHM })
    .setExpirationTime(`${config.REFRESH_TOKEN_EXPIRE_DAYS}d`)
    .sign(secretKey);
}

export interface TokenPayload {
  sub: string;
  type: 'access' | 'refresh';
  exp?: number;
}

export async function decodeToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms: [config.ALGORITHM],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
