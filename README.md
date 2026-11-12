# error-first-wrap

**This is the way error handling should be done in TypeScript.**

It isn't. TypeScript has `try/catch`, and the committee is not taking calls. But it is the way error handling *should* be done, and after you've used it for a week you will start leaving passive-aggressive comments on every `try` block you see in code review.

```ts
const [err, user] = await efwAsync(db.findUser(id));
if (err) return notFound();

user.name; // typed as User, because you dealt with the error first
```

That's it. That's the library.

## Seriously, don't install this

It's 40 lines. Open [`efw.ts`](./efw.ts), copy it into your project, and delete the comment that says where you got it. Nobody will know. A dependency for this is how you end up with `left-pad`.

But if you insist:

```sh
npm install error-first-wrap
```

## What it does

You get back a Go-style `[error, result]` tuple. The type is a discriminated union:

```ts
[Error, undefined] | [undefined, T]
```

So TypeScript won't let you use `result` as `T` until you've checked `err`. The error path stops being something you'll get to later (you won't) and becomes something the compiler makes you deal with now.

```ts
import { efw, efwAsync } from 'error-first-wrap';

// sync
const [parseErr, config] = efw(() => JSON.parse(raw));
if (parseErr) return defaults;

// a promise
const [fetchErr, res] = await efwAsync(fetch(url));
if (fetchErr) return retryLater();

// or an async function
const [saveErr] = await efwAsync(() => db.save(row));
if (saveErr) log.warn('save failed', saveErr);
```

If something throws a string, a number, or (it happens) `undefined`, you still get a real `Error` in the error slot. Your `err.message` will never be `undefined.message`.

## FAQ

**Isn't this just Go?**
Yes. Go got this one right.

**Why not a `Result` type with `.map` and `.andThen` and `.unwrapOr`?**
You can have that. It's called a different library, and its README is longer than this one.

**What about `finally`?**
You have `if (err)`. Write the cleanup under it.

**Is this production ready?**
It's two functions and a `try/catch`. It has been production ready since 1995.

## License

MIT. Copy it. That's the whole point.
