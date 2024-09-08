---
"loglayer": minor
---

Change messages property of ShouldSendToLoggerParams and PluginBeforeMessageOutParams to `any` from `MessageDataType`.
This allows for more flexibility in the messages property of these params since external libraries may feed in different types of data.
