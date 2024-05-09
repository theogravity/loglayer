---
"loglayer": patch
---

Fixes child logger not inheriting plugins.

Before plugins, hooks were copied to the child logger, so this fix makes the behavior consistent with prior behavior.

The README for child loggers has been updated
to include that plugins are now inherited.
