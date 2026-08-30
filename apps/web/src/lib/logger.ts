type LogContext = Record<string, unknown>;

export function log(event: string, context: LogContext = {}) {
  console.info(JSON.stringify({
    service: "aamish-web",
    event,
    timestamp: new Date().toISOString(),
    ...context,
  }));
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  console.error(JSON.stringify({
    service: "aamish-web",
    level: "error",
    event,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    ...context,
  }));
}
