/**
 * Production-safe logger
 * Logs are suppressed in production unless explicitly enabled
 */

const isDev = process.env.NODE_ENV === "development";
const isDebugEnabled = process.env.DEBUG === "true";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  prefix?: string;
  forceLog?: boolean;
}

function formatMessage(level: LogLevel, prefix: string, args: unknown[]): string {
  const timestamp = new Date().toISOString();
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
        console.debug(formatMessage("debug", namespace, args), ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog("info")) {
        console.info(formatMessage("info", namespace, args), ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog("warn")) {
        console.warn(formatMessage("warn", namespace, args), ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog("error", true)) {
        console.error(formatMessage("error", namespace, args), ...args);
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
