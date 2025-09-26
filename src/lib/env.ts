/**
 * Centralized environment variable validation
 */

import { z } from 'zod';

const csvToArray = (value?: string | null) =>
  value
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url().optional(),
    ALLOW_MISSING_REFERER: z
      .string()
      .default('true')
      .transform((value) => value.toLowerCase() !== 'false'),
    ALLOWED_IPS: z.string().optional(),
    ALLOWED_ORIGINS: z.string().optional(),
    CSP_ADDITIONAL_SCRIPT_SRC: z.string().optional(),
    CSP_ADDITIONAL_CONNECT_SRC: z.string().optional(),
    CSP_ADDITIONAL_FRAME_SRC: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      const requiredInProduction: Array<keyof typeof data> = [
        'NEXTAUTH_SECRET',
        'DATABASE_URL',
        'NEXTAUTH_URL',
        'NEXT_PUBLIC_APP_URL',
      ];

      for (const key of requiredInProduction) {
        if (!data[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${String(key)} is required in production`,
            path: [key],
          });
        }
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed', parsed.error.flatten());
  throw new Error('Invalid environment configuration');
}

const {
  ALLOW_MISSING_REFERER,
  ALLOWED_IPS,
  ALLOWED_ORIGINS,
  CSP_ADDITIONAL_CONNECT_SRC,
  CSP_ADDITIONAL_FRAME_SRC,
  CSP_ADDITIONAL_SCRIPT_SRC,
  ...rest
} = parsed.data;

export const env = {
  ...rest,
  NEXTAUTH_SECRET: parsed.data.NEXTAUTH_SECRET ?? 'development-secret',
  allowMissingReferer: ALLOW_MISSING_REFERER,
  allowedIPs: csvToArray(ALLOWED_IPS),
  allowedOrigins: csvToArray(ALLOWED_ORIGINS),
  cspAdditionalScriptSrc: csvToArray(CSP_ADDITIONAL_SCRIPT_SRC),
  cspAdditionalConnectSrc: csvToArray(CSP_ADDITIONAL_CONNECT_SRC),
  cspAdditionalFrameSrc: csvToArray(CSP_ADDITIONAL_FRAME_SRC),
};
