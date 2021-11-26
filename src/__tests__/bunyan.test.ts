import { PassThrough } from 'stream'
import bunyan from 'bunyan'
import { LogLayer } from '../LogLayer'
import { LoggerType } from '../types'

function getLoggerInstance() {
  const mockedStream = new PassThrough()
  const b = bunyan.createLogger({
    name: 'test-logger',
    level: 'trace',
    stream: mockedStream,
    serializers: { err: bunyan.stdSerializers.err },
  })

  const log = new LogLayer({
    logger: {
      instance: b,
      type: LoggerType.BUNYAN,
    },
  })

  return {
    log,
    mockedStream,
  }
}

describe('structured logger with bunyan', () => {
  it('should log a message', () => {
    expect.assertions(1)
    const { log, mockedStream } = getLoggerInstance()

    mockedStream.on('data', (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>
      expect(entry.msg).toBe('this is a test message')
      mockedStream.destroy()
    })

    log.info('this is a test message')
  })

  it('should include context', () => {
    expect.assertions(2)
    const { log, mockedStream } = getLoggerInstance()
    log.withContext({
      test: 'context',
    })

    mockedStream.on('data', (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>
      expect(entry.test).toBe('context')
      expect(entry.msg).toBe('this is a test message')
      mockedStream.destroy()
    })

    log.warn('this is a test message')
  })

  it('should include metadata', () => {
    expect.assertions(2)
    const { log, mockedStream } = getLoggerInstance()
    log.withContext({
      test: 'context',
    })

    mockedStream.on('data', (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>
      expect(entry.meta).toBe('data')
      expect(entry.msg).toBe('this is a test message')
      mockedStream.destroy()
    })

    log
      .withMetadata({
        meta: 'data',
      })
      .error('this is a test message')
  })

  it('should include an error', () => {
    expect.assertions(2)
    const { log, mockedStream } = getLoggerInstance()
    log.withContext({
      test: 'context',
    })

    mockedStream.on('data', (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>
      expect(entry.err.message).toBe('err')
      expect(entry.msg).toBe('this is a test message')
      mockedStream.destroy()
    })

    log.withError(new Error('err')).error('this is a test message')
  })

  it('should get the underlying logger', () => {
    expect.assertions(1)
    const { log, mockedStream } = getLoggerInstance()

    const bunyanInstance = log.getLoggerInstance()

    mockedStream.on('data', (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>
      expect(entry.msg).toBe('this is a test message')
      mockedStream.destroy()
    })

    bunyanInstance.info('this is a test message')
  })

  it('should log only an error', () => {
    expect.assertions(1)
    const { log, mockedStream } = getLoggerInstance()

    mockedStream.on('data', (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>
      expect(entry.err.message).toBe('test error')
      mockedStream.destroy()
    })

    log.errorOnly(new Error('test error'))
  })

  it('should log only metadata', () => {
    expect.assertions(2)
    const { log, mockedStream } = getLoggerInstance()

    mockedStream.on('data', (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>
      expect(entry.test).toBe('data')
      expect(entry.msg).toBe('')
      mockedStream.destroy()
    })

    log.metadataOnly({ test: 'data' })
  })
})
