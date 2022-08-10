/* eslint @typescript-eslint/no-empty-function: 0 */
/* istanbul ignore file */

import { ILogBuilder } from './types'
import type { MessageDataType } from './types'

export class MockLogBuilder implements ILogBuilder {
  constructor() {}

  debug(...messages: MessageDataType[]): void {}

  error(...messages: MessageDataType[]): void {}

  info(...messages: MessageDataType[]): void {}

  trace(...messages: MessageDataType[]): void {}

  warn(...messages: MessageDataType[]): void {}

  enableLogging() {
    return this
  }

  disableLogging() {
    return this
  }
}
