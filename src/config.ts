import { z } from "zod";

const configSchema = z.object({
  PROJECT_ROOT: z
    .string()
    .min(1)
    .default(process.cwd()),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): Config {
  return configSchema.parse({
    PROJECT_ROOT: env.PROJECT_ROOT || process.cwd(),
    LOG_LEVEL: env.LOG_LEVEL || "info",
  });
}

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

export function createLogger(level: Config["LOG_LEVEL"]) {
  const threshold = LOG_LEVELS[level];
  return {
    debug: (...args: unknown[]) => {
      if (threshold <= 0) process.stderr.write(`[DEBUG] ${args.join(" ")}\n`);
    },
    info: (...args: unknown[]) => {
      if (threshold <= 1) process.stderr.write(`[INFO] ${args.join(" ")}\n`);
    },
    warn: (...args: unknown[]) => {
      if (threshold <= 2) process.stderr.write(`[WARN] ${args.join(" ")}\n`);
    },
    error: (...args: unknown[]) => {
      if (threshold <= 3) process.stderr.write(`[ERROR] ${args.join(" ")}\n`);
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
