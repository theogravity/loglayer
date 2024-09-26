import "global-jsdom/register";

import { type Logger, datadogLogs } from "@datadog/browser-logs";
import { beforeAll, beforeEach, describe, expect, it, vitest } from "vitest";
import { LogLayer } from "../LogLayer";
import { LoggerType } from "../types";

datadogLogs.init({
  clientToken: "replace_me",
  site: "datadoghq.com",
  forwardErrorsToLogs: true,
});

const ddLogger = datadogLogs.createLogger("test-logger");

let log: LogLayer<Logger>;

describe("structured logger with datadog-browser-logs", () => {
  beforeAll(() => {
    log = new LogLayer<Logger>({
      logger: {
        instance: ddLogger,
        type: LoggerType.DATADOG_BROWSER_LOGS,
      },
    });
  });

  beforeEach(() => {
    ddLogger.info = vitest.fn();
  });

  it("should log a message", () => {
    log.info("this is a test message");
    // @ts-ignore
    const consolaMessages = ddLogger.info.mock.calls.map((c) => c[0]);
    expect(consolaMessages).toContain("this is a test message");
  });

  it("should log a message with a prefix", () => {
    log.withPrefix("[testing]").info("this is a test message");
    // @ts-ignore
    const consolaMessages = ddLogger.info.mock.calls.map((c) => c[0]);
    expect(consolaMessages).toContain("[testing] this is a test message");
  });

  it("should include context", () => {
    log.withContext({
      sample: "data",
    });

    log.info("this is a test message");
    // @ts-ignore
    const msg = ddLogger.info.mock.calls[0][0];
    expect(msg).toContain("this is a test message");
    // @ts-ignore
    const data = ddLogger.info.mock.calls[0][1];
    expect(data).toMatchObject({
      sample: "data",
    });
  });

  it("should include metadata", () => {
    log.withContext({
      test: "context",
    });

    log
      .withMetadata({
        meta: "data",
      })
      .info("this is a test message");

    // @ts-ignore
    const msg = ddLogger.info.mock.calls[0][0];
    expect(msg).toContain("this is a test message");
    // @ts-ignore
    const data = ddLogger.info.mock.calls[0][1];
    expect(data).toMatchObject({
      sample: "data",
      test: "context",
    });
  });

  it("should include an error", () => {
    log.withContext({
      test: "context",
    });

    log.withError(new Error("err")).info("this is a test message");
    // @ts-ignore
    const msg = ddLogger.info.mock.calls[0][0];
    expect(msg).toContain("this is a test message");
    // @ts-ignore
    const data = ddLogger.info.mock.calls[0][1];
    expect(data).toMatchObject({
      test: "context",
    });
    expect(data.err).toBeDefined();
  });
});
