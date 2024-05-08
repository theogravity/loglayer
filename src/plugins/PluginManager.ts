import {
  type LogLayerPlugin,
  type PluginBeforeDataOutParams,
  PluginCallbackType,
  type PluginShouldSendToLoggerParams,
} from "../types";

const CALLBACK_LIST = [
  PluginCallbackType.onErrorCalled,
  PluginCallbackType.onBeforeDataOut,
  PluginCallbackType.onMetadataCalled,
  PluginCallbackType.shouldSendToLogger,
];

export class PluginManager<Data extends Record<string, any> = Record<string, any>> {
  private idToPlugin: Record<string, LogLayerPlugin>;
  // Indexes for each plugin type
  private onBeforeDataOut: Array<string> = [];
  private shouldSendToLogger: Array<string> = [];
  private onMetadataCalled: Array<string> = [];
  private onErrorCalled: Array<string> = [];

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

      this.idToPlugin[plugin.id] = plugin;
    }
  }

  private indexPlugins() {
    this.onBeforeDataOut = [];
    this.shouldSendToLogger = [];
    this.onMetadataCalled = [];
    this.onErrorCalled = [];

    for (const plugin of Object.values(this.idToPlugin)) {
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

  countPlugins() {
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
    let data: Record<string, any> = metadata;

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

  /**
   * Runs plugins that define onErrorCalled.
   */
  runOnErrorCalled(error: any) {
    let data: any = null;

    for (const pluginId of this.onErrorCalled) {
      const plugin = this.idToPlugin[pluginId];

      const result = plugin.onErrorCalled!(data);

      if (result) {
        data = result;
      } else {
        return null;
      }
    }

    return data;
  }
}
