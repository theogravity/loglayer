import {
  type LogLayerPlugin,
  type MessageDataType,
  type PluginBeforeDataOutParams,
  type PluginBeforeMessageOutParams,
  PluginCallbackType,
  type PluginShouldSendToLoggerParams,
} from "../types";

const CALLBACK_LIST = [
  PluginCallbackType.onBeforeDataOut,
  PluginCallbackType.onMetadataCalled,
  PluginCallbackType.shouldSendToLogger,
  PluginCallbackType.onBeforeMessageOut,
];

interface LogLayerPluginWithTimestamp extends LogLayerPlugin {
  registeredAt: number;
}

export class PluginManager<Data extends Record<string, any> = Record<string, any>> {
  private idToPlugin: Record<string, LogLayerPluginWithTimestamp>;
  // Indexes for each plugin type
  private onBeforeDataOut: Array<string> = [];
  private shouldSendToLogger: Array<string> = [];
  private onMetadataCalled: Array<string> = [];
  private onBeforeMessageOut: Array<string> = [];

  constructor(plugins: Array<LogLayerPlugin>) {
    this.idToPlugin = {};
    this.mapPlugins(plugins);
    this.indexPlugins();
  }

  private mapPlugins(plugins: Array<LogLayerPlugin>) {
    for (const plugin of plugins) {
      if (!plugin.id) {
        plugin.id = new Date().getTime().toString() + Math.random().toString();
      }

      if (this.idToPlugin[plugin.id]) {
        throw new Error(`[LogLayer] Plugin with id ${plugin.id} already exists.`);
      }

      plugin["registeredAt"] = new Date().getTime();
      this.idToPlugin[plugin.id] = plugin as LogLayerPluginWithTimestamp;
    }
  }

  private indexPlugins() {
    this.onBeforeDataOut = [];
    this.shouldSendToLogger = [];
    this.onMetadataCalled = [];
    this.onBeforeMessageOut = [];

    const pluginList = Object.values(this.idToPlugin).sort((a, b) => a.registeredAt - b.registeredAt);

    for (const plugin of pluginList) {
      if (plugin.disabled) {
        return;
      }

      for (const callback of CALLBACK_LIST) {
        // If the callback is defined, add the plugin id to the callback list
        if (plugin[callback] && plugin.id) {
          this[callback].push(plugin.id);
        }
      }
    }
  }

  hasPlugins(callbackType: PluginCallbackType) {
    return this[callbackType].length > 0;
  }

  countPlugins(callbackType?: PluginCallbackType) {
    if (callbackType) {
      return this[callbackType].length;
    }

    return Object.keys(this.idToPlugin).length;
  }

  addPlugins(plugins: Array<LogLayerPlugin>) {
    this.mapPlugins(plugins);
    this.indexPlugins();
  }

  enablePlugin(id: string) {
    const plugin = this.idToPlugin[id];

    if (plugin) {
      plugin.disabled = false;
    }

    this.indexPlugins();
  }

  disablePlugin(id: string) {
    const plugin = this.idToPlugin[id];

    if (plugin) {
      plugin.disabled = true;
    }

    this.indexPlugins();
  }

  removePlugin(id: string) {
    delete this.idToPlugin[id];
    this.indexPlugins();
  }

  /**
   * Runs plugins that defines onBeforeDataOut.
   */
  runOnBeforeDataOut(params: PluginBeforeDataOutParams): Record<string, any> | undefined {
    const initialData = { ...params }; // Make a shallow copy of params to avoid direct modification

    for (const pluginId of this.onBeforeDataOut) {
      const plugin = this.idToPlugin[pluginId];

      if (plugin.onBeforeDataOut) {
        const result = plugin.onBeforeDataOut({
          data: initialData.data,
          logLevel: initialData.logLevel,
        });

        if (result) {
          if (!initialData.data) {
            initialData.data = {};
          }

          // Mutate initialData.data directly instead of spreading it repeatedly
          Object.assign(initialData.data, result);
        }
      }
    }

    return initialData.data;
  }

  /**
   * Runs plugins that define shouldSendToLogger. Any plugin that returns false will prevent the message from being sent to the logger.
   */
  runShouldSendToLogger(params: PluginShouldSendToLoggerParams) {
    return !this.shouldSendToLogger.some((pluginId) => {
      const plugin = this.idToPlugin[pluginId];

      // Return the negation of 'shouldSendToLogger' because 'some' will stop on true,
      // and we stop on an explicit false return value from 'shouldSendToLogger'.
      return !plugin.shouldSendToLogger!(params);
    });
  }

  /**
   * Runs plugins that define onMetadataCalled.
   */
  runOnMetadataCalled(metadata: Record<string, any>): Record<string, any> | null {
    // Create a shallow copy of metadata to avoid direct modification
    let data: Record<string, any> = {
      ...metadata,
    };

    for (const pluginId of this.onMetadataCalled) {
      const plugin = this.idToPlugin[pluginId];

      const result = plugin.onMetadataCalled!(data);

      if (result) {
        data = result;
      } else {
        return null;
      }
    }

    return data;
  }

  runOnBeforeMessageOut(params: PluginBeforeMessageOutParams): MessageDataType[] {
    let messages = [...params.messages];

    for (const pluginId of this.onBeforeMessageOut) {
      const plugin = this.idToPlugin[pluginId];

      const result = plugin.onBeforeMessageOut!({
        messages: messages,
        logLevel: params.logLevel,
      });

      if (result) {
        messages = result;
      }
    }

    return messages;
  }
}
