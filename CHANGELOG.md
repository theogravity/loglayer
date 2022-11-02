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

