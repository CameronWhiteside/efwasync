---
name: efw
description: Use when writing or changing TypeScript/JavaScript that can throw or reject (I/O, fetch, JSON.parse, DB calls, SDK clients) in a project that uses notrycatch (efw / efwAsync), or when ESLint flags a try/catch or .catch(). Handle errors as Go-style [err, result] tuples, never try/catch.
---

# noTryCatch

This project does not use `try/catch` or `.catch()`. Anything that can throw goes through `efwAsync` (promise or async function) or `efw` (sync), and you check the error before touching the result.

```ts
import { efw, efwAsync } from '@cameronwhiteside/notrycatch'; // or the project's local copy of efw.ts

const [err, user] = await efwAsync(db.findUser(id));
if (err) return notFound();
user.name; // typed as User only after the error is handled
```

## Rules

1. **Check the error on the very next line.** `if (err) ...` comes straight after the call and returns, throws a domain error, or falls back. Never use the result before that check.
2. **`const`, never `let`.** The tuple is the declaration. If you're writing `let x;` above a fallible call so you can assign it later, you're rebuilding try/catch.
3. **Return early.** Keep the happy path unindented. No `else` after `if (err) return`.
4. **One call per wrap.** Wrap each fallible step separately so each error gets its own handling. Don't wrap a whole function body in one thunk to dodge the rule.
5. **Name errors per step** when there are several: `[fetchErr, res]`, `[parseErr, body]`, `[saveErr]`.
6. **Only care about failure? Drop the result:** `const [saveErr] = await efwAsync(() => db.save(row));`
7. **Don't wrap things that can't throw.** Pure math, property access on known shapes and string formatting need no wrapper.
8. **Promise or thunk.** `efwAsync(fetch(url))` or `efwAsync(() => fetch(url))`. Use the thunk when the call might throw synchronously before it returns a promise.
9. **Errors are always `Error`.** Non-Error throws get wrapped, so `err.message` is safe without narrowing `unknown`.
10. **Rethrow only at boundaries.** If a framework expects a throw (route handler, test), `if (err) throw err;` is fine.

## Converting existing code

```ts
// before
let body;
try {
  const res = await fetch(url);
  body = await res.json();
} catch (e) {
  log.warn(e);
  return null;
}
return body;

// after
const [fetchErr, res] = await efwAsync(fetch(url));
if (fetchErr) return log.warn(fetchErr), null;
const [parseErr, body] = await efwAsync(res.json());
if (parseErr) return log.warn(parseErr), null;
return body;
```

`.then(...).catch(...)` chains become sequential `await efwAsync(...)` calls the same way.

## Lint

ESLint bans `TryStatement` and `.catch()` through `@cameronwhiteside/notrycatch/eslint`. The only allowed `try/catch` is inside `efw.ts` itself. Never add `eslint-disable` to get around it anywhere else. Rewrite the code instead.
