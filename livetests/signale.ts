import signale from "signale";
import { LogLayer, LoggerType } from "../src";
import { testMethods } from "./utils";

const log = new LogLayer({
  logger: {
    instance: signale,
    type: LoggerType.SIGNALE,
  },
});

testMethods(log);
