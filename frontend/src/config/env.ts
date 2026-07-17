import { z } from 'zod'

/**
 * Validated public frontend environment.
 * Import `env` anywhere instead of reading process.env directly.
 *
 * Empty NEXT_PUBLIC_API_BASE_URL uses same-origin /api (Next rewrite → Nest),
 * which is required for httpOnly auth cookies on the frontend host.
 */
const envSchema = z.object({
   NEXT_PUBLIC_API_BASE_URL: z.string().default(''),
   NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
})

export type ClientEnv = z.infer<typeof envSchema>

function createEnv(): ClientEnv {
   const parsed = envSchema.safeParse({
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
      NODE_ENV: process.env.NODE_ENV,
   })

   if (!parsed.success) {
      const details = parsed.error.issues
         .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
         .join('\n')
      throw new Error(`Invalid frontend environment:\n${details}`)
   }

   return parsed.data
}

export const env = createEnv()
