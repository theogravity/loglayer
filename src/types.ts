/**
 * Logging methods that are common to logging libraries
 */
export interface LoggerLibrary {
  info(...data: any[]): void
  warn(...data: any[]): void
  error(...data: any[]): void
  trace?: (...data: any[]) => void
  debug(...data: any[]): void
}

export type MessageDataType = string | number | null | undefined
export type ErrorDataType = any

export interface ILogBuilder {
  /**
   * Sends a log message to the logging library under an info log level.
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  info(...messages: MessageDataType[]): void
  /**
   * Sends a log message to the logging library under the warn log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  warn(...messages: MessageDataType[]): void
  /**
   * Sends a log message to the logging library under the error log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  error(...messages: MessageDataType[]): void
  /**
   * Sends a log message to the logging library under the debug log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  debug(...messages: MessageDataType[]): void
  /**
   * Sends a log message to the logging library under the trace log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  trace(...messages: MessageDataType[]): void
}

export interface ILogLayer<ExternalLogger extends LoggerLibrary = LoggerLibrary, ErrorType = ErrorDataType>
  extends ILogBuilder {
  /**
   * Appends context data which will be included with
   * every log entry.
   */
  withContext(context: Record<string, any>): ILogLayer<ExternalLogger, ErrorType>
  /**
   * Specifies metadata to include with the log message
   */
  withMetadata(metadata: Record<string, any>): ILogBuilder
  /**
   * Specifies an Error to include with the log message
   */
  withError(error: ErrorType): ILogBuilder
  /**
   * Logs only the error object without a log message
   */
  errorOnly(error: ErrorType, opts?: ErrorOnlyOpts): void
  /**
   * Logs only metadata without a log message
   */
  metadataOnly(metadata: Record<string, any>, logLevel: LogLevel): void

  /**
   * Returns the underlying log instance
   */
  getLoggerInstance(): ExternalLogger

  /**
   * Returns the context used for the logger
   */
  getContext(): Record<string, any>
}

export enum LogLevel {
  info = 'info',
  warn = 'warn',
  error = 'error',
  debug = 'debug',
  trace = 'trace',
}

/**
 * Specifies the type of logging library used.
 */
export enum LoggerType {
  OTHER = 'other',
  WINSTON = 'winston',
  ROARR = 'roarr',
  PINO = 'pino',
  BUNYAN = 'bunyan',
  CONSOLE = 'console',
}

export type ErrorSerializerType<ErrorType> = (err: ErrorType) => Record<string, any> | string

export interface ErrorOnlyOpts {
  /**
   * Sets the log level of the error
   */
  logLevel?: LogLevel
  /**
   * If `true`, copies the `error.message` if available to the logger library's
   * message property.
   *
   * If the config option `error.copyMsgOnOnlyError` is enabled, this property
   * can be set to `true` to disable the behavior for this specific log entry.
   */
  copyMsg?: boolean
}

export interface LogLayerErrorConfig<ErrorType> {
  /**
   * A function that takes in an incoming Error type and transforms it into an object.
   * Used in the event that the logging library does not natively support serialization of errors.
   */
  serializer?: ErrorSerializerType<ErrorType>
  /**
   * Logging libraries may require a specific field name for errors so it knows
   * how to parse them.
   *
   * Default is 'err'.
   */
  fieldName?: string
  /**
   * If true, always copy error.message if available as a log message along
   * with providing the error data to the logging library.
   *
   * Can be overridden individually by setting `copyMsg: false` in the `onlyError()`
   * call.
   *
   * Default is false.
   */
  copyMsgOnOnlyError?: boolean
}

export interface LogLayerContextConfig {
  /**
   * If specified, will set the context object to a specific field
   * instead of flattening the data alongside the error and message.
   *
   * Default is context data will be flattened.
   */
  fieldName?: string
}

export interface LogLayerMetadataConfig {
  /**
   * If specified, will set the metadata data to a specific field
   * instead of flattening the data alongside the error and message.
   *
   * Default is metadata will be flattened.
   */
  fieldName?: string
}

export interface LogLayerConfig<ErrorType = ErrorDataType> {
  logger: {
    /**
     * The instance of the logging library to send log data and messages to
     */
    instance: LoggerLibrary
    /**
     * The instance type of the logging library being used
     */
    type: LoggerType
  }
  error?: LogLayerErrorConfig<ErrorType>
  metadata?: LogLayerMetadataConfig
  context?: LogLayerContextConfig
}
