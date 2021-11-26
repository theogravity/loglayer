import { Roarr as r } from 'roarr'
import { serializeError } from 'serialize-error'
import { LoggerType, LogLayer } from '../src'
import { testMethods } from './utils'

const log = new LogLayer({
  logger: {
    instance: r,
    type: LoggerType.ROARR,
  },
  error: {
    serializer: serializeError,
  },
})

testMethods(log)
