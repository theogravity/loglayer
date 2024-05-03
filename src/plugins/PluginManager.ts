import type { LogLayerPlugin, PluginBeforeDataOutParams, PluginShouldSendToLoggerParams } from "../types";

export class PluginManager<Data extends Record<string, any> = Record<string, any>> {
  private plugins: Array<LogLayerPlugin>;

  constructor(plugins: Array<LogLayerPlugin>) {
    this.plugins = plugins;
  }

  hasPlugins() {
    return this.plugins.length > 0;
  }

  addPlugins(plugins: Array<LogLayerPlugin>) {
    this.plugins.push(...plugins);
  }

  /**
   * Runs plugins that defines onBeforeDataOut.
   */
  runOnBeforeDataOut(params: PluginBeforeDataOutParams): Record<string, any> | undefined {
    const initialData = { ...params }; // Make a shallow copy of params to avoid direct modification

    for (const plugin of this.plugins) {
      if (!plugin.disabled && plugin.onBeforeDataOut) {
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
    return !this.plugins.some((plugin) => {
      // Send to logger if the plugin is disabled or the plugin does not have a 'shouldSendToLogger' function.
      if (plugin.disabled || !plugin.shouldSendToLogger) {
        return false;
      }

      // Return the negation of 'shouldSendToLogger' because 'some' will stop on true,
      // and we stop on an explicit false return value from 'shouldSendToLogger'.
      return !plugin.shouldSendToLogger(params);
    });
  }
}
