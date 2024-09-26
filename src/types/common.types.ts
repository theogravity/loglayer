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
  BUNYAN = "bunyan",
  CONSOLA = "consola",
  CONSOLE = "console",
  ELECTRON_LOG = "electronLog",
  LOG4JS_NODE = "log4js-node",
  PINO = "pino",
  ROARR = "roarr",
  SIGNALE = "signale",
  WINSTON = "winston",
  OTHER = "other",
  DATADOG_BROWSER_LOGS = "datadog-browser",
}

export type MessageDataType = string | number | null | undefined;
export type ErrorDataType = any;
