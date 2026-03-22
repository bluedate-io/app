import * as Sentry from "@sentry/nextjs";
import { config } from "@/config";

export async function register() {
  if (!config.sentry.enabled || !config.sentry.dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError =
  config.sentry.enabled && config.sentry.dsn
    ? Sentry.captureRequestError
    : undefined;