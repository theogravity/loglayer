import { LogBuilder } from "./LogBuilder";
import { PluginManager } from "./plugins/PluginManager";
import {
  type ErrorDataType,
  type ErrorOnlyOpts,
  type ILogLayer,
  type LogLayerConfig,
  type LogLayerContextConfig,
  type LogLayerErrorConfig,
  type LogLayerMetadataConfig,
  type LogLayerPlugin,
  LogLevel,
  type LoggerLibrary,
  LoggerType,
  type MessageDataType,
  PluginCallbackType,
} from "./types";

interface FormatLogParams {
  logLevel: LogLevel;
  params?: any[];
  data?: Record<string, any> | null;
}

export interface LogLayerInternalConfig<ErrorType> {
  enabled: boolean;
  consoleDebug?: boolean;
  error: LogLayerErrorConfig<ErrorType>;
  metadata: LogLayerMetadataConfig;
  context: LogLayerContextConfig;
  prefix?: string;
  muteContext?: boolean;
  muteMetadata?: boolean;
}

/**
 * Wraps around a logging framework to provide convenience methods that allow
 * developers to programmatically specify their errors and metadata along with
 * a message in a consistent fashion.
 */
export class LogLayer<ExternalLogger extends LoggerLibrary = LoggerLibrary, ErrorType extends Error = ErrorDataType>
  implements ILogLayer<ExternalLogger, ErrorType>
{
  private loggerInstance: LoggerLibrary;
  private loggerType: LoggerType;
  private context: Record<string, any>;
  private hasContext: boolean;
  private pluginManager: PluginManager;

  _config: LogLayerInternalConfig<ErrorType>;

  constructor({
    enabled,
    logger,
    error,
    context,
    metadata,
    plugins,
    consoleDebug,
    prefix,
    muteMetadata,
    muteContext,
  }: LogLayerConfig<ErrorType>) {
    this.loggerInstance = logger.instance;
    this.loggerType = logger?.type || LoggerType.OTHER;

    this.context = {};
    this.hasContext = false;
    this._config = {
      enabled: enabled ?? true,
      consoleDebug: consoleDebug ?? false,
      error: error || {},
      context: context || {},
      metadata: metadata || {},
      prefix: prefix || "",
      muteContext,
      muteMetadata,
    };

    this.pluginManager = new PluginManager(plugins || []);

    if (!this._config.error.fieldName) {
      this._config.error.fieldName = "err";
    }

    if (!this._config.error.copyMsgOnOnlyError) {
      this._config.error.copyMsgOnOnlyError = false;
    }
  }

  /**
   * Calls child() and sets the prefix to be included with every log message.
   */
  withPrefix(prefix: string): LogLayer<ExternalLogger, ErrorType> {
    const logger = this.child();
    logger._config.prefix = prefix;

    return logger;
  }

  /**
   * Appends context data which will be included with
   * every log entry.
   */
  withContext(context: Record<string, any>): LogLayer<ExternalLogger, ErrorType> {
    this.context = {
      ...this.context,
      ...context,
    };

    this.hasContext = true;

    return this;
  }

  /**
   * Returns the context used for the logger
   */
  getContext() {
    return this.context;
  }

  /**
   * Add additional plugins.
   */
  addPlugins(plugins: Array<LogLayerPlugin>) {
    this.pluginManager.addPlugins(plugins);
  }

  /**
   * Enables a plugin by id.
   */
  enablePlugin(id: string) {
    this.pluginManager.enablePlugin(id);
  }

  /**
   * Disables a plugin by id.
   */
  disablePlugin(id: string) {
    this.pluginManager.disablePlugin(id);
  }

  /**
   * Removes a plugin by id.
   */
  removePlugin(id: string) {
    this.pluginManager.removePlugin(id);
  }

  /**
   * Specifies metadata to include with the log message
   */
  withMetadata(metadata: Record<string, any>) {
    return new LogBuilder<ExternalLogger, ErrorType>(this).withMetadata(metadata);
  }

  /**
   * Specifies an Error to include with the log message
   */
  withError(error: ErrorType) {
    return new LogBuilder<ExternalLogger, ErrorType>(this).withError(error);
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
      })
        .withContext({
          ...this.context,
        })
        .withPluginManager(this.pluginManager);
    }

    return new LogLayer<ExternalLogger, ErrorType>({
      ...this._config,
      logger: {
        instance: this.loggerInstance,
        type: this.loggerType,
      },
    }).withPluginManager(this.pluginManager);
  }

  protected withPluginManager(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
    return this;
  }

  /**
   * Logs only the error object without a log message
   */
  errorOnly(error: ErrorType, opts?: ErrorOnlyOpts) {
    const { error: errConfig } = this._config;

    const formatLogConf: FormatLogParams = {
      logLevel: opts?.logLevel || LogLevel.error,
      data: {
        [errConfig.fieldName!]: errConfig.serializer ? errConfig.serializer(error) : error,
      },
    };

    if (this.loggerType === LoggerType.ROARR) {
      // Roarr needs a message defined
      formatLogConf.params = [""];
    }

    // Copy the error message as the log message
    if (((errConfig.copyMsgOnOnlyError && opts?.copyMsg !== false) || opts?.copyMsg === true) && error.message) {
      formatLogConf.params = [error.message];
    }

    this._formatLog(formatLogConf);
  }

  /**
   * Logs only metadata without a log message
   */
  metadataOnly(metadata: Record<string, any>, logLevel: LogLevel = LogLevel.info) {
    const { muteMetadata, consoleDebug } = this._config;

    if (muteMetadata) {
      return;
    }

    let data: Record<string, any> | null = metadata;

    if (this.pluginManager.hasPlugins(PluginCallbackType.onMetadataCalled)) {
      data = this.pluginManager.runOnMetadataCalled(metadata);

      if (!data) {
        if (consoleDebug) {
          console.debug("[LogLayer] Metadata was dropped due to plugin returning falsy value.");
        }

        return;
      }
    }

    const config: FormatLogParams = {
      logLevel,
      data,
    };

    if (this.loggerType === LoggerType.ROARR) {
      // Roarr needs a message defined
      config.params = [""];
    }

    this._formatLog(config);
  }

  /**
   * Sends a log message to the logging library under an info log level.
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  info(...messages: MessageDataType[]) {
    this._formatMessage(messages);
    this._formatLog({ logLevel: LogLevel.info, params: messages });
  }

  /**
   * Sends a log message to the logging library under the warn log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  warn(...messages: MessageDataType[]) {
    this._formatMessage(messages);
    this._formatLog({ logLevel: LogLevel.warn, params: messages });
  }

  /**
   * Sends a log message to the logging library under the error log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  error(...messages: MessageDataType[]) {
    this._formatMessage(messages);
    this._formatLog({ logLevel: LogLevel.error, params: messages });
  }

  /**
   * Sends a log message to the logging library under the debug log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  debug(...messages: MessageDataType[]) {
    this._formatMessage(messages);
    this._formatLog({ logLevel: LogLevel.debug, params: messages });
  }

  /**
   * Sends a log message to the logging library under the trace log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  trace(...messages: MessageDataType[]) {
    this._formatMessage(messages);
    this._formatLog({ logLevel: LogLevel.trace, params: messages });
  }

  /**
   * Sends a log message to the logging library under the fatal log level
   *
   * The logging library may or may not support multiple message parameters and only
   * the first parameter would be used.
   */
  fatal(...messages: MessageDataType[]) {
    this._formatMessage(messages);
    this._formatLog({ logLevel: LogLevel.fatal, params: messages });
  }

  /**
   * No-op method that does nothing.
   */
  silent(...messages: MessageDataType[]) {
    this._formatMessage(messages);
    this._formatLog({ logLevel: LogLevel.silent, params: messages });
  }

  /**
   * All logging inputs are dropped and stops sending logs to the logging library.
   */
  disableLogging() {
    this._config.enabled = false;
    return this;
  }

  /**
   * Enable sending logs to the logging library.
   */
  enableLogging() {
    this._config.enabled = true;
    return this;
  }

  /**
   * Returns the underlying log instance
   */
  getLoggerInstance(): ExternalLogger {
    return this.loggerInstance as ExternalLogger;
  }

  /**
   * Disables inclusion of context data in the print
   */
  muteContext(): ILogLayer<ExternalLogger, ErrorType> {
    this._config.muteContext = true;
    return this;
  }

  /**
   * Enables inclusion of context data in the print
   */
  unMuteContext(): ILogLayer<ExternalLogger, ErrorType> {
    this._config.muteContext = false;
    return this;
  }

  /**
   * Disables inclusion of metadata in the print
   */
  muteMetadata(): ILogLayer<ExternalLogger, ErrorType> {
    this._config.muteMetadata = true;
    return this;
  }

  /**
   * Enables inclusion of metadata in the print
   */
  unMuteMetadata(): ILogLayer<ExternalLogger, ErrorType> {
    this._config.muteMetadata = false;
    return this;
  }

  private formatContext() {
    const { context: contextCfg, muteContext } = this._config;

    if (this.hasContext && !muteContext) {
      if (contextCfg.fieldName) {
        return {
          [contextCfg.fieldName]: {
            ...this.context,
          },
        };
      }

      return {
        ...this.context,
      };
    }

    return {};
  }

  private formatMetadata(data: Record<string, any> | null = null) {
    const { metadata: metadataCfg, muteMetadata } = this._config;

    if (data && !muteMetadata) {
      if (metadataCfg.fieldName) {
        return {
          [metadataCfg.fieldName]: {
            ...data,
          },
        };
      }

      return {
        ...data,
      };
    }

    return {};
  }

  _formatMessage(messages: MessageDataType[] = []) {
    const { prefix } = this._config;

    if (prefix && typeof messages[0] === "string") {
      messages[0] = `${prefix} ${messages[0]}`;
    }
  }

  _formatLog({ logLevel, params = [], data = null }: FormatLogParams) {
    const { enabled, muteContext, context, metadata, consoleDebug } = this._config;

    if (!enabled) {
      return;
    }

    const hasObjData = !!data || (muteContext ? false : this.hasContext);

    let d: Record<string, any> | undefined | null = {};

    if (hasObjData) {
      // Field names for context and metadata is the same, merge the metadata into the same field name
      if (context.fieldName && context.fieldName === metadata.fieldName) {
        const contextData = this.formatContext()[context.fieldName];
        const updatedMetadata = this.formatMetadata(data)[metadata.fieldName];

        d = {
          [context.fieldName]: {
            ...contextData,
            ...updatedMetadata,
          },
        };
      } else {
        d = {
          ...this.formatContext(),
          ...this.formatMetadata(data),
        };
      }
    }

    if (this.pluginManager.hasPlugins(PluginCallbackType.onBeforeDataOut)) {
      d = this.pluginManager.runOnBeforeDataOut({
        data: hasObjData ? d : undefined,
        logLevel,
      });
    }

    if (this.pluginManager.hasPlugins(PluginCallbackType.shouldSendToLogger)) {
      const shouldSend = this.pluginManager.runShouldSendToLogger({
        messages: [...params],
        data: hasObjData ? d : undefined,
        logLevel,
      });

      if (!shouldSend) {
        return;
      }
    }

    if (d && hasObjData) {
      switch (this.loggerType) {
        case LoggerType.CONSOLA:
        case LoggerType.ELECTRON_LOG:
        case LoggerType.LOG4JS_NODE:
        case LoggerType.SIGNALE:
        case LoggerType.WINSTON:
          // library wants the data object to be the last parameter
          params.push(d);
          break;
        default:
          // put object data as the first parameter
          params.unshift(d);
      }
    }

    switch (logLevel) {
      case LogLevel.info:
        if (consoleDebug) {
          console.info(...params);
        }
        this.loggerInstance.info(...params);
        break;
      case LogLevel.warn:
        if (consoleDebug) {
          console.warn(...params);
        }
        this.loggerInstance.warn(...params);
        break;
      case LogLevel.error:
        if (consoleDebug) {
          console.error(...params);
        }
        this.loggerInstance.error(...params);
        break;
      case LogLevel.trace:
        if (consoleDebug) {
          console.debug(...params);
        }

        // These loggers do not have a trace type
        if (this.loggerType === LoggerType.WINSTON || this.loggerType === LoggerType.SIGNALE) {
          this.loggerInstance.debug(...params);
        } else if (this.loggerInstance.trace) {
          this.loggerInstance.trace(...params);
        } else {
          this.loggerInstance.debug(...params);
        }
        break;
      case LogLevel.debug:
        if (consoleDebug) {
          console.debug(...params);
        }
        this.loggerInstance.debug(...params);
        break;
      case LogLevel.fatal:
        if (consoleDebug) {
          console.debug(...params);
        }

        if (
          this.loggerType === LoggerType.WINSTON ||
          this.loggerType === LoggerType.ELECTRON_LOG ||
          this.loggerType === LoggerType.CONSOLE
        ) {
          this.loggerInstance.error(...params);
        } else if (this.loggerInstance.fatal) {
          this.loggerInstance.fatal(...params);
        } else {
          this.loggerInstance.error(...params);
        }
        break;
      case LogLevel.silent:
        if (this.loggerInstance.silent) {
          this.loggerInstance.silent(...params);
        }
        break;
      default:
        if (consoleDebug) {
          console.log(...params);
        }
        // @ts-ignore
        this.loggerInstance[logLevel](...params);
    }
  }
}
