import { z } from "zod";

export const gitStatusSchema = z.object({
  path: z.string().optional(),
});

export const gitDiffSchema = z.object({
  path: z.string().optional(),
  staged: z.boolean().optional(),
});

export const gitLogSchema = z.object({
  path: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const gitBlameSchema = z.object({
  file: z.string(),
});

export const projectTreeSchema = z.object({
  path: z.string().optional(),
  depth: z.number().int().positive().max(10).optional(),
});

export const readFileSchema = z.object({
  path: z.string(),
});

export const searchFilesSchema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
  glob: z.string().optional(),
});

export const runCommandSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
});
