---
"loglayer": minor
---

Add `fatal` log level support

- Adds the `fatal()` method in `loglayer` to write to a `fatal` 
log level.
  * Any logging libraries that do not support `fatal` level will 
  be written as an `error` level instead.
