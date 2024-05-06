import type { LogLayer } from "./LogLayer";
import type { ErrorDataType, ILogBuilder, LoggerLibrary, MessageDataType } from "./types";
import { LogLevel } from "./types";

/**
 * A class that contains methods to specify log metadata and an error and assembles
 * it together to form a data object that can be passed into the logger.
 */
export class LogBuilder<ExternalLogger extends LoggerLibrary = LoggerLibrary, ErrorType extends Error = ErrorDataType>
  implements ILogBuilder
{
  private err: ErrorType | null;
  private metadata: Record<string, any>;
  private structuredLogger: LogLayer<ExternalLogger, ErrorType>;
  private hasMetadata: boolean;

  constructor(structuredLogger: LogLayer<ExternalLogger, ErrorType>) {
    this.err = null;
    this.metadata = {};
    this.structuredLogger = structuredLogger;
    this.hasMetadata = false;
  }

  /**
   * Adds metadata to the current log entry
   */
  withMetadata(metadata: Record<string, any>) {
    this.metadata = {
      ...this.metadata,
      ...metadata,
    };

    this.hasMetadata = true;

    return this;
  }

  /**
   * Adds an error to the current log entry
   */
  withError(error: ErrorType) {
    this.err = error;
    return this;
  }

  /**
   * Sends a log message to the logging library under an info log level.
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  info(...messages: MessageDataType[]) {
    this.structuredLogger._formatMessage(messages);
    this.formatLog(LogLevel.info, messages);
  }

  /**
   * Sends a log message to the logging library under the warn log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  warn(...messages: MessageDataType[]) {
    this.structuredLogger._formatMessage(messages);
    this.formatLog(LogLevel.warn, messages);
  }

  /**
   * Sends a log message to the logging library under the error log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  error(...messages: MessageDataType[]) {
    this.structuredLogger._formatMessage(messages);
    this.formatLog(LogLevel.error, messages);
  }

  /**
   * Sends a log message to the logging library under the debug log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  debug(...messages: MessageDataType[]) {
    this.structuredLogger._formatMessage(messages);
    this.formatLog(LogLevel.debug, messages);
  }

  /**
   * Sends a log message to the logging library under the trace log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  trace(...messages: MessageDataType[]) {
    this.structuredLogger._formatMessage(messages);
    this.formatLog(LogLevel.trace, messages);
  }

  /**
   * Sends a log message to the logging library under the fatal log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  fatal(...messages: MessageDataType[]) {
    this.structuredLogger._formatMessage(messages);
    this.formatLog(LogLevel.fatal, messages);
  }

  /**
   * All logging inputs are dropped and stops sending logs to the logging library.
   */
  disableLogging() {
    this.structuredLogger._config.enabled = false;
    return this;
  }

  /**
   * Enable sending logs to the logging library.
   */
  enableLogging() {
    this.structuredLogger._config.enabled = true;
    return this;
  }

  private formatLog(logLevel: LogLevel, params: any[]) {
    const { error: errConfig, muteMetadata } = this.structuredLogger._config;

    const hasData = (muteMetadata ? false : this.hasMetadata) || !!this.err;

    const data = {
      ...this.metadata,
    };

    if (this.err && errConfig.fieldName) {
      data[errConfig.fieldName] = errConfig.serializer ? errConfig.serializer(this.err) : this.err;
    }

    this.structuredLogger._formatLog({ logLevel, params, data: hasData ? data : null });
  }
}
