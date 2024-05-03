import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type LogLayerPlugin,
  LogLevel,
  type PluginBeforeDataOutParams,
  type PluginShouldSendToLoggerParams,
} from "../../types";
import { PluginManager } from "../PluginManager";

describe("PluginManager", () => {
  let pluginManager: PluginManager;
  let plugins: LogLayerPlugin[];

  beforeEach(() => {
    plugins = [
      {
        onBeforeDataOut: vi.fn((params) => ({ ...params.data, added: "test" })),
        shouldSendToLogger: vi.fn(() => true),
      },
      {
        onBeforeDataOut: vi.fn((params) => ({ ...params.data, modified: "yes" })),
        shouldSendToLogger: vi.fn(() => false),
      },
    ];
    pluginManager = new PluginManager(plugins);
  });

  it("should initialize with passed plugins", () => {
    expect(pluginManager.hasPlugins()).toBe(true);
  });

  it("adds plugins to the list", () => {
    const newPlugin: LogLayerPlugin = {
      onBeforeDataOut: vi.fn(),
      shouldSendToLogger: vi.fn(),
    };
    pluginManager.addPlugins([newPlugin]);

    expect(pluginManager.hasPlugins()).toBe(true);
    expect(pluginManager["plugins"].length).toBe(3);
  });

  it("runs onBeforeDataOut and modifies data correctly", () => {
    const initialParams: PluginBeforeDataOutParams = {
      logLevel: LogLevel.info,
      data: { initial: "data" },
    };

    const result = pluginManager.runOnBeforeDataOut(initialParams);

    expect(result).toEqual({ initial: "data", added: "test", modified: "yes" });
    expect(plugins[0].onBeforeDataOut).toHaveBeenCalledOnce();
    expect(plugins[1].onBeforeDataOut).toHaveBeenCalledOnce();
  });

  it("runs shouldSendToLogger and properly respects plugin responses", () => {
    const params: PluginShouldSendToLoggerParams = {
      logLevel: LogLevel.error,
      messages: ["Test message"],
      data: { key: "value" },
    };

    const shouldSend1 = pluginManager.runShouldSendToLogger(params);
    expect(shouldSend1).toBe(false);
    expect(plugins[0].shouldSendToLogger).toHaveBeenCalledTimes(1);
    expect(plugins[1].shouldSendToLogger).toHaveBeenCalledTimes(1);

    plugins[0].shouldSendToLogger = vi.fn(() => true);
    plugins[1].shouldSendToLogger = vi.fn(() => true);

    const shouldSend2 = pluginManager.runShouldSendToLogger(params);
    expect(shouldSend2).toBe(true);
    expect(plugins[0].shouldSendToLogger).toHaveBeenCalledTimes(1);
    expect(plugins[1].shouldSendToLogger).toHaveBeenCalledTimes(1);
  });

  it("runs shouldSendToLogger and returns true if not defined", () => {
    const params: PluginShouldSendToLoggerParams = {
      logLevel: LogLevel.error,
      messages: ["Test message"],
      data: { key: "value" },
    };

    // 0th plugin returns true
    plugins[1].shouldSendToLogger = undefined;

    const shouldSend = pluginManager.runShouldSendToLogger(params);
    expect(shouldSend).toBe(true);

    plugins[0].shouldSendToLogger = undefined;
    plugins[1].shouldSendToLogger = undefined;

    const shouldSend2 = pluginManager.runShouldSendToLogger(params);
    expect(shouldSend2).toBe(true);
  });
});
