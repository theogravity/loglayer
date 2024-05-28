---
"loglayer": minor
---

Fix ILogLayer return types

`ILogLayer#withPrefix()` and `ILogLayer#withChild()` were of the incorrect return type. 

Changed to `ILogLayer<ExternalLogger, ErrorType>`.
