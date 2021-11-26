import bunyan from 'bunyan'
import { LoggerType, LogLayer } from '../src'
import { testMethods } from "./utils";

const b = bunyan.createLogger({
  name: 'test-logger',
  level: 'trace',
  serializers: { err: bunyan.stdSerializers.err },
})

const log = new LogLayer({
  logger: {
    instance: b,
    type: LoggerType.BUNYAN,
  },
})

testMethods(log)
