type LogMeta = Record<string, unknown>;

function line(level: string, message: string, meta?: LogMeta) {
  const stamp = new Date().toISOString();
  if (meta && Object.keys(meta).length) {
    console[level === "error" ? "error" : "log"](
      `[${stamp}] ${level.toUpperCase()} ${message}`,
      meta,
    );
    return;
  }
  console[level === "error" ? "error" : "log"](
    `[${stamp}] ${level.toUpperCase()} ${message}`,
  );
}

export const logger = {
  info: (message: string, meta?: LogMeta) => line("info", message, meta),
  warn: (message: string, meta?: LogMeta) => line("warn", message, meta),
  error: (message: string, meta?: LogMeta) => line("error", message, meta),
};
