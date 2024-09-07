/* eslint @typescript-eslint/no-empty-function: 0 */
/* istanbul ignore file */

import type { ErrorDataType, ILogBuilder } from "./types";

import type { MessageDataType } from "./types/common.types";

export class MockLogBuilder<ErrorType = Error> implements ILogBuilder<ErrorType> {
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

  withMetadata(metadata: Record<string, any>): ILogBuilder<ErrorType> {
    return this;
  }

  withError(error: ErrorType): ILogBuilder<ErrorType> {
    return this;
  }
}
