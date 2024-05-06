import { createConsola } from "consola";
import { LogLayer, LoggerType } from "../src";
import { testMethods } from "./utils";

const consola = createConsola({
  level: 5,
});

const log = new LogLayer({
  logger: {
    instance: consola,
    type: LoggerType.CONSOLA,
  },
});

testMethods(log);
