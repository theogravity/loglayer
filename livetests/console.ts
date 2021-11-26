import { LoggerType, LogLayer } from '../src'
import { testMethods } from './utils'

const log = new LogLayer({
  logger: {
    instance: console,
    type: LoggerType.CONSOLE,
  },
})

testMethods(log)
