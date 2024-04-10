import { PassThrough } from "node:stream";
import { serializeError } from "serialize-error";
import winston from "winston";
import { LogLayer } from "../LogLayer";
import { LoggerType } from "../types";

function getLoggerInstance() {
  const mockedStream = new PassThrough();
  const w = winston.createLogger({
    transports: [
      new winston.transports.Stream({
        stream: mockedStream,
        level: "debug",
      }),
    ],
  });

  const log = new LogLayer<winston.Logger>({
    logger: {
      instance: w,
      type: LoggerType.WINSTON,
    },
    error: {
      serializer: serializeError,
    },
  });

  return {
    log,
    mockedStream,
  };
}

describe("structured logger with winston", () => {
  it("should log a message", () => {
    expect.assertions(1);
    const { log, mockedStream } = getLoggerInstance();

    mockedStream.on("data", (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>;
      expect(entry.message).toBe("this is a test message");
      mockedStream.destroy();
    });

    log.info("this is a test message");
  });

  it("should log a message with a prefix", () => {
    expect.assertions(1);
    const { log, mockedStream } = getLoggerInstance();

    mockedStream.on("data", (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>;
      expect(entry.message).toBe("[testing] this is a test message");
      mockedStream.destroy();
    });

    log.withPrefix("[testing]").info("this is a test message");
  });

  it("should include context", () => {
    expect.assertions(2);
    const { log, mockedStream } = getLoggerInstance();
    log.withContext({
      test: "context",
    });

    mockedStream.on("data", (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>;
      expect(entry.test).toBe("context");
      expect(entry.message).toBe("this is a test message");
      mockedStream.destroy();
    });

    log.info("this is a test message");
  });

  it("should include metadata", () => {
    expect.assertions(2);
    const { log, mockedStream } = getLoggerInstance();
    log.withContext({
      test: "context",
    });

    mockedStream.on("data", (data: Buffer) => {
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>;
      expect(entry.meta).toBe("data");
      expect(entry.message).toBe("this is a test message");
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
      const entry = JSON.parse(data.toString()) as unknown as Record<string, any>;
      expect(entry.err.message).toBe("err");
      expect(entry.message).toBe("this is a test message");
      mockedStream.destroy();
    });

    log.withError(new Error("err")).debug("this is a test message");
  });
});
