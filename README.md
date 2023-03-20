# loglayer

[![NPM version](https://img.shields.io/npm/v/loglayer.svg?style=flat-square)](https://www.npmjs.com/package/loglayer)
[![CircleCI](https://circleci.com/gh/kriasoft/node-loglayer.svg?style=svg)](https://circleci.com/gh/theogravity/loglayer)
![built with typescript](https://camo.githubusercontent.com/92e9f7b1209bab9e3e9cd8cdf62f072a624da461/68747470733a2f2f666c61742e62616467656e2e6e65742f62616467652f4275696c74253230576974682f547970655363726970742f626c7565)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Standardize the way you write logs with `loglayer` using your existing logging library 
(`bunyan` / `winston` / `pino` / `roarr` / etc).

Spend less time from having to *define* your logs and spend more writing them.

- Switch between different logging libraries if you do not like the one you use without changing your entire codebase.
  * Starting off with `console` and want to switch to `bunyan` later? You can with little effort!
- Intuitive API with no dependencies.
- Written in typescript.
- Installation instructions for each logging library.
- Unit tested with various logging libraries.

Without `loglayer`, how does one define a log entry?

```javascript
// is it like this?
winston.info('my message', { some: 'data' })

// or like this?
bunyan.info({ some: 'data' }, 'my message')
```

How does one work with errors?

```javascript
// is it like this? Is err the field for errors?
roarr.error({ err: new Error('test') })

// Do I need to serialize it first? 
roarr.error({ err: serialize(new Error('test')) })
```

With `loglayer`, stop worrying about details, and *write* logs!

```javascript
logLayer
  .withMetadata({ some: 'data'})
  .withError(new Error('test'))
  .info('my message')
```

`loglayer` is a wrapper around logging libraries to provide a consistent way to specify context, metadata, and errors.

# Table of Contents

<!-- TOC -->

- [Installation](#installation)
- [Example installations](#example-installations)
  - [`console`](#console)
  - [`pino`](#pino)
  - [`bunyan`](#bunyan)
  - [`winston`](#winston)
  - [`roarr`](#roarr)
- [Example integration](#example-integration)
- [API](#api)
  - [Constructor](#constructor)
    - [Configuration options](#configuration-options)
      - [Supported log library types](#supported-log-library-types)
      - [Serializing errors](#serializing-errors)
      - [Data output options](#data-output-options)
  - [Child logger](#child-logger)
  - [Hooks](#hooks)
    - [Set / update hooks outside of configuration](#set--update-hooks-outside-of-configuration)
    - [Modify / create object data before being sent to the logging library](#modify--create-object-data-before-being-sent-to-the-logging-library)
    - [Conditionally send or not send an entry to the logging library](#conditionally-send-or-not-send-an-entry-to-the-logging-library)
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
  - [Logging errors](#logging-errors)
    - [With a message](#with-a-message-1)
    - [Standalone](#standalone-1)
  - [Get the attached logger library instance](#get-the-attached-logger-library-instance)
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

- `LoggerInstanceType`: A definition that implements log `info` / `warn` / `error` / `trace` / `debug` methods.
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
  hooks?: {
    /**
     * Called after the assembly of the data object that contains
     * the metadata / context / error data before being sent to the destination logging
     * library.
     *
     * - The shape of `data` varies depending on your `fieldName` configuration
     * for metadata / context / error. The metadata / context / error data is a *shallow* clone.
     * - If data was not found for assembly, `undefined` is used as the `data` input.
     * - You can also create your own object and return it to be sent to the logging library.
     *
     * @param Object [data] The object containing metadata / context / error data. This
     * is `undefined` if there is no object with data.
     *
     * @returns [Object] The object to be sent to the destination logging
     * library or null / undefined to not pass an object through.
     */
    onBeforeDataOut?: HookAssembledDataFn
    /**
     * Called before the data is sent to the logger. Return false to omit sending
     * to the logger. Useful for isolating specific log messages for debugging / troubleshooting.
     *
     * @param MessageDataType[] messages An array of message data that corresponds to what was entered in
     * info(...messages), warn(...messages), error(...messages), debug(...messages), etc.
     * @param Object [data] The data object that contains the context / metadata / error data.
     This is `undefined` if there is no data. If `onBeforeDataOut` was defined, uses the data processed from it.
     *
     * @returns [boolean] If true, sends data to the logger, if false does not.
     */
    shouldSendToLogger?: HookShouldSendToLoggerFn
  }
}
```

##### Supported log library types

Config option: `logger.type`

Use the `other` value for log libraries not supported here. `loglayer` may or may not
work with it.

```typescript
enum LoggerType {
  OTHER = 'other',
  WINSTON = 'winston',
  ROARR = 'roarr',
  PINO = 'pino',
  BUNYAN = 'bunyan',
  CONSOLE = 'console',
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

`LogLayer#child()`

You can create a child logger, which will copy the configuration you used for creating the parent, along with the existing
context data.

The copied context data is a *shallow copy*.

```
const parentLog = new LogLayer(<config>).withContext({ some: 'data' })

// Creates a new LogLayer with <config> copied over and the context
const childLog = parentLog.child()
```

### Hooks

#### Set / update hooks outside of configuration

`LogLayer#setHooks(hooks: LogLayerHooksConfig)`

Update hook callback definitions. This is an alternative
to the `hooks` config option. Only hooks defined will be replaced.

#### Modify / create object data before being sent to the logging library

`(data?: Record<string, any>) => Record<string, any> | null | undefined`

The callback `onBeforeDataOut` can be used to modify the data object
that contains the context / metadata / error data or create a custom object
before it is sent out to the logging library.

```typescript
import { LoggerType, LogLayer, HookAssembledDataFn } from 'loglayer'

const onBeforeDataOut: HookAssembledDataFn = (data) => {
  if (data) {
    data.modified = true 
  }
  
  return data 
}

const log = new LogLayer({
  ...
  hooks: {
    onBeforeDataOut,
  }
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

#### Conditionally send or not send an entry to the logging library

`(params: { messages: MessageDataType[], logLevel: LogLevel, data?: Data }) => boolean`

The callback `shouldSendToLogger` is called before the data is sent to the logger. 
Return false to omit sending to the logger. Useful for isolating specific log 
messages for debugging / troubleshooting.

*Parameters*

- `messages`: The parameters sent via `info()`, `warn()`, `error()`, `debug()`, etc. Most will use `messages[0]`. This data is copied from the original.
- `[data]`: The data object that contains the context / metadata / error data. This is `null` if there is no data. 
  If `onBeforeDataOut` was defined, uses the data processed from it.

```typescript
import { LoggerType, LogLayer, HookAssembledDataFn } from 'loglayer'

const shouldSendToLogger: boolean = ({ messages }) => {
  // Define custom logic here (ex: regex) to determine if the log should be sent out or not
  
  // Read the first parameter of info() / warn() / error() / debug() / etc
  if (messages[0] === 'do not send out') {
    return false;
  }
  
  return true;
}

const log = new LogLayer({
  ...
  hooks: {
    shouldSendToLogger,
  }
})

// Will not send the log entry to the logger
log.info('do not send out')
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

`type MessageDataType = string | number | null | undefined`

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

## Mocking for tests

Rather than having to define your own mocks for `loglayer`, we have a mock class you can use for your tests:

```typescript
import { MockLogLayer } from 'loglayer'

// You can use the MockLogLayer in place of LogLayer
// so nothing will log
```

## Running tests

`$ npm run test:ci`
