import { type ConsolaInstance, consola } from "consola";
import { beforeAll, beforeEach, describe, expect, it, vitest } from "vitest";
import { LogLayer } from "../LogLayer";
import { LoggerType } from "../types";

let log: LogLayer<ConsolaInstance>;

describe("structured logger with consola", () => {
  beforeAll(() => {
    // consola.wrapAll();

    log = new LogLayer<ConsolaInstance>({
      logger: {
        instance: consola,
        type: LoggerType.CONSOLA,
      },
    });
  });

  beforeEach(() => {
    // Re-mock consola before each test call to remove
    // calls from before
    consola.mockTypes(() => vitest.fn());
  });

  it("should log a message", () => {
    log.info("this is a test message");
    // @ts-ignore
    const consolaMessages = consola.info.mock.calls.map((c) => c[0]);
    expect(consolaMessages).toContain("this is a test message");
  });

  it("should log a message with a prefix", () => {
    log.withPrefix("[testing]").info("this is a test message");
    // @ts-ignore
    const consolaMessages = consola.info.mock.calls.map((c) => c[0]);
    expect(consolaMessages).toContain("[testing] this is a test message");
  });

  it("should include context", () => {
    log.withContext({
      sample: "data",
    });

    log.info("this is a test message");
    // @ts-ignore
    const msg = consola.info.mock.calls[0][0];
    expect(msg).toContain("this is a test message");
    // @ts-ignore
    const data = consola.info.mock.calls[0][1];
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
    const msg = consola.info.mock.calls[0][0];
    expect(msg).toContain("this is a test message");
    // @ts-ignore
    const data = consola.info.mock.calls[0][1];
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
    const msg = consola.info.mock.calls[0][0];
    expect(msg).toContain("this is a test message");
    // @ts-ignore
    const data = consola.info.mock.calls[0][1];
    expect(data).toMatchObject({
      test: "context",
    });
    expect(data.err).toBeDefined();
  });
});
