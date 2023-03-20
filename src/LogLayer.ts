import { LogBuilder } from './LogBuilder'
import type { LoggerLibrary, ErrorOnlyOpts } from './types'
import {
  ErrorDataType,
  ILogLayer,
  LoggerType,
  LogLayerConfig,
  LogLayerContextConfig,
  LogLayerErrorConfig,
  LogLayerHooksConfig,
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
  enabled: boolean
  consoleDebug?: boolean
  error: LogLayerErrorConfig<ErrorType>
  metadata: LogLayerMetadataConfig
  context: LogLayerContextConfig
  hooks: LogLayerHooksConfig
  prefix?: string
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

  constructor({ enabled, logger, error, context, metadata, hooks, consoleDebug, prefix }: LogLayerConfig<ErrorType>) {
    this.loggerInstance = logger.instance
    this.loggerType = logger?.type || LoggerType.OTHER

    this.context = {}
    this.hasContext = false
    this._config = {
      enabled: enabled ?? true,
      consoleDebug: consoleDebug ?? false,
      error: error || {},
      context: context || {},
      metadata: metadata || {},
      hooks: hooks || {},
      prefix: prefix || '',
    }

    if (!this._config.error.fieldName) {
      this._config.error.fieldName = 'err'
    }

    if (!this._config.error.copyMsgOnOnlyError) {
      this._config.error.copyMsgOnOnlyError = false
    }
  }

  /**
   * Calls child() and sets the prefix to be included with every log message.
   */
  withPrefix(prefix: string): LogLayer<ExternalLogger, ErrorType> {
    const logger = this.child()
    logger._config.prefix = prefix

    return logger
  }

  /**
   * Appends context data which will be included with
   * every log entry.
   */
  withContext(context: Record<string, any>): LogLayer<ExternalLogger, ErrorType> {
    this.context = {
      ...this.context,
      ...context,
    }

    this.hasContext = true

    return this
  }

  /**
   * Returns the context used for the logger
   */
  getContext() {
    return this.context
  }

  /**
   * Update hook callback definitions. This is an alternative
   * to the `hooks` config option. Only hooks defined will be replaced.
   */
  setHooks(hooks: LogLayerHooksConfig) {
    this._config.hooks = {
      ...this._config.hooks,
      ...hooks,
    }
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
   * Creates a new instance of LogLayer but with the initialization
   * configuration and context copied over.
   */
  child() {
    if (this.hasContext) {
      return new LogLayer<ExternalLogger, ErrorType>({
        ...this._config,
        logger: {
          instance: this.loggerInstance,
          type: this.loggerType,
        },
      }).withContext({
        ...this.context,
      })
    }

    return new LogLayer<ExternalLogger, ErrorType>({
      ...this._config,
      logger: {
        instance: this.loggerInstance,
        type: this.loggerType,
      },
    })
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
    this._formatMessage(messages)
    this._formatLog({ logLevel: LogLevel.info, params: messages })
  }

  /**
   * Sends a log message to the logging library under the warn log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  warn(...messages: MessageDataType[]) {
    this._formatMessage(messages)
    this._formatLog({ logLevel: LogLevel.warn, params: messages })
  }

  /**
   * Sends a log message to the logging library under the error log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  error(...messages: MessageDataType[]) {
    this._formatMessage(messages)
    this._formatLog({ logLevel: LogLevel.error, params: messages })
  }

  /**
   * Sends a log message to the logging library under the debug log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  debug(...messages: MessageDataType[]) {
    this._formatMessage(messages)
    this._formatLog({ logLevel: LogLevel.debug, params: messages })
  }

  /**
   * Sends a log message to the logging library under the trace log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  trace(...messages: MessageDataType[]) {
    this._formatMessage(messages)
    this._formatLog({ logLevel: LogLevel.trace, params: messages })
  }

  /**
   * All logging inputs are dropped and stops sending logs to the logging library.
   */
  disableLogging() {
    this._config.enabled = false
    return this
  }

  /**
   * Enable sending logs to the logging library.
   */
  enableLogging() {
    this._config.enabled = true
    return this
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

  _formatMessage(messages = []) {
    if (this._config.prefix && typeof messages[0] === 'string') {
      messages[0] = `${this._config.prefix} ${messages[0]}`
    }
  }

  _formatLog({ logLevel, params = [], data = null }: FormatLogParams) {
    if (!this._config.enabled) {
      return
    }

    const hasObjData = !!data || this.hasContext
    let d = {}

    if (hasObjData) {
      // Field names for context and metadata is the same, merge the metadata into the same field name
      if (this._config.context.fieldName && this._config.context.fieldName === this._config.metadata.fieldName) {
        const contextData = this.formatContext()[this._config.context.fieldName]
        const metadata = this.formatMetadata(data)[this._config.metadata.fieldName]

        d = {
          [this._config.context.fieldName]: {
            ...contextData,
            ...metadata,
          },
        }
      } else {
        d = {
          ...this.formatContext(),
          ...this.formatMetadata(data),
        }
      }
    }

    if (this._config.hooks.onBeforeDataOut) {
      d = this._config.hooks.onBeforeDataOut(hasObjData ? d : undefined)
    }

    if (this._config.hooks.shouldSendToLogger) {
      const shouldSend = this._config.hooks.shouldSendToLogger({
        messages: params,
        data: hasObjData ? d : undefined,
        logLevel,
      })

      if (!shouldSend) {
        return
      }
    }

    if (d && hasObjData) {
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
        if (this._config.consoleDebug) {
          console.info(...params)
        }
        this.loggerInstance.info(...params)
        break
      case LogLevel.warn:
        if (this._config.consoleDebug) {
          console.warn(...params)
        }
        this.loggerInstance.warn(...params)
        break
      case LogLevel.error:
        if (this._config.consoleDebug) {
          console.error(...params)
        }
        this.loggerInstance.error(...params)
        break
      case LogLevel.trace:
        if (this._config.consoleDebug) {
          console.debug(...params)
        }
        // Winston does not have a trace type
        if (this.loggerType === LoggerType.WINSTON) {
          this.loggerInstance.debug(...params)
        } else {
          this.loggerInstance.trace(...params)
        }
        break
      case LogLevel.debug:
        if (this._config.consoleDebug) {
          console.debug(...params)
        }
        this.loggerInstance.debug(...params)
        break
      default:
        if (this._config.consoleDebug) {
          console.log(...params)
        }
        // @ts-ignore
        this.loggerInstance[logLevel](...params)
    }
  }
}
