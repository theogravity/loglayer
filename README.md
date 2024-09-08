# loglayer

[![NPM version](https://img.shields.io/npm/v/loglayer.svg?style=flat-square)](https://www.npmjs.com/package/loglayer)
![NPM Downloads](https://img.shields.io/npm/dm/loglayer)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

`loglayer` standardizes log entry definitions, contextual data, metadata, and error reporting, streamlining your logging process using your logging library of choice like `pino` / `winston` / `bunyan` / etc.

- Zero dependency library.
- Fluent API for creating log entries with Typescript support.
- Not sure what logging package to use? Start with `console` as the underlying logger (or another logging library) and swap later to another logging library without needing to overhaul your entire codebase.
  * Supports `bunyan`, `winston`, `pino`, `roarr`, `log4js-node`, `electron-log`, `signale`, `consola`, and more with installation examples for each.
- Has ready-to-use mocks for your unit tests.
- Unit tested against multiple logging libraries to ensure compatibility.

### Before `loglayer`

Defining a log entry can vary significantly between different libraries:

```javascript
// Using `winston`:
winston.info('my message', { some: 'data' })

// Using `bunyan`:
bunyan.info({ some: 'data' }, 'my message')
```

Handling errors can also be inconsistent:

```javascript
// Using `roarr` with a direct error object:
roarr.error({ err: new Error('test') })

// With serialized error data:
roarr.error({ err: serialize(new Error('test')) })
```

### Simplicity with `loglayer`

Focus on creating logs with clear, consistent syntax:

```javascript
logLayer
  .withMetadata({ some: 'data'})
  .withError(new Error('test'))
  .info('my message')
```

# Table of Contents

<!-- TOC -->

- [Installation](#installation)
- [Example installations](#example-installations)
  - [`console`](#console)
  - [`pino`](#pino)
  - [`bunyan`](#bunyan)
  - [`winston`](#winston)
  - [`roarr`](#roarr)
  - [`electron-log`](#electron-log)
  - [`log4js-node`](#log4js-node)
  - [`signale`](#signale)
  - [`consola`](#consola)
- [Example integration](#example-integration)
- [API](#api)
  - [Constructor](#constructor)
    - [Configuration options](#configuration-options)
      - [Supported log library types](#supported-log-library-types)
      - [Serializing errors](#serializing-errors)
      - [Data output options](#data-output-options)
  - [Child logger](#child-logger)
  - [Disable / enable logging](#disable--enable-logging)
  - [Logging messages](#logging-messages)
  - [Including a prefix with each log message](#including-a-prefix-with-each-log-message)
    - [Via configuration](#via-configuration)
    - [Create a child logger with the prefix](#create-a-child-logger-with-the-prefix)
  - [Including context with each log message](#including-context-with-each-log-message)
    - [Getting context](#getting-context)
  - [Logging metadata](#logging-metadata)
    - [With a message](#with-a-message)
    - [Standalone](#standalone)
  - [Muting context / metadata](#muting-context--metadata)
    - [Via configuration](#via-configuration-1)
    - [Via method](#via-method)
  - [Logging errors](#logging-errors)
    - [With a message](#with-a-message-1)
    - [Standalone](#standalone-1)
  - [Get the attached logger library instance](#get-the-attached-logger-library-instance)
  - [Plugins](#plugins)
    - [Plugin definition](#plugin-definition)
    - [Lifecycle](#lifecycle)
    - [Management](#management)
      - [Add plugins outside of configuration](#add-plugins-outside-of-configuration)
      - [Disable / enable a plugin](#disable--enable-a-plugin)
      - [Remove a plugin](#remove-a-plugin)
    - [Callbacks](#callbacks)
      - [Modify / create object data before being sent to the logging library](#modify--create-object-data-before-being-sent-to-the-logging-library)
      - [Modify / create message data before being sent to the logging library](#modify--create-message-data-before-being-sent-to-the-logging-library)
      - [Conditionally send or not send an entry to the logging library](#conditionally-send-or-not-send-an-entry-to-the-logging-library)
      - [Intercept metadata calls](#intercept-metadata-calls)
- [Mocking for tests](#mocking-for-tests)
- [Running tests](#running-tests)

<!-- TOC END -->

## Installation

`$ npm i loglayer`

## Example installations

### `console`

```typescript
import { LoggerType, LogLayer } from 'loglayer'

const log = new LogLayer({
  logger: {
    instance: console,
    type: LoggerType.CONSOLE,
  },
})
```

### `pino`

[pino docs](https://github.com/pinojs/pino)

```typescript
import pino, { P } from 'pino'
import { LogLayer, LoggerType } from 'loglayer'

const p = pino({
  level: 'trace'
})

const log = new LogLayer<P.Logger>({
  logger: {
    instance: p,
    type: LoggerType.PINO,
  },
})
```

### `bunyan`

[bunyan docs](https://github.com/trentm/node-bunyan)

`bunyan` requires an error serializer to be defined to handle errors.

```typescript
import bunyan from 'bunyan'
import { LogLayer, LoggerType } from 'loglayer'

const b = bunyan.createLogger({
  name: 'test-logger',
  // Show all log levels
  level: 'trace',
  // We've defined that bunyan will transform Error types
  // under the `err` field
  serializers: { err: bunyan.stdSerializers.err },
})

const log = new LogLayer({
  logger: {
    instance: b,
    type: LoggerType.BUNYAN,
  },
  error: {
    // Make sure that loglayer is sending errors under the err field to bunyan
    fieldName: 'err'
  }
})
```

### `winston`

[winston docs](https://github.com/winstonjs/winston)

```typescript
import winston from 'winston'
import { LogLayer, LoggerType } from 'loglayer'
import { serializeError } from 'serialize-error'

const w = winston.createLogger({})

const log = new LogLayer<winston.Logger>({
  logger: {
    instance: w as unknown as LoggerLibrary,
    type: LoggerType.WINSTON,
  },
  error: {
    serializer: serializeError,
  },
})
```

### `roarr`

[roarr docs](https://github.com/gajus/roarr)

- `roarr` requires an error serializer as it does not serialize errors on its own.
- By default, `roarr` logging is disabled, and must be enabled via these `roarr` [instructions](https://github.com/gajus/roarr#consuming-logs).

```typescript
import { LogLayer, LoggerType } from 'loglayer'
import { Roarr as r, Logger } from 'roarr'
import { serializeError } from 'serialize-error'

const log = new LogLayer<Logger>({
  logger: {
    instance: r.Roarr,
    type: LoggerType.ROARR,
  },
  error: {
    serializer: serializeError,
  },
})
```

### `electron-log`

You can use `electron-log` with `LogLayer` in your electron app for logging.

[electron-log docs](https://github.com/megahertz/electron-log)

```typescript
// Main process logger
import log from 'electron-log/src/main';
// or Renderer process logger
// import log from 'electron-log/src/renderer';

const logger = new LogLayer({
  logger: {
    instance: log,
    type: LoggerType.ELECTRON_LOG,
  },
});
```

### `log4js-node`

[log4js-node docs](https://log4js-node.github.io/log4js-node/index.html)

- `log4js-node` only works in `node.js` and not the browser
- By default, `log4js-node` logging is disabled and must be configured via `level` or advanced configuration
- You may want to use a custom [layout](https://log4js-node.github.io/log4js-node/layouts.html) as `log4js-node` prints only
string output by default
- Use [winston](#winston) as an alternative to `log4js-node` if the configuration for `log4js-node` is too complex

```typescript
import { LogLayer, LoggerType } from 'loglayer'
import log4js from 'log4js'

const log4jsInstance = log4js.getLogger()

// Enable logging output
// note: You'll most likely want to use appenders and a custom layout
// instead to write your logs in log4js-node
log4jsInstance.level = "trace";

const log = new LogLayer({
  logger: {
    instance: log4jsInstance,
    type: LoggerType.LOG4JS_NODE,
  },
})
```

### `signale`

[signale docs](https://github.com/klaudiosinani/signale)

- `signale` only works in `node.js` and not the browser
- It is generally used for CLI-based applications as it offers log levels and methods
that would be valuable for CLI output
  * `loglayer` does not have integration for the other cli-specific levels (eg: `signale.success()`)
  * Use `LogLayer#getLoggerInstance()` to get the `signale` instance to call those levels

```typescript
import { LogLayer, LoggerType } from 'loglayer'
import { Signale } from 'signale'

const log = new LogLayer<Signale>({
  logger: {
    instance: new Signale(),
    type: LoggerType.SIGNALE,
  },
})

// if you need to use a signale-specific method
const s = log.getLoggerInstance()
s.success('Operation successful');
```

### `consola`

[consola docs](https://github.com/unjs/consola)

- The default log level is `3` which excludes `debug` and `trace`. Set to `5` for both. 

```typescript
import { LogLayer, LoggerType } from 'loglayer'
import { type ConsolaInstance, createConsola } from "consola";

const log = new LogLayer<ConsolaInstance>({
  logger: {
    instance: createConsola({
      level: 5
    }),
    type: LoggerType.CONSOLA,
  },
})
```

## Example integration

Using `express` and `pino`:

```typescript
import express from 'express'
import pino from 'pino'
import { LogLayer, LoggerType } from 'loglayer'

// We only need to create the logging library instance once
const p = pino({
  level: 'trace'
})

const app = express()
const port = 3000

// Define logging middleware
app.use((req, res, next) => {
  req.log = new LogLayer({
    logger: {
      instance: p,
      type: LoggerType.PINO
    }
    // Add a request id for each new request
  }).withContext({
    // generate a random id
    reqId: Math.floor(Math.random() * 100000).toString(10),
    // let's also add in some additional details about the server
    env: 'prod'
  })
  
  next();
})

app.get('/', (req, res) => {
  // Log the message
  req.log.info('sending hello world response')
  
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
```

## API

### Constructor

`new LogLayer<LoggerInstanceType = LoggerLibrary, ErrorType = any>(config: LogLayerConfig)`

Generics (all are optional):

- `LoggerInstanceType`: A definition that implements log `info` / `warn` / `error` / `trace` / `debug` / `fatal` methods.
  * Used for returning the proper type in the `getLoggerInstance()` method.
- `ErrorType`: A type that represents the `Error` type. Used with the serializer and error methods. Defaults to `any`.

#### Configuration options

```typescript
interface LogLayerConfig {
  /**
   * Set to false to drop all log input and stop sending to the logging
   * library.
   *
   * Can be re-enabled with `enableLogging()`.
   *
   * Default is `true`.
   */
  enabled?: boolean
  /**
   * If set to true, will also output messages via console logging before
   * sending to the logging library.
   *
   * Useful for troubleshooting a logging library / transports
   * to ensure logs are still being created when the underlying
   * does not print anything.
   */
  consoleDebug?: boolean
  /**
   * The prefix to prepend to all log messages
   */
  prefix?: string
  /**
   * If set to true, will not include context data in the log message.
   */
  muteContext?: boolean
  /**
   * If set to true, will not include metadata data in the log message.
   */
  muteMetadata?: boolean
  logger: {
    /**
     * The instance of the logging library to send log data and messages to
     */
    instance: ExternalLogger
    /**
     * The instance type of the logging library being used
     */
    type: LoggerType
  }
  error?: {
    /**
     * A function that takes in an incoming Error type and transforms it into an object.
     * Used in the event that the logging library does not natively support serialization of errors.
     */
    serializer?: ErrorSerializerType
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
  context?: {
    /**
     * If specified, will set the context object to a specific field
     * instead of flattening the data alongside the error and message.
     *
     * Default is context data will be flattened.
     */
    fieldName?: string
  }
  metadata?: {
    /**
     * If specified, will set the metadata data to a specific field
     * instead of flattening the data alongside the error and message.
     *
     * Default is metadata will be flattened.
     */
    fieldName?: string
  }
  /**
   * An array of plugins to be executed in the order they are defined.
   */
  plugins?: Array<LogLayerPlugin>
}
```

##### Supported log library types

Config option: `logger.type`

Use the `other` value for log libraries not supported here. `loglayer` may or may not
work with it.

```typescript
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
}
```

##### Serializing errors

Config option: `error.serializer`

By default, `loglayer` will pass error objects directly to the logging library as-is.

Some logging libraries do not have support for serializing errors, and as a result, the
error may not be displayed in a log.

If you use such a library, you can define a function that transforms an error, which is in the format of:

`type ErrorSerializerType = (err) => Record<string, any> | string`

For example:

```typescript
import { LoggerType, LogLayer } from 'loglayer'

const log = new LogLayer({
  logger: {
    instance: console,
    type: LoggerType.CONSOLE,
  },
  error: {
    serializer: (err) => {
      // Can be an object or string
      return JSON.stringify(err)
    }
  }
})
```

##### Data output options

By default, `loglayer` will flatten context and metadata into a single object
before sending it to the logging library.

For example:

```typescript
log.withContext({
  reqId: '1234'
})

log.withMetadata({
  hasRole: true,
  hasPermission: false
}).info('checking permissions')
```

Will result in a log entry in most logging libraries:

```json
{
  "level": 30,
  "time": 1638138422796,
  "hostname": "local",
  "msg": "checking permissions",
  "hasRole": true,
  "hasPermission": false,
  "reqId": 1234
}
```

Some developers prefer a separation of their context and metadata into
dedicated fields.

You can do this via the config options, `context.fieldName` and `metadata.fieldName`:

```typescript
const log = new LogLayer({
  ...,
  metadata: {
    // we'll put our metadata into a field called metadata
    fieldName: 'metadata'
  },
  context: {
    // we'll put our context into a field called context
    fieldName: 'context'
  }
})
```

The same log commands would now be formatted as:

```json
{
  "level": 30,
  "time": 1638138422796,
  "hostname": "local",
  "msg": "checking permissions",
  "metadata": {
    "hasRole": true,
    "hasPermission": false
  },
  "context": {
    "reqId": 1234
  }
}
```

### Child logger

`LogLayer#child(): LogLayer`

You can create a child logger, which will copy the configuration you used for creating the parent, along with the existing context data and plugins.

The copied context data is a *shallow copy*.

```
const parentLog = new LogLayer(<config>).withContext({ some: 'data' })

// Creates a new LogLayer with <config> copied over and the context
const childLog = parentLog.child()
```

### Disable / enable logging

- `LogLayer#enableLogging(): LogLayer`
- `LogLayer#disableLogging(): LogLayer`

### Logging messages

- `LogLayer#info(...messages: MessageDataType[]): void`
- `LogLayer#warn(...messages: MessageDataType[]): void`
- `LogLayer#error(...messages: MessageDataType[]): void`
- `LogLayer#debug(...messages: MessageDataType[]): void`
- `LogLayer#trace(...messages: MessageDataType[]): void`
- `LogLayer#fatal(...messages: MessageDataType[]): void`

`type MessageDataType = string | number | null | undefined`

Some logging libraries do not support a `trace` or `fatal` level. `loglayer` will re-map
to the following levels in that situation:

  * `trace` -> `debug`
  * `fatal` -> `error`

*Your logging library may or may not support passing multiple parameters. See your logging library's 
documentation for more details.*

```typescript
// Can be a single message
log.info('this is a message')

// Or passed through multiple parameters to be interepreted by your logging library.
// For example, in roarr, the subsequent parameters after the first are for sprintf interpretation only.
// Other libraries do nothing with additional parameters.
log.info('request id: %s', id)
```

### Including a prefix with each log message

#### Via configuration

```typescript
const log = new LogLayer({ prefix: '[testing]' })
```

#### Create a child logger with the prefix

`LogLayer#withPrefix(prefix: string): LogLayer`

This calls `LogLayer#child()` with `prefix` set as part of the configuration.

```typescript
const parentLog = new LogLayer(<config>)

const childLog = parentLog.withPrefix('[testing]')

// The message will be "[testing] this is a request"
childLog.info('this is a request')
```

### Including context with each log message

`LogLayer#withContext(data: Record<string, any>): LogLayer`

- This adds or replaces context data to be included with each log entry.
- Can be chained with other methods.

```typescript
log.withContext({
  requestId: 1234
})

// Your logging library will now include the context data
// as part of its logging output
log.info('this is a request')
```

Output from `pino`:

```json
{
  "level": 30,
  "time": 1638146872750,
  "pid": 38300,
  "hostname": "local",
  "requestId": 1234,
  "msg": "this is a request"
}
```

#### Getting context

```typescript
log.withContext({
  requestId: 1234
})

// Should return { requestId: 1234 }
const context = log.getContext()
```

### Logging metadata

#### With a message

`LogLayer#withMetadata(data: Record<string, any>): ILogBuilder`

Use this if you want to log data that is specific to the message only.

- This method *must* be chained with a log message method.
- This method can be chained with `withError()` to include an error with the metadata.

```typescript
log.withMetadata({ some: 'data' }).info('this is a message that includes metadata')
```

#### Standalone

`LogLayer#metadataOnly(data: Record<string, any>, logLevel: LogLevel = 'info'): void`

Use this if you want to only log metadata without including a message.

```typescript
// Default log level is 'info'
log.metadataOnly({ some: 'data' })

// Adjust log level
log.metadataOnly({ some: 'data' }, LogLevel.warn)
```

### Muting context / metadata

Sometimes you may want to disable context or metadata from being included in the log message.

Useful for local development or troubleshooting where you may not want to see the context or metadata due to verbosity.

Setting the mute flag is persistent until the unmute method is called.

#### Via configuration

- `muteContext`: Disables context from being included in the log message.
- `muteMetadata`: Disables metadata from being included in the log message.

```typescript
const log = new LogLayer({ muteContext: true, muteMetadata: true })
```

#### Via method
 
- `LogLayer#muteContext(): LogLayer`
- `LogLayer#muteMetadata(): LogLayer`
- `LogLayer#unmuteContext(): LogLayer`
- `LogLayer#unmuteMetadata(): LogLayer`

### Logging errors

- If the `error.serializer` config is not used, then it will be the job of the logging library to handle serialization.
  * If you are not seeing errors logged:
    * Make sure the logging library's log level is configured to print an `error` log level.
    * The logging library may not serialize errors out of the box and must be configured, or a serializer must
    be defined with `loglayer` so that it can serialize it before sending it to the logging library.
- The `error.fieldName` config is used to determine the field name to attach the error to when sending to the logging library.
  * The default field name used is `err`.

#### With a message

`LogLayer#withError(error: Error): ILogBuilder`

Use this to include an error object with your message.

- This method *must* be chained with a log message method.
- This method can be chained with `withMetadata()` to include metadata alongside the error.

```typescript
// You can use any log level you want
log.withError(new Error('error')).error('this is a message that includes an error')
```

#### Standalone

`LogLayer#errorOnly(error: Error, opts?: OnlyErrorOpts): void`

Options:

```typescript
interface OnlyErrorOpts {
  /**
   * Sets the log level of the error
   */
  logLevel?: LogLevel
  /**
   * If `true`, copies the `error.message` if available to the logger library's
   * message property.
   *
   * If the config option `error.copyMsgOnOnlyError` is enabled, this property
   * can be set to `false` to disable the behavior for this specific log entry.
   */
  copyMsg?: boolean
}
```

Use this if you want to only log metadata without including a message.

```typescript
// Default log level is 'error'
log.errorOnly(new Error('test'))

// Adjust log level
log.errorOnly(new Error('test'), { level: LogLevel.warn })

// Include the error message as part of the logging library's message field
// This may be redundant as the error message value will still be included
// as part of the message itself
log.errorOnly(new Error('test'), { copyMsg: true })

// If the loglayer instance has `error.copyMsgOnOnlyError = true` and you
// want to disable copying the message for a single line, explicitly
// define copyMessage with false
log.errorOnly(new Error('test'), { copyMsg: false })
```

### Get the attached logger library instance

`LogLayer#getLoggerInstance()`

Returns back the backing logger used in the event you need to call
methods specific to that logging library.

### Plugins

#### Plugin definition

A plugin is a plain object that defines callbacks to be executed at specific points in the log lifecycle.

In advanced use-cases, you may want to create a class that implements the plugin interface.

```typescript
export interface LogLayerPlugin {
  /**
   * Unique identifier for the plugin. Used for selectively disabling / enabling
   * and removing the plugin.
   */
  id?: string;
  /**
   * If true, the plugin will skip execution
   */
  disabled?: boolean;
  onBeforeDataOut?(params: PluginBeforeDataOutParams): Record<string, any> | null | undefined;
  onBeforeMessageOut?(params: PluginBeforeMessageOutParams): MessageDataType[];
  shouldSendToLogger?(params: PluginShouldSendToLoggerParams): boolean;
  onMetadataCalled?(metadata: Record<string, any>): Record<string, any> | null | undefined;
}
```

#### Lifecycle

Plugins are executed in the order they are defined.

The event lifecycle is as follows:

1. `onBeforeDataOut` is called to modify the data object before it is sent to the logging library.
2. `onBeforeMessageOut` is called to modify the message data before it is sent to the logging library.
3. `shouldSendToLogger` is called to determine if the log entry should be sent to the logging library.

#### Management

##### Add plugins outside of configuration

`LogLayer#addPlugins(plugins: Array<LogLayerPlugin>)`

This adds new plugins to the existing configuration.

##### Disable / enable a plugin

The `id` must be defined in the plugin to disable / enable it.

- `LogLayer#disablePlugin(id: string): LogLayer`
- `LogLayer#enablePlugin(id: string): LogLayer`

##### Remove a plugin

The `id` must be defined in the plugin to remove it.

`LogLayer#removePlugin(id: string): LogLayer`

#### Callbacks

##### Modify / create object data before being sent to the logging library

```typescript
export interface PluginBeforeDataOutParams {
  /**
   * Log level of the data
   */
  logLevel: LogLevel;
  /**
   * The object containing metadata / context / error data. This
   * is `undefined` if there is no object with data.
   */
  data?: Record<string, any>;
}
```

`onBeforeDataOut(params: PluginBeforeDataOutParams) => Record<string, any> | null | undefined`

The callback `onBeforeDataOut` can be used to modify the data object that contains the context / metadata / error data or create a custom object before it is sent out to the logging library.

Return `null` or `undefined` to not modify the data object.

Subsequent plugins will have the `data` property updated from the results of the previous plugin if a result was returned from it.

```typescript
import { 
  LoggerType, 
  LogLayer, 
  PluginBeforeDataOutFn,
  PluginBeforeDataOutParams,
} from 'loglayer'

const onBeforeDataOut: PluginBeforeDataOutFn = (params: PluginBeforeDataOutParams) => {
  if (params.data) {
    params.data.modified = true 
  }
  
  return params.data 
}

const log = new LogLayer({
  ...
  plugins: [{
    onBeforeDataOut,
  }]
})

log.withContext({ test: 'data' }).info('this is a test message')
```

```json
{
  "test": "data",
  "modified": true,
  "msg": "this is a test message"
}
```

##### Modify / create message data before being sent to the logging library

```typescript
export interface PluginBeforeMessageOutParams {
  /**
   * Log level of the message
   */
  logLevel: LogLevel;
  /**
   * Message data that is copied from the original.
   */
  messages: any[];
}
```

`onBeforeMessageOut(params: PluginOnBeforeMessageOutParams) => any[]`

Called after `onBeforeDataOut` and before `shouldSendToLogger`.
This allows you to modify the message data before it is sent to the destination logging library.

*Parameters*

- `messages`: The parameters sent via `info()`, `warn()`, `error()`, `debug()`, etc. Most will use `messages[0]`. This data is copied from the original.
- `logLevel`: The log level of the message.

```typescript
import { 
  LoggerType, 
  LogLayer,
  PluginBeforeMessageOutParams,
  PluginBeforeMessageOutFn,
} from 'loglayer'

const onBeforeMessageOut: PluginBeforeMessageOutFn = (params: PluginBeforeMessageOutParams) => {
  return [params.messages[0], 'modified message']
}

const log = new LogLayer({
  ...
  plugins: [{
    onBeforeMessageOut,
  }]
})

// Assuming your logging library supports multiple parameters and will interpret the %s
log.info('this is a test message: %s')
```

```json
{
  "msg": "this is a test message: modified message"
}
```

##### Conditionally send or not send an entry to the logging library

```typescript
export interface PluginShouldSendToLoggerParams {
  /**
   * Message data that is copied from the original.
   */
  messages: any[];
  /**
   * Log level of the message
   */
  logLevel: LogLevel;
  /**
   * The object containing metadata / context / error data. This
   * is `undefined` if there is no object with data.
   */
  data?: Record<string, any>;
}
```

`shouldSendToLogger(params: PluginShouldSendToLoggerParams) => boolean`

The callback `shouldSendToLogger` is called before the data is sent to the logger.
Return false to omit sending to the logger. Useful for isolating specific log
messages for debugging / troubleshooting. If multiple plugins are defined, all must return true for the log entry to be sent.

*Parameters*

- `messages`: The parameters sent via `info()`, `warn()`, `error()`, `debug()`, etc. Most will use `messages[0]`. This data is copied from the original.
- `[data]`: The data object that contains the context / metadata / error data. This is `null` if there is no data.
  *  If `onBeforeDataOut` was used, this will be the result of the data processed from all plugins that defined it.

```typescript
import { 
  LoggerType, 
  LogLayer, 
  PluginShouldSendToLoggerFn, 
  PluginShouldSendToLoggerParams
} from 'loglayer'

const shouldSendToLogger: PluginShouldSendToLoggerFn = ({ messages }: PluginShouldSendToLoggerParams) => {
  // Define custom logic here (ex: regex) to determine if the log should be sent out or not
  
  // Read the first parameter of info() / warn() / error() / debug() / etc
  if (messages[0] === 'do not send out') {
    return false;
  }
  
  return true;
}

const log = new LogLayer({
  ...
  plugins: [{
    shouldSendToLogger,
  }]
})

// Will not send the log entry to the logger
log.info('do not send out')
```

##### Intercept metadata calls

`onMetadataCalled(metadata: Record<string, any>) => Record<string, any> | null | undefined`

The callback `onMetadataCalled` is called when `withMetadata()` or `metadataOnly()` is called with the input being a shallow clone of the metadata from `withMetadata()` / `metadataOnly()`.

One use-case would be for situations where you may want to redact sensitive information from the metadata before it is sent to the logging library and defining the `onBeforeDataOut` plugin callback is too much of a hassle.

- Return the (un)modified metadata object to be sent to the logging library.
- Return `null` or `undefined` to prevent the metadata from being sent to the logging library.
- In multiple plugins, the metadata object will be updated with the results of the previous plugin if a result was returned from it.
  * If in the sequence, one of the `onMetadataCalled` callbacks returns `null` or `undefined`, the metadata object will be omitted from the log entry.

```typescript
import { 
  LoggerType, 
  LogLayer,
  PluginOnMetadataCalledFn, 
} from 'loglayer'

const onMetadataCalled: PluginOnMetadataCalledFn = (metadata: Record<string, any>) => {
  // Modify the metadata object
  metadata.modified = true
    
  return metadata
}

const log = new LogLayer({
  ...
  plugins: [{
    onMetadataCalled,
  }]
})

// Metadata will now include the modified field in the output
log.withMetadata({ some: 'data' }).info('modified metadata')
```

```typescript
import { 
  LoggerType, 
  LogLayer,
  PluginOnMetadataCalledFn, 
} from 'loglayer'

const onMetadataCalled: PluginOnMetadataCalledFn = (metadata: Record<string, any>) => {
  // Return null to prevent the metadata from being sent to the logging library
  return null
}

const log = new LogLayer({
  ...
  plugins: [{
    onMetadataCalled,
  }]
})

// Metadata will be completely omitted from the log print
log.withMetadata({ some: 'data' }).info('no metadata included')
```

## Mocking for tests

Rather than having to define your own mocks for `loglayer`, we have a mock class you can use for your tests:

```typescript
import { MockLogLayer } from 'loglayer'

// You can use the MockLogLayer in place of LogLayer
// so nothing will log
```

## Running tests

`$ npm run test:ci`
