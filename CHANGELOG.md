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

