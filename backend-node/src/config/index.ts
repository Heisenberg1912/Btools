import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from backend-node)
// In production/Vercel, env vars are injected directly
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  // App
  APP_NAME: z.string().default('VitruviAI'),
  APP_VERSION: z.string().default('1.0.0'),
  DEBUG: z.string().transform(v => v === 'true').default('false'),
  PORT: z.string().transform(Number).default('3001'),

  // MongoDB
  MONGODB_URI: z.string().optional(),
  MONGODB_DB: z.string().default('Titiksha-builtattic'),

  // JWT - MUST match Python for SSO
  SECRET_KEY: z.string().default('a3f8c9d2b7e1a0f35c4d7e8a92b1c0d4e7f6a5b31c2d3e4f8a9b0c1df0e1d2c3'),
  ALGORITHM: z.string().default('HS256'),
  ACCESS_TOKEN_EXPIRE_MINUTES: z.string().transform(Number).default('30'),
  REFRESH_TOKEN_EXPIRE_DAYS: z.string().transform(Number).default('7'),

  // Gemini
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3-pro-preview'),
  GEMINI_IMAGE_MODEL: z.string().default('gemini-3-pro-image-preview'),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379/0'),

  // CORS - No longer used (origin: true allows all)
  // Kept for backwards compatibility
  CORS_ORIGINS: z.string().optional(),

  // Marketplace Integration
  MARKETPLACE_URL: z.string().default('http://localhost:5175'),
  CLIENT_BASE_URL: z.string().default('http://localhost:5173'),

  // File Storage
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE: z.string().transform(Number).default('10485760'),

  // Free Tier Limits
  FREE_SCAN_LIMIT: z.string().transform(Number).default('3'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  // CORS_ORIGINS_ARRAY kept for backwards compatibility but not used
  CORS_ORIGINS_ARRAY: parsed.data.CORS_ORIGINS?.split(',').map(s => s.trim()) || ['*'],
};

export type Config = typeof config;
