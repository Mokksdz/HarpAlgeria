/**
 * Structured logging module.
 * Outputs JSON in production for log aggregation.
 * Outputs human-readable format in development.
 */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";
const isDebugEnabled = process.env.DEBUG === "true";

type LogLevel = "debug" | "info" | "warn" | "error";

function formatMessage(
  level: LogLevel,
  prefix: string,
  args: unknown[],
): string {
  const timestamp = new Date().toISOString();

  if (isProd) {
    // Structured JSON output for production log aggregation
    const entry: Record<string, unknown> = {
      timestamp,
      level,
      context: prefix,
      message: args.length > 0 && typeof args[0] === "string" ? args[0] : undefined,
    };
    // Attach error details if present
    const err = args.find((a) => a instanceof Error) as Error | undefined;
    if (err) {
      entry.error = { name: err.name, message: err.message };
    }
    // Attach extra data
    const data = args.find((a) => typeof a === "object" && a !== null && !(a instanceof Error));
    if (data) {
      entry.data = data;
    }
    return JSON.stringify(entry);
  }

  const prefixStr = prefix ? `[${prefix}]` : "";
  return `${timestamp} ${level.toUpperCase()} ${prefixStr}`;
}

function shouldLog(level: LogLevel, forceLog?: boolean): boolean {
  if (forceLog) return true;
  if (isDev) return true;
  if (isDebugEnabled) return true;
  // In production, only log warnings and errors
  return level === "warn" || level === "error";
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string) {
  return {
    debug: (...args: unknown[]) => {
      if (shouldLog("debug")) {
        if (isProd) { console.debug(formatMessage("debug", namespace, args)); }
        else { console.debug(formatMessage("debug", namespace, args), ...args); }
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog("info")) {
        if (isProd) { console.info(formatMessage("info", namespace, args)); }
        else { console.info(formatMessage("info", namespace, args), ...args); }
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog("warn")) {
        if (isProd) { console.warn(formatMessage("warn", namespace, args)); }
        else { console.warn(formatMessage("warn", namespace, args), ...args); }
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog("error", true)) {
        if (isProd) { console.error(formatMessage("error", namespace, args)); }
        else { console.error(formatMessage("error", namespace, args), ...args); }
      }
    },
  };
}

/**
 * Default application logger
 */
export const logger = createLogger("Harp");

/**
 * API logger for route handlers
 */
export const apiLogger = createLogger("API");

/**
 * Auth logger
 */
export const authLogger = createLogger("Auth");

/**
 * Database logger
 */
export const dbLogger = createLogger("DB");

export default logger;
