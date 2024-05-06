import log4js from "log4js";
import { LogLayer, LoggerType } from "../src";
import { testMethods } from "./utils";

const log4jsInstance = log4js.getLogger();
log4jsInstance.level = "trace";

const log = new LogLayer({
  logger: {
    instance: log4jsInstance,
    type: LoggerType.LOG4JS_NODE,
  },
});

testMethods(log);
