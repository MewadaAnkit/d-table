import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/attendly'),
  JWT_SECRET: z.string().min(16).default('attendly_super_secure_jwt_secret_key_2026!'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  TIMEZONE: z.string().default('UTC'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), 'uploads')),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
  OFFICE_LAT: z.coerce.number().default(37.774929),
  OFFICE_LNG: z.coerce.number().default(-122.419416),
  GEOFENCE_RADIUS_METERS: z.coerce.number().default(1000), // 1km radius
  ENFORCE_GEOFENCE: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
