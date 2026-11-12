# noTryCatch

**This is the way error handling should be done in TypeScript.**

It isn't. TypeScript has `try/catch`, and nobody on the committee is taking my calls. I still think this is how it should work, and I bet a week with it has you leaving comments on every `try` block you see in review.

```ts
const [err, user] = await efwAsync(db.findUser(id));
if (err) return notFound();

user.name; // a User now, because you dealt with the error first
```

There's a sync version too, `efw(() => JSON.parse(raw))`, same tuple.

## Seriously, don't install this

It's 40 lines. Open [`efw.ts`](./efw.ts), copy it into your project, and delete the comment that says where you got it. Nobody will know. You don't need another `left-pad` in your lockfile.

If you really want it as a dependency, I'm not going to stop you:

```sh
npm install notrycatch
```

## Why try/catch is dumb

So here's the thing. Everyone writes `try/catch` in TypeScript, and then everyone writes the same five bad patterns with it. I've written all of them. You have too.

### The `let` up top

```ts
let user;
try {
  user = await db.findUser(id);
} catch (e) {
  return notFound();
}
user.name;
```

You need `user` after the `try`, so you declare it outside, with no value, as a `let`. Now it's mutable for the rest of the function. Do that three times and you've got three `let`s at the top like you're writing C in 1998.

### The `let` with a fallback

```ts
let config = defaults;
try {
  config = JSON.parse(raw);
} catch {}
```

Did it parse, or is that the default? I don't know, and you don't either. That empty `catch {}` isn't handling anything. It's hiding the error from you.

### The giant try block

```ts
try {
  const user = await db.findUser(id);
  const org = await db.findOrg(user.orgId);
  const invoice = await stripe.invoices.create({ customer: org.stripeId });
  await email.send(user.email, invoice);
} catch (e) {
  log.error('something failed', e);
}
```

So you fix the `let` problem by putting everything in the `try`, and now four different failures share one `catch`. A missing user, a Stripe outage and a bounced email all look the same in your logs. Which one was it? Good luck.

### `e` is `unknown`

```ts
catch (e) {
  log.error(e.message); // 'e' is of type 'unknown'
}
```

JavaScript lets you throw anything. A string, a number, `undefined`, a Promise. So TypeScript gives you `unknown`, and you write `e instanceof Error ? e.message : String(e)` for the four-hundredth time. `efw` does that once, and you always get a real `Error` back.

### Nothing makes you handle it

```ts
const user = await db.findUser(id); // this can throw, and TypeScript says nothing
```

This is the one that actually bugs me. TypeScript doesn't track what throws. There's no `throws` clause and no checked exceptions. `db.findUser` says it returns a `User`, and that's only true when it works. The compiler is happy to let you ship zero error handling, and you find out at 3am.

With `efwAsync`, the return type is this:

```ts
[Error, undefined] | [undefined, User]
```

You can't use `user` as a `User` until you've checked `err`. The code won't compile until you handle it. I think that's where the error belonged the whole time, in the return type, where you can see it.

### And `.catch()`

```ts
const user = await db.findUser(id).catch(() => null);
```

Now `user` is `User | null` and the error is gone. Or you chain `.then().catch().then()` and the control flow reads like a choose-your-own-adventure book.

## What it looks like instead

```ts
const [userErr, user] = await efwAsync(db.findUser(id));
if (userErr) return notFound();

const [orgErr, org] = await efwAsync(db.findOrg(user.orgId));
if (orgErr) return serverError(orgErr);

const [invoiceErr, invoice] = await efwAsync(() => stripe.invoices.create({ customer: org.stripeId }));
if (invoiceErr) return paymentFailed(invoiceErr);

const [emailErr] = await efwAsync(email.send(user.email, invoice));
if (emailErr) log.warn('invoice email bounced', emailErr); // not fatal, keep going
```

Everything's a `const`. Every failure gets its own handling. You read the happy path straight down the left edge. It's Go, basically, and Go got this one right.

## Ban try/catch with ESLint

```js
// eslint.config.js
import efw from 'notrycatch/eslint';

export default [
  // ...your config
  efw,
];
```

That bans `try` blocks and `.catch()` across your codebase. The one `try/catch` that gets to exist is the one inside `efw.ts`, and it has an `eslint-disable` on it. It's built on `no-restricted-syntax`, so if you already use that rule, spread `restrictions` from `notrycatch/eslint` into your own list.

## Claude skill

Your agent writes `try/catch` too. This stops it:

```sh
mkdir -p .claude/skills && cp -r node_modules/notrycatch/skill .claude/skills/efw
```

Or copy [`skill/SKILL.md`](./skill/SKILL.md) by hand. You know the drill by now.

## FAQ

**Isn't this just Go?**
Yes.

**Why not a `Result` type with `.map` and `.andThen` and `.unwrapOr`?**
You can have that. It's a different library, and its README is longer than this one.

**What about `finally`?**
You have `if (err)`. Put the cleanup under it.

**Is this production ready?**
It's two functions and a `try/catch`. It's been production ready since 1995.

## License

MIT. Copy it. That's the whole point.
