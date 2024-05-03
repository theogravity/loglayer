---
"loglayer": major
---

- Removes hooks and adds a plugin system where you can
define multiple hooks to run instead.
- Adds esm and cjs builds to the package

**Breaking Changes**

- The `hooks` option has been removed
- The `setHooks()` method has been removed
- A `plugins` option has been added
- An `addPlugins()` method has been added

*There will be a way to remove / disable specific plugins in a future release.*

**Migrating from 3.x to 4.x**

Your 3.x definition may look like this:

```
{
  hooks: {
    onBeforeDataOut: (data) => {
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
      }
    }
  ]
}
```

Summary:

- Replace `hooks` with `plugins`
- For your existing hooks, move them into the `plugins` array where each entry is an object with the hook definition
