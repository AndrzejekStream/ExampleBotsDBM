type Level = "info" | "warn" | "error";

export const logger = {
  log(level: Level, message: string, meta?: Record<string, unknown>) {
    const payload = meta ? ` | ${JSON.stringify(meta)}` : "";
    const line = `[${level.toUpperCase()}] ${message}${payload}`;
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  },
  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    this.log("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    this.log("error", message, meta);
  }
};
