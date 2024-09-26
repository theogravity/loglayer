import { datadogLogs } from "@datadog/browser-logs";
import "global-jsdom/register";
import { LogLayer, LoggerType } from "../src";
import { testMethods } from "./utils";

datadogLogs.init({
  clientToken: "replace_me",
  site: "datadoghq.com",
  forwardErrorsToLogs: true,
});

const log = new LogLayer({
  logger: {
    instance: datadogLogs.logger,
    type: LoggerType.DATADOG_BROWSER_LOGS,
  },
});

testMethods(log);
