import { beforeEach, describe, expect, it, vi, vitest } from "vitest";
import {
  type LogLayerPlugin,
  LogLevel,
  type PluginBeforeDataOutParams,
  PluginCallbackType,
  type PluginShouldSendToLoggerParams,
} from "../../types";
import { PluginManager } from "../PluginManager";

describe("PluginManager", () => {
  let pluginManager: PluginManager;
  let plugins: LogLayerPlugin[];

  beforeEach(() => {
    plugins = [
      {
        id: "plugin1",
        onBeforeDataOut: vi.fn((params) => ({ ...params.data, added: "test" })),
        shouldSendToLogger: vi.fn(() => true),
      },
      {
        id: "plugin2",
        onBeforeDataOut: vi.fn((params) => ({ ...params.data, modified: "yes" })),
        shouldSendToLogger: vi.fn(() => false),
      },
      {
        id: "plugin3",
        shouldSendToLogger: vi.fn(() => false),
      },
    ];
    pluginManager = new PluginManager(plugins);
  });

  it("should throw an error if a plugin with the same id already exists", () => {
    const plugin = {
      id: "plugin1",
      onBeforeDataOut: vi.fn(),
    };

    expect(() => pluginManager.addPlugins([plugin])).toThrowError("[LogLayer] Plugin with id plugin1 already exists.");
  });

  it("should maintain proper insertion order", () => {
    const plugin = {
      id: "plugin4",
      onBeforeDataOut: vi.fn(),
    };

    pluginManager.addPlugins([plugin]);

    expect(pluginManager.countPlugins()).toBe(4);
    expect(pluginManager["onBeforeDataOut"]).toEqual(["plugin1", "plugin2", "plugin4"]);

    pluginManager.removePlugin("plugin2");
    expect(pluginManager["onBeforeDataOut"]).toEqual(["plugin1", "plugin4"]);
  });

  it("should initialize with passed plugins", () => {
    expect(pluginManager.hasPlugins(PluginCallbackType.onBeforeDataOut)).toBe(true);
    expect(pluginManager.hasPlugins(PluginCallbackType.shouldSendToLogger)).toBe(true);
  });

  it("adds plugins to the list", () => {
    const newPlugin: LogLayerPlugin = {
      onBeforeDataOut: vi.fn(),
      shouldSendToLogger: vi.fn(),
    };

    pluginManager.addPlugins([newPlugin]);

    expect(pluginManager.hasPlugins(PluginCallbackType.onBeforeDataOut)).toBe(true);
    expect(pluginManager.hasPlugins(PluginCallbackType.shouldSendToLogger)).toBe(true);
    expect(pluginManager.countPlugins(PluginCallbackType.onBeforeDataOut)).toBe(3);
    expect(pluginManager.countPlugins(PluginCallbackType.shouldSendToLogger)).toBe(4);
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
    plugins[2].shouldSendToLogger = vi.fn(() => true);

    const shouldSend2 = pluginManager.runShouldSendToLogger(params);
    expect(shouldSend2).toBe(true);
    expect(plugins[0].shouldSendToLogger).toHaveBeenCalledTimes(1);
    expect(plugins[1].shouldSendToLogger).toHaveBeenCalledTimes(1);
    expect(plugins[2].shouldSendToLogger).toHaveBeenCalledTimes(1);
  });

  it("disables a plugin", () => {
    pluginManager.disablePlugin(plugins[0].id!);
    expect(plugins[0].disabled).toBe(true);
  });

  it("enables a plugin", () => {
    plugins[0].disabled = true;
    pluginManager.enablePlugin(plugins[0].id!);
    expect(plugins[0].disabled).toBe(false);
  });

  it("removes a plugin", () => {
    pluginManager.removePlugin(plugins[0].id!);
    expect(pluginManager.countPlugins()).toBe(2);
    expect(pluginManager.countPlugins(PluginCallbackType.onBeforeDataOut)).toBe(1);
    expect(pluginManager.countPlugins(PluginCallbackType.shouldSendToLogger)).toBe(2);
  });

  describe("runOnMetadataCalled", () => {
    it("should return a modified metadata object", () => {
      pluginManager.addPlugins([
        {
          id: "metadata-1",
          onMetadataCalled: (params) => {
            return {
              ...params,
              added: "test",
            };
          },
        },
        {
          id: "metadata-2",
          onMetadataCalled: (params) => {
            return {
              ...params,
              modified: "yes",
            };
          },
        },
      ]);

      expect(pluginManager.countPlugins(PluginCallbackType.onMetadataCalled)).toBe(2);

      const metadata = pluginManager.runOnMetadataCalled({ initial: "data" });

      expect(metadata).toEqual({ added: "test", modified: "yes", initial: "data" });
    });

    it("should return a null result", () => {
      const plugin = {
        id: "metadata-1",
        onMetadataCalled: vitest.fn().mockReturnValue(null),
      };

      const plugin2 = {
        id: "metadata-2",
        onMetadataCalled: vitest.fn().mockReturnValue({ modified: "yes " }),
      };

      // First plugin returns a null result, so the second plugin should not run
      pluginManager.addPlugins([plugin, plugin2]);

      const metadata = pluginManager.runOnMetadataCalled({ initial: "data" });

      expect(metadata).toEqual(null);
      expect(plugin.onMetadataCalled).toHaveBeenCalledOnce();
      expect(plugin2.onMetadataCalled).not.toHaveBeenCalled();
    });
  });
});
