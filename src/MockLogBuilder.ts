/* eslint @typescript-eslint/no-empty-function: 0 */
/* istanbul ignore file */

import type { ILogBuilder } from "./types";

import type { MessageDataType } from "./types/common.types";

export class MockLogBuilder implements ILogBuilder {
  debug(...messages: MessageDataType[]): void {}

  error(...messages: MessageDataType[]): void {}

  info(...messages: MessageDataType[]): void {}

  trace(...messages: MessageDataType[]): void {}

  warn(...messages: MessageDataType[]): void {}

  fatal(...messages: MessageDataType[]): void {}

  enableLogging() {
    return this;
  }

  disableLogging() {
    return this;
  }
}
