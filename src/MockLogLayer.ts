/* eslint @typescript-eslint/no-empty-function: 0 */
/* istanbul ignore file */

import { MockLogBuilder } from "./MockLogBuilder";
import type { ErrorOnlyOpts, ILogBuilder, ILogLayer, LogLayerPlugin } from "./types";
import type { LogLevel, MessageDataType } from "./types";

export class MockLogLayer<ErrorType = Error> implements ILogLayer<any, ErrorType> {
  info(...messages: MessageDataType[]): void {}
  warn(...messages: MessageDataType[]): void {}
  error(...messages: MessageDataType[]): void {}
  debug(...messages: MessageDataType[]): void {}
  trace(...messages: MessageDataType[]): void {}
  fatal(...messages: MessageDataType[]): void {}

  getLoggerInstance() {}

  errorOnly(error: ErrorType, opts?: ErrorOnlyOpts): void {}

  metadataOnly(metadata: Record<string, any>, logLevel: LogLevel): void {}

  addPlugins(plugins: Array<LogLayerPlugin>) {}

  removePlugin(id: string) {}

  enablePlugin(id: string) {}

  disablePlugin(id: string) {}

  withPrefix(prefix: string) {
    return new MockLogLayer() as ILogLayer<any, ErrorType>;
  }

  withContext(context: Record<string, any>): ILogLayer<any, ErrorType> {
    return this as ILogLayer<any, ErrorType>;
  }

  withError(error: ErrorType): ILogBuilder {
    return new MockLogBuilder();
  }

  withMetadata(metadata: Record<string, any>): ILogBuilder {
    return new MockLogBuilder();
  }

  getContext(): Record<string, any> {
    return {};
  }

  enableLogging() {
    return this;
  }

  disableLogging() {
    return this;
  }

  child() {
    return new MockLogLayer() as ILogLayer<any, ErrorType>;
  }

  muteContext() {
    return this;
  }

  unMuteContext() {
    return this;
  }

  muteMetadata() {
    return this;
  }

  unMuteMetadata() {
    return this;
  }
}
