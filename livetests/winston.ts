import winston from 'winston'
import { serializeError } from 'serialize-error'
import { LoggerLibrary, LoggerType, LogLayer } from '../src'
import { testMethods } from './utils'

const w = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
    }),
  ],
})

const log = new LogLayer({
  logger: {
    instance: w as unknown as LoggerLibrary,
    type: LoggerType.WINSTON,
  },
  error: {
    serializer: serializeError,
  },
})

testMethods(log)
