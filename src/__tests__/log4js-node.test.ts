import { PassThrough } from "node:stream";
import log4js from "log4js";
import { describe, expect, it } from "vitest";
import { LogLayer } from "../LogLayer";
import { LoggerType } from "../types";

function getLoggerInstance() {
  const mockedStream = new PassThrough();

  function streamAppender(layout, timezoneOffset) {
    return (loggingEvent) => {
      mockedStream.write(`${layout(loggingEvent, timezoneOffset)}\n`);
    };
  }

  function configureStream(config, layouts) {
    let layout = layouts.colouredLayout;
    if (config.layout) {
      layout = layouts.layout(config.layout.type, config.layout);
    }
    return streamAppender(layout, config.timezoneOffset);
  }

  log4js.configure({
    appenders: {
      customStream: {
        type: {
          configure: configureStream,
        },
        layout: {
          type: "messagePassThrough",
        },
      },
    },
    categories: {
      default: {
        appenders: ["customStream"],
        level: "debug",
      },
    },
  });

  const logInstance = log4js.getLogger();
  const log = new LogLayer<log4js.Logger>({
    logger: {
      instance: logInstance,
      type: LoggerType.LOG4JS_NODE,
    },
  });

  return {
    log,
    mockedStream,
  };
}

describe("structured logger with log4js", () => {
  it("should log a message", () => {
    expect.assertions(1);
    const { log, mockedStream } = getLoggerInstance();

    mockedStream.on("data", (data: Buffer) => {
      expect(data.toString()).toEqual("this is a test message\n");
      mockedStream.destroy();
    });

    log.info("this is a test message");
  });

  it("should log a message with a prefix", () => {
    expect.assertions(1);
    const { log, mockedStream } = getLoggerInstance();

    mockedStream.on("data", (data: Buffer) => {
      expect(data.toString()).toBe("[testing] this is a test message\n");
      mockedStream.destroy();
    });

    log.withPrefix("[testing]").info("this is a test message");
  });

  it("should include context", () => {
    expect.assertions(1);
    const { log, mockedStream } = getLoggerInstance();
    log.withContext({
      test: "context",
    });

    mockedStream.on("data", (data: Buffer) => {
      expect(data.toString()).toBe(`this is a test message { test: 'context' }\n`);
      mockedStream.destroy();
    });

    log.info("this is a test message");
  });

  it("should include metadata", () => {
    expect.assertions(1);
    const { log, mockedStream } = getLoggerInstance();
    log.withContext({
      test: "context",
    });

    mockedStream.on("data", (data: Buffer) => {
      expect(data.toString()).toBe(`this is a test message { test: 'context', meta: 'data' }\n`);
      mockedStream.destroy();
    });

    log
      .withMetadata({
        meta: "data",
      })
      .info("this is a test message");
  });

  it("should include an error", () => {
    expect.assertions(2);
    const { log, mockedStream } = getLoggerInstance();
    log.withContext({
      test: "context",
    });

    mockedStream.on("data", (data: Buffer) => {
      const msg = data.toString();
      expect(msg).toContain("this is a test message");
      expect(msg).toContain("err: Error: err");
      mockedStream.destroy();
    });

    log.withError(new Error("err")).info("this is a test message");
  });
});
