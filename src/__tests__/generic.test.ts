import { HookBeforeDataOutFn, HookShouldSendToLoggerFn, LoggerType, LogLayerConfig, LogLevel } from '../types'
import { LogLayer } from '../LogLayer'

class GenericLoggingLib {
  lines: Array<Record<string, any>>

  constructor() {
    this.lines = []
  }

  info(...params: any[]) {
    this.addLine(LogLevel.info, params)
  }

  warn(...params: any[]) {
    this.addLine(LogLevel.warn, params)
  }

  error(...params: any[]) {
    this.addLine(LogLevel.error, params)
  }

  debug(...params: any[]) {
    this.addLine(LogLevel.debug, params)
  }

  trace(...params: any[]) {
    this.addLine(LogLevel.trace, params)
  }

  private addLine(logLevel: LogLevel, params: any[]) {
    this.lines.push({
      level: logLevel,
      data: params,
    })
  }

  getLine() {
    return this.lines.pop()
  }
}

function getLogger(config?: Partial<LogLayerConfig>) {
  const genericLogger = new GenericLoggingLib()

  return new LogLayer<GenericLoggingLib>({
    logger: {
      instance: genericLogger,
      type: LoggerType.OTHER,
    },
    ...(config || {}),
  })
}

describe('loglayer general tests', () => {
  it('should assign a prefix to messages', () => {
    const log = getLogger().withPrefix('[testing]')
    const genericLogger = log.getLoggerInstance()
    const levels = ['info', 'warn', 'error', 'debug', 'trace']

    levels.forEach((level, idx) => {
      log[level](`${level} message`, idx)

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level,
          data: [`[testing] ${level} message`, idx],
        }),
      )
    })
  })

  it('should create a child logger with only the original configuration and context', () => {
    const origLog = getLogger().withContext({
      test: 'context',
    })

    const parentGenericLogger = origLog.getLoggerInstance()

    // Add additional context to the child logger
    const childLog = origLog.child().withContext({
      child: 'childData',
    })

    childLog.info('test')

    const childGenericLogger = childLog.getLoggerInstance()

    expect(childGenericLogger.getLine()).toStrictEqual(
      expect.objectContaining({
        level: LogLevel.info,
        data: [
          {
            test: 'context',
            child: 'childData',
          },
          'test',
        ],
      }),
    )

    // make sure the parent logger doesn't have the additional context of the child
    origLog
      .withContext({
        parentContext: 'test-2',
      })
      .info('parent-test')

    expect(parentGenericLogger.getLine()).toStrictEqual(
      expect.objectContaining({
        level: LogLevel.info,
        data: [
          {
            test: 'context',
            parentContext: 'test-2',
          },
          'parent-test',
        ],
      }),
    )
  })

  it('should write messages', () => {
    const log = getLogger()
    const genericLogger = log.getLoggerInstance()
    const levels = ['info', 'warn', 'error', 'debug', 'trace']

    levels.forEach((level, idx) => {
      log[level](`${level} message`, idx)

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level,
          data: [`${level} message`, idx],
        }),
      )
    })
  })

  it('should toggle log output', () => {
    const log = getLogger({ enabled: false })
    const genericLogger = log.getLoggerInstance()

    log.info('test')
    expect(genericLogger.getLine()).not.toBeDefined()

    log.enableLogging()
    log.info('test')
    expect(genericLogger.getLine()).toStrictEqual(
      expect.objectContaining({
        level: 'info',
        data: ['test'],
      }),
    )

    log.disableLogging()
    log.info('test')
    expect(genericLogger.getLine()).not.toBeDefined()

    // Test LogBuilder
    log.enableLogging()
    log.withMetadata({}).disableLogging().info('test')
    expect(genericLogger.getLine()).not.toBeDefined()

    // This doesn't immediately enable log output
    log.withMetadata({}).enableLogging().info('test')

    expect(genericLogger.getLine()).toStrictEqual(
      expect.objectContaining({
        level: 'info',
        data: [{}, 'test'],
      }),
    )
  })

  it('should include context', () => {
    const log = getLogger()
    const genericLogger = log.getLoggerInstance()
    const levels = ['info', 'warn', 'error', 'debug', 'trace']

    log.withContext({
      sample: 'data',
    })

    levels.forEach((level, idx) => {
      log[level](`${level} message`, idx)

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level,
          data: [{ sample: 'data' }, `${level} message`, idx],
        }),
      )
    })
  })

  it('should include metadata with a message', () => {
    const log = getLogger()
    const genericLogger = log.getLoggerInstance()
    const levels = ['info', 'warn', 'error', 'debug', 'trace']

    levels.forEach((level, idx) => {
      log
        .withMetadata({
          index: idx,
        })
        [level](`${level} message`, idx)

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level,
          data: [{ index: idx }, `${level} message`, idx],
        }),
      )
    })
  })

  it('should include an error with a message', () => {
    const log = getLogger()
    const genericLogger = log.getLoggerInstance()
    const levels = ['info', 'warn', 'error', 'debug', 'trace']

    levels.forEach((level, idx) => {
      const e = new Error('test')

      log.withError(e)[level](`${level} message`, idx)

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level,
          data: [{ err: e }, `${level} message`, idx],
        }),
      )
    })
  })

  describe('errorOnly', () => {
    it('should log only an error', () => {
      const log = getLogger()
      const genericLogger = log.getLoggerInstance()
      const e = new Error('err')
      log.errorOnly(e)

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level: LogLevel.error,
          data: [
            {
              err: e,
            },
          ],
        }),
      )
    })

    it('should copy the error message as the log message', () => {
      const log = getLogger()
      const genericLogger = log.getLoggerInstance()
      const e = new Error('error message')

      log.errorOnly(e, {
        logLevel: LogLevel.info,
        copyMsg: true,
      })

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level: LogLevel.info,
          data: [
            {
              err: e,
            },
            'error message',
          ],
        }),
      )
    })
  })

  it('should log only metadata', () => {
    const log = getLogger()
    const genericLogger = log.getLoggerInstance()
    log.metadataOnly({
      only: 'metadata',
    })

    expect(genericLogger.getLine()).toStrictEqual(
      expect.objectContaining({
        level: LogLevel.info,
        data: [
          {
            only: 'metadata',
          },
        ],
      }),
    )

    log.metadataOnly(
      {
        only: 'trace metadata',
      },
      LogLevel.trace,
    )

    expect(genericLogger.getLine()).toStrictEqual(
      expect.objectContaining({
        level: LogLevel.trace,
        data: [
          {
            only: 'trace metadata',
          },
        ],
      }),
    )
  })

  it('should combine an error, metadata, and context', () => {
    const log = getLogger()
    const genericLogger = log.getLoggerInstance()
    const e = new Error('err')

    log.withContext({
      contextual: 'data',
    })

    log
      .withError(e)
      .withMetadata({
        situational: 1234,
      })
      .info('combined data')

    expect(genericLogger.getLine()).toStrictEqual(
      expect.objectContaining({
        level: LogLevel.info,
        data: [
          {
            err: e,
            contextual: 'data',
            situational: 1234,
          },
          'combined data',
        ],
      }),
    )
  })

  describe('config options', () => {
    describe('hooks config', () => {
      it('should update hooks', () => {
        const onBeforeDataOut: HookBeforeDataOutFn = (data) => {
          if (data) {
            data.modified = true
          }

          return data
        }

        const log = getLogger()

        log.setHooks({
          onBeforeDataOut,
        })

        const genericLogger = log.getLoggerInstance()
        const e = new Error('err')

        log.withContext({
          contextual: 'data',
        })

        log
          .withError(e)
          .withMetadata({
            situational: 1234,
          })
          .info('combined data')

        expect(genericLogger.getLine()).toStrictEqual(
          expect.objectContaining({
            level: LogLevel.info,
            data: [
              {
                err: e,
                contextual: 'data',
                situational: 1234,
                modified: true,
              },
              'combined data',
            ],
          }),
        )
      })

      describe('onBeforeDataOut', () => {
        it('should call onBeforeDataOut with context', () => {
          const onBeforeDataOut: HookBeforeDataOutFn = (data) => {
            if (data) {
              data.modified = true
            }

            return data
          }

          const log = getLogger({
            hooks: {
              onBeforeDataOut,
            },
          })
          const genericLogger = log.getLoggerInstance()
          const e = new Error('err')

          log.withContext({
            contextual: 'data',
          })

          log
            .withError(e)
            .withMetadata({
              situational: 1234,
            })
            .info('combined data')

          expect(genericLogger.getLine()).toStrictEqual(
            expect.objectContaining({
              level: LogLevel.info,
              data: [
                {
                  err: e,
                  contextual: 'data',
                  situational: 1234,
                  modified: true,
                },
                'combined data',
              ],
            }),
          )
        })

        it('should call onBeforeDataOut with without data', () => {
          const onBeforeDataOut: HookBeforeDataOutFn = (data) => {
            if (data) {
              data.modified = true
            }

            return data
          }

          const log = getLogger({
            hooks: {
              onBeforeDataOut,
            },
          })
          const genericLogger = log.getLoggerInstance()

          log.info('no data')

          expect(genericLogger.getLine()).toStrictEqual(
            expect.objectContaining({
              level: LogLevel.info,
              data: ['no data'],
            }),
          )
        })
      })

      describe('shouldSendToLogger', () => {
        it('should not send to the logger', () => {
          const shouldSendToLogger: HookShouldSendToLoggerFn = (messages, data) => {
            if (messages[0] === 0) {
              return false
            }

            return true
          }

          const log = getLogger({
            hooks: {
              shouldSendToLogger,
            },
          })
          const genericLogger = log.getLoggerInstance()

          log.info(0)
          expect(genericLogger.getLine()).toBeUndefined()
          log.info(1)
          expect(genericLogger.getLine()).toStrictEqual(
            expect.objectContaining({
              level: LogLevel.info,
              data: [1],
            }),
          )
        })
      })
    })

    describe('error config', () => {
      it('should use a custom serializer and field name', () => {
        const log = getLogger({
          error: {
            serializer: (err) => {
              return `[ERROR] ${err.message}`
            },
            fieldName: 'causedBy',
          },
        })

        const genericLogger = log.getLoggerInstance()

        log.errorOnly(new Error('this is an error'))

        expect(genericLogger.getLine()).toStrictEqual(
          expect.objectContaining({
            level: LogLevel.error,
            data: [
              {
                causedBy: `[ERROR] this is an error`,
              },
            ],
          }),
        )
      })

      it('should always copy error messages', () => {
        const log = getLogger({
          error: {
            copyMsgOnOnlyError: true,
          },
        })

        const genericLogger = log.getLoggerInstance()

        const e = new Error('this is an error')

        log.errorOnly(e)

        expect(genericLogger.getLine()).toStrictEqual(
          expect.objectContaining({
            level: LogLevel.error,
            data: [
              {
                err: e,
              },
              'this is an error',
            ],
          }),
        )
      })

      it('should override copy over messages', () => {
        const log = getLogger({
          error: {
            copyMsgOnOnlyError: true,
          },
        })

        const genericLogger = log.getLoggerInstance()

        const e = new Error('this is an error')

        log.errorOnly(e, { copyMsg: false })

        expect(genericLogger.getLine()).toStrictEqual(
          expect.objectContaining({
            level: LogLevel.error,
            data: [
              {
                err: e,
              },
            ],
          }),
        )
      })
    })

    it('should use a custom metadata field', () => {
      const log = getLogger({
        metadata: {
          fieldName: 'myMetadata',
        },
      })

      const genericLogger = log.getLoggerInstance()

      log.metadataOnly({
        my: 'metadata',
      })

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level: LogLevel.info,
          data: [
            {
              myMetadata: {
                my: 'metadata',
              },
            },
          ],
        }),
      )
    })

    it('should use a custom context and metadata field', () => {
      const log = getLogger({
        context: {
          fieldName: 'myContext',
        },
        metadata: {
          fieldName: 'myMetadata',
        },
      })

      const genericLogger = log.getLoggerInstance()

      log.withContext({
        reqId: 1234,
      })

      log
        .withMetadata({
          my: 'metadata',
        })
        .info('a request')

      expect(log.getContext()).toStrictEqual({
        reqId: 1234,
      })

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level: LogLevel.info,
          data: [
            {
              myContext: {
                reqId: 1234,
              },
              myMetadata: {
                my: 'metadata',
              },
            },
            'a request',
          ],
        }),
      )
    })

    it('should use a custom metadata field', () => {
      const log = getLogger({
        metadata: {
          fieldName: 'myMetadata',
        },
      })

      const genericLogger = log.getLoggerInstance()

      log.metadataOnly({
        my: 'metadata',
      })

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level: LogLevel.info,
          data: [
            {
              myMetadata: {
                my: 'metadata',
              },
            },
          ],
        }),
      )
    })

    it('should merge metadata and context fields if they are the same field name', () => {
      const log = getLogger({
        metadata: {
          fieldName: 'sharedData',
        },
        context: {
          fieldName: 'sharedData',
        },
      })

      const genericLogger = log.getLoggerInstance()

      log.withContext({ ctx: 'data' }).metadataOnly({
        my: 'metadata',
      })

      expect(genericLogger.getLine()).toStrictEqual(
        expect.objectContaining({
          level: LogLevel.info,
          data: [
            {
              sharedData: {
                my: 'metadata',
                ctx: 'data',
              },
            },
          ],
        }),
      )
    })
  })
})
