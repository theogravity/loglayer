import { LogBuilder } from './LogBuilder'
import type { LoggerLibrary, ErrorOnlyOpts } from './types'
import {
  ErrorDataType,
  ILogLayer,
  LoggerType,
  LogLayerConfig,
  LogLayerContextConfig,
  LogLayerErrorConfig,
  LogLayerMetadataConfig,
  LogLevel,
  MessageDataType,
} from './types'

interface FormatLogParams {
  logLevel: LogLevel
  params?: any[]
  data?: Record<string, any>
}

export interface LogLayerInternalConfig<ErrorType> {
  error: LogLayerErrorConfig<ErrorType>
  metadata: LogLayerMetadataConfig
  context: LogLayerContextConfig
}

/**
 * Wraps around a logging framework to provide convenience methods that allow
 * developers to programmatically specify their errors and metadata along with
 * a message in a consistent fashion.
 */
export class LogLayer<ExternalLogger extends LoggerLibrary = LoggerLibrary, ErrorType extends Error = ErrorDataType>
  implements ILogLayer<ExternalLogger, ErrorType>
{
  private loggerInstance: LoggerLibrary
  private loggerType: LoggerType
  private context: Record<string, any>
  private hasContext: boolean

  _config: LogLayerInternalConfig<ErrorType>

  constructor({ logger, error, context, metadata }: LogLayerConfig<ErrorType>) {
    this.loggerInstance = logger.instance
    this.loggerType = logger?.type || LoggerType.OTHER

    this.context = {}
    this.hasContext = false
    this._config = {
      error: error || {},
      context: context || {},
      metadata: metadata || {},
    }

    if (!this._config.error.fieldName) {
      this._config.error.fieldName = 'err'
    }

    if (!this._config.error.copyMsgOnOnlyError) {
      this._config.error.copyMsgOnOnlyError = false
    }
  }

  /**
   * Appends context data which will be included with
   * every log entry.
   */
  withContext(context: Record<string, any>) {
    this.context = {
      ...this.context,
      ...context,
    }

    this.hasContext = true
  }

  /**
   * Specifies metadata to include with the log message
   */
  withMetadata(metadata: Record<string, any>) {
    return new LogBuilder<ExternalLogger, ErrorType>(this).withMetadata(metadata)
  }

  /**
   * Specifies an Error to include with the log message
   */
  withError(error: ErrorType) {
    return new LogBuilder<ExternalLogger, ErrorType>(this).withError(error)
  }

  /**
   * Logs only the error object without a log message
   */
  errorOnly(error: ErrorType, opts?: ErrorOnlyOpts) {
    const { error: errConfig } = this._config

    const formatLogConf: FormatLogParams = {
      logLevel: opts?.logLevel || LogLevel.error,
      data: {
        [errConfig.fieldName]: errConfig.serializer ? errConfig.serializer(error) : error,
      },
    }

    if (this.loggerType === LoggerType.ROARR) {
      // Roarr needs a message defined
      formatLogConf.params = ['']
    }

    // Copy the error message as the log message
    if (((errConfig.copyMsgOnOnlyError && opts?.copyMsg !== false) || opts?.copyMsg === true) && error.message) {
      formatLogConf.params = [error.message]
    }

    this._formatLog(formatLogConf)
  }

  /**
   * Logs only metadata without a log message
   */
  metadataOnly(metadata: Record<string, any>, logLevel: LogLevel = LogLevel.info) {
    const config: FormatLogParams = {
      logLevel,
      data: metadata,
    }

    if (this.loggerType === LoggerType.ROARR) {
      // Roarr needs a message defined
      config.params = ['']
    }

    this._formatLog(config)
  }

  /**
   * Sends a log message to the logging library under an info log level.
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  info(...messages: MessageDataType[]) {
    this._formatLog({ logLevel: LogLevel.info, params: messages })
  }

  /**
   * Sends a log message to the logging library under the warn log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  warn(...messages: MessageDataType[]) {
    this._formatLog({ logLevel: LogLevel.warn, params: messages })
  }

  /**
   * Sends a log message to the logging library under the error log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  error(...messages: MessageDataType[]) {
    this._formatLog({ logLevel: LogLevel.error, params: messages })
  }

  /**
   * Sends a log message to the logging library under the debug log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  debug(...messages: MessageDataType[]) {
    this._formatLog({ logLevel: LogLevel.debug, params: messages })
  }

  /**
   * Sends a log message to the logging library under the trace log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  trace(...messages: MessageDataType[]) {
    this._formatLog({ logLevel: LogLevel.trace, params: messages })
  }

  /**
   * Returns the underlying log instance
   */
  getLoggerInstance(): ExternalLogger {
    return this.loggerInstance as ExternalLogger
  }

  private formatContext() {
    const { context: contextCfg } = this._config

    if (this.hasContext) {
      if (contextCfg.fieldName) {
        return {
          [contextCfg.fieldName]: {
            ...this.context,
          },
        }
      }

      return {
        ...this.context,
      }
    }

    return {}
  }

  private formatMetadata(data = null) {
    const { metadata: metadataCfg } = this._config

    if (data) {
      if (metadataCfg.fieldName) {
        return {
          [metadataCfg.fieldName]: {
            ...data,
          },
        }
      }

      return {
        ...data,
      }
    }

    return {}
  }

  _formatLog({ logLevel, params = [], data = null }: FormatLogParams) {
    const hasObjData = !!data || this.hasContext
    let d = {}

    if (hasObjData) {
      d = {
        ...this.formatContext(),
        ...this.formatMetadata(data),
      }
    }

    if (hasObjData) {
      switch (this.loggerType) {
        case LoggerType.WINSTON:
          // Winston wants the data object to be the last parameter
          params.push(d)
          break
        default:
          // most loggers put object data as the first parameter
          params.unshift(d)
      }
    }

    switch (logLevel) {
      case LogLevel.info:
        this.loggerInstance.info(...params)
        break
      case LogLevel.warn:
        this.loggerInstance.warn(...params)
        break
      case LogLevel.error:
        this.loggerInstance.error(...params)
        break
      case LogLevel.trace:
        // Winston does not have a trace type
        if (this.loggerType === LoggerType.WINSTON) {
          this.loggerInstance.debug(...params)
        } else {
          this.loggerInstance.trace(...params)
        }
        break
      case LogLevel.debug:
        this.loggerInstance.debug(...params)
        break
      default:
        // @ts-ignore
        this.loggerInstance[logLevel](...params)
    }
  }
}
