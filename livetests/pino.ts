import pino from 'pino'
import { LoggerType, LogLayer } from '../src'
import { testMethods } from './utils'

const p = pino({
  level: 'trace',
})
const log = new LogLayer({
  logger: {
    instance: p,
    type: LoggerType.PINO,
  },
})

testMethods(log)
