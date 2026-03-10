import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

// ── Generic validation middleware factory ─────────────────────────────────────
export const validate = (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const details = (result.error as ZodError).issues.map(i => ({
                field: i.path.join('.'),
                message: i.message,
            }));
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                code: 'VALIDATION_ERROR',
                status: 400,
                details,
            });
        }
        // Replace req.body with sanitized, coerced data
        req.body = result.data;
        return next();
    };

// ── Pre-built schemas ─────────────────────────────────────────────────────────

export const analyzeSchema = z.object({
    text: z.string().min(10, 'Text must be at least 10 characters').max(5000, 'Text must not exceed 5000 characters').trim(),
    projectId: z.string().uuid('projectId must be a valid UUID').optional(),
});

export const batchSchema = z.object({
    projectId: z.string().uuid('projectId must be a valid UUID').optional(),
});

export const projectSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').trim(),
    description: z.string().max(500, 'Description must not exceed 500 characters').trim().optional(),
});

export const apiKeySchema = z.object({
    name: z.string().min(1, 'Key name is required').max(50, 'Key name must not exceed 50 characters').trim(),
});

// Types inferred from schemas — useful in route handlers
export type AnalyzeBody = z.infer<typeof analyzeSchema>;
export type BatchBody = z.infer<typeof batchSchema>;
export type ProjectBody = z.infer<typeof projectSchema>;
export type ApiKeyBody = z.infer<typeof apiKeySchema>;
