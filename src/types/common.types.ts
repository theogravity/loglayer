export enum LogLevel {
  info = "info",
  warn = "warn",
  error = "error",
  debug = "debug",
  trace = "trace",
  fatal = "fatal",
}

/**
 * Specifies the type of logging library used.
 */
export enum LoggerType {
  OTHER = "other",
  WINSTON = "winston",
  ELECTRON_LOG = "electronLog",
  ROARR = "roarr",
  PINO = "pino",
  BUNYAN = "bunyan",
  LOG4JS_NODE = "log4js-node",
  CONSOLE = "console",
}

export type MessageDataType = string | number | null | undefined;
export type ErrorDataType = any;
