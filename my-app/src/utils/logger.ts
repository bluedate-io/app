// ─── Minimal structured logger ────────────────────────────────────────────────
// Replace with winston / pino in production as needed.

import { config } from "@/config";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

function log(level: LogLevel, message: string, data?: unknown, context?: string) {
  if (level === "debug" && config.isProd) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
    ...(data !== undefined && { data }),
  };

  const output = config.isProd ? JSON.stringify(entry) : formatDev(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

function formatDev(entry: LogEntry): string {
  const color =
    entry.level === "error"
      ? "\x1b[31m"
      : entry.level === "warn"
        ? "\x1b[33m"
        : entry.level === "info"
          ? "\x1b[36m"
          : "\x1b[90m";
  const reset = "\x1b[0m";
  const ctx = entry.context ? ` [${entry.context}]` : "";
  const data = entry.data ? `\n  ${JSON.stringify(entry.data, null, 2)}` : "";
  return `${color}${entry.level.toUpperCase()}${reset}${ctx} ${entry.message}${data}`;
}

export const logger = {
  debug: (message: string, data?: unknown, context?: string) =>
    log("debug", message, data, context),
  info: (message: string, data?: unknown, context?: string) =>
    log("info", message, data, context),
  warn: (message: string, data?: unknown, context?: string) =>
    log("warn", message, data, context),
  error: (message: string, data?: unknown, context?: string) =>
    log("error", message, data, context),

  // Returns a child logger bound to a fixed context label
  child: (context: string) => ({
    debug: (message: string, data?: unknown) => log("debug", message, data, context),
    info: (message: string, data?: unknown) => log("info", message, data, context),
    warn: (message: string, data?: unknown) => log("warn", message, data, context),
    error: (message: string, data?: unknown) => log("error", message, data, context),
  }),
};
