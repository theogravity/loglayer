# loglayer

## 4.3.1

### Patch Changes

- [#29](https://github.com/theogravity/loglayer/pull/29) [`0d5a9c7`](https://github.com/theogravity/loglayer/commit/0d5a9c77fd4ed02314285f69d6ab07affb1bbd15) Thanks [@theogravity](https://github.com/theogravity)! - Fixes child logger not inheriting plugins.

  Before plugins, hooks were copied to the child logger, so this fix makes the behavior consistent with prior behavior.

  The README for child loggers has been updated
  to include that plugins are now inherited.

## 4.3.0

### Minor Changes

- [`74756da`](https://github.com/theogravity/loglayer/commit/74756da219c8efaf06636c09255d613080df68e6) Thanks [@theogravity](https://github.com/theogravity)! - Add `onMetadataCalled()` plugin callback to hook into `withMetadata()` and `metadataOnly()` calls.

  See the README section on `intercept metadata calls` for usage details.

### Patch Changes

- [#27](https://github.com/theogravity/loglayer/pull/27) [`a6fb176`](https://github.com/theogravity/loglayer/commit/a6fb1768b9ac28900a09f4097aac47c4465ec7b9) Thanks [@theogravity](https://github.com/theogravity)! - Refactor `PluginManager` for performance improvements.

## 4.2.1

### Patch Changes

- [#25](https://github.com/theogravity/loglayer/pull/25) [`e5632c8`](https://github.com/theogravity/loglayer/commit/e5632c8470f5a16fdf5d70aff07e66ca51669fb0) Thanks [@theogravity](https://github.com/theogravity)! - Readme updates

## 4.2.0

### Minor Changes

- [#23](https://github.com/theogravity/loglayer/pull/23) [`e6323b7`](https://github.com/theogravity/loglayer/commit/e6323b7f182375aa28ee463556a893197c487af8) Thanks [@theogravity](https://github.com/theogravity)! - Add [`signale`](https://github.com/klaudiosinani/signale) support

  See README.md for more details.

- [#20](https://github.com/theogravity/loglayer/pull/20) [`c3b5468`](https://github.com/theogravity/loglayer/commit/c3b5468f961e89ccf1c3ac673d17ae5ef2905fa5) Thanks [@theogravity](https://github.com/theogravity)! - Add [`log4js-node`](https://github.com/log4js-node/log4js-node) support

  See README.md for more details.

- [#22](https://github.com/theogravity/loglayer/pull/22) [`2dfe830`](https://github.com/theogravity/loglayer/commit/2dfe830170b55ffdaaa1783a056ae6c08280187a) Thanks [@theogravity](https://github.com/theogravity)! - Add `fatal` log level support

  - Adds the `fatal()` method in `loglayer` to write to a `fatal`
    log level.
    - Any logging libraries that do not support `fatal` level will
      be written as an `error` level instead.

- [#24](https://github.com/theogravity/loglayer/pull/24) [`f989f15`](https://github.com/theogravity/loglayer/commit/f989f15d8ead2a8bf1e8ff5b6f0b4e810744fad6) Thanks [@theogravity](https://github.com/theogravity)! - Add consola support

## 4.1.1

### Patch Changes

- [#18](https://github.com/theogravity/loglayer/pull/18) [`14b969c`](https://github.com/theogravity/loglayer/commit/14b969cc64614400f9fdfd39d3c57486dc47c731) Thanks [@theogravity](https://github.com/theogravity)! - Tiny perf improvements

## 4.1.0

### Minor Changes

- [#15](https://github.com/theogravity/loglayer/pull/15) [`c583c94`](https://github.com/theogravity/loglayer/commit/c583c944f484df20be4796f77e517ed8aa48a0bf) Thanks [@theogravity](https://github.com/theogravity)! - Adds an optional `id` field to plugins and the ability to manage plugins.

  The following methods have been added:

  - `LogLayer#removePlugin(id: string)`
  - `LogLayer#enablePlugin(id: string)`
  - `LogLayer#disablePlugin(id: string)`

## 4.0.0

### Major Changes

- [#13](https://github.com/theogravity/loglayer/pull/13) [`d1a8cc2`](https://github.com/theogravity/loglayer/commit/d1a8cc21e4191547e839d334c9386e25f0410235) Thanks [@theogravity](https://github.com/theogravity)! - - Removes hooks and adds a plugin system where you can define multiple hooks to run instead.

  - Adds esm and cjs builds to the package

  **Breaking Changes**

  - The `hooks` option has been removed
  - The `setHooks()` method has been removed
  - A `plugins` option has been added
  - An `addPlugins()` method has been added

  _There will be a way to remove / disable specific plugins in a future release._

  **Migrating from 3.x to 4.x**

  Your 3.x definition may look like this:

  ```typescript
  {
    hooks: {
      onBeforeDataOut: ({ data }) => {
        // do something with data
        return data;
      },
      shouldSendToLogger: () => {
        return true;
      }
    }
  }
  ```

  The 4.x version of this would look like this:

  ```typescript
  {
    plugins: [
      {
        onBeforeDataOut: (data) => {
          // do something with data
          return data;
        },
        shouldSendToLogger: () => {
          return true;
        },
      },
    ];
  }
  ```

  Type changes:

  - `LogLayerHooksConfig` -> `LogLayerPlugin`
  - `HookBeforeDataOutParams` -> `PluginBeforeDataOutParams`
  - `HookBeforeDataOutFn` -> `PluginBeforeDataOutFn`
  - `HookShouldSendToLoggerParams` -> `PluginShouldSendToLoggerParams`
  - `HookShouldSendToLoggerFn` -> `PluginShouldSendToLoggerFn`

  Summary:

  - Replace `hooks` with `plugins`
  - For your existing hooks, move them into the `plugins` array where each entry is an object with the hook definition

  See `README.md` for more details.

## 3.1.0

- Added new configuration option `muteContext` and `muteMetadata` to disable context and metadata logging.
- Added the following methods:
  - `LogLayer#muteContext()`
  - `LogLayer#unmuteContext()`
  - `LogLayer#muteMetadata()`
  - `LogLayer#unmuteMetadata()`

See readme for usage details.

Internal: Switch from `eslint` to [`biomejs.dev`](https://biomejs.dev/) for linting.

## 3.0.1

- Created a separate Typescript type for the `onBeforeDataOut` hook parameter, `OnBeforeDataOutParams`.

## 3.0.0

**Breaking change**

- The hook `onBeforeDataOut` signature has changed
  - from: `onBeforeDataOut(data)`
  - to: `onBeforeDataOut({ data, logLevel })`

## 2.0.3

**Contributor:** Theo Gravity

- Adds `electron-log` support.

## 2.0.2 - Mon Mar 20 2023 16:46:04

**Contributor:** Theo Gravity

- Exports the `HookShouldSendToLoggerParams` type and sets a default value for the `Data` generic.

## 2.0.1 - Mon Mar 20 2023 13:19:47

**Contributor:** Theo Gravity

- Fixed issue where `shouldSendToLogger` may not send logs out because `messages` may have been manipulated. `messages`
  is now a copy of the original.

## 2.0.0 - Mon Mar 20 2023 12:25:30

**Contributor:** Theo Gravity

_Breaking change_

The `shouldSendToLogger` hook parameter is now an object, and adds in `logLevel` as a property.

See `README.md` for updated usage details.

## 1.6.0 - Wed Mar 15 2023 13:25:45

**Contributor:** Theo Gravity

- Add `shouldSendToLogger` hook (#11)

This hook allows you to conditionally send a log entry or not to the logger.

## 1.5.0 - Wed Mar 01 2023 13:11:13

**Contributor:** Theo Gravity

- Added log message prefixing
  - Can be set via `prefix` config option, or `LogLayer#withPrefix()`. See README.md for usage info.
- Fix issue where `LogLayer#child()` was setting empty context data when context has not been set at all

## 1.4.2 - Wed Nov 02 2022 05:23:14

**Contributor:** Theo Gravity

- Fix issue where `LogLayer#child()` was not creating a shallow copy of context (#10)

The documentation says the context should be shallow copied, but it wasn't. Now it is.

## 1.4.1 - Wed Nov 02 2022 05:06:51

**Contributor:** Theo Gravity

- Add support for creating child loggers (#9)

This adds a new method called `LogLayer#child()` that will create a new LogLayer instance with the original configuration and context data copied over.

## 1.3.4 - Mon Aug 22 2022 20:18:36

**Contributor:** Theo Gravity

- Add consoleDebug option (#7)

## 1.3.3 - Wed Aug 10 2022 04:17:36

**Contributor:** Theo Gravity

- Add config option and methods to disable / enable logging (#6)

This adds an optional config option called `enabled`, when set to `false`, will stop log output.

Corresponding methods `enableLogging()` and `disableLogging()` have also been added.

## 1.3.2 - Wed Aug 10 2022 02:24:37

**Contributor:** Theo Gravity

- Add `setHooks()` method (#5)

Adds a new method on `LogLayer` called `setHooks()` that allows
hooks to be set or updated after creation of the `LogLayer`.

Useful as an alternative to using configuration on init to set
a hook

## 1.3.1 - Wed Aug 10 2022 02:01:35

**Contributor:** Theo Gravity

- Add hooks feature, add onBeforeDataOut hook (#4)

This adds the ability to register hooks with `LogLayer`. The first available hook, `onBeforeDataOut()`, allows manipulation of the data object before it is sent to the logging library.

See the `README.md` hooks section for more details.

## 1.2.1 - Tue Aug 09 2022 01:50:05

**Contributor:** Theo Gravity

- Fix issue where data is lost if fieldName for context and metadata is the same (#3)

If you configure the context and metadata fieldName to have the same name,
only the metadata is captured, while the context is lost.

The data is now merged into the shared field.

## 1.1.1 - Mon Jun 13 2022 22:14:21

**Contributor:** Theo Gravity

- Add getContext() (#2)

Adds a new method to the logger, `getContext()`, which returns the current context.

## 1.0.2 - Mon Nov 29 2021 04:16:06

**Contributor:** Theo Gravity

- Update README.md

## 1.0.1 - Mon Nov 29 2021 03:48:11

**Contributor:** Theo Gravity

- Make withContext() chainable (#1)

- `withContext()` is now chainable. Most will want to call it right after creating a new `LogLayer` instead of having a separate line for it.
