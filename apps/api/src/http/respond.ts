import { Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates response data against a Zod schema before sending.
 * Prevents silent data corruption by catching schema mismatches early.
 *
 * @param res Express response object
 * @param schema Zod schema to validate response against
 * @param data The data to validate and send
 * @param statusCode HTTP status code (default 200)
 * @returns Never (calls res.json or res.status)
 */
export function respondWithSchema<T>(
  res: Response,
  schema: ZodSchema,
  data: unknown,
  statusCode: number = 200
): Response {
  const validated = schema.safeParse(data);

  if (!validated.success) {
    const errorMsg = `SERVER_RESPONSE_SCHEMA_MISMATCH: ${JSON.stringify(validated.error.flatten())}`;
    console.error(errorMsg);
    return res.status(500).json({
      error: 'Internal server error: response validation failed',
      code: 'SERVER_RESPONSE_SCHEMA_MISMATCH'
    });
  }

  return res.status(statusCode).json(validated.data);
}
