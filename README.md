# efwasync

**This is the way error handling should be done in TypeScript.**

It isn't. TypeScript has `try/catch`, and nobody on the committee is taking my calls. I still think this is how it should work, and I bet a week with it has you leaving comments on every `try` block you see in review.

`efwAsync` is error-first wrap, async. You hand it a promise and get back `[err, result]`.

```ts
import { efwAsync } from 'efwasync';

declare function findUser(id: string): Promise<User>;

const [err, user] = await efwAsync(findUser(id));
// err:  Error | undefined
// user: User | undefined

user.name; // ✗ 'user' is possibly 'undefined'

if (err) return notFound();

user.name; // ✓ user: User, because you dealt with the error first
```

There's a sync one too, `efw`, for things like `JSON.parse`. Same tuple.

```ts
import { efw } from 'efwasync';

const [err, config] = efw<Config>(() => JSON.parse(raw));
// err:    Error | undefined
// config: Config | undefined
if (err) return defaults;
// config: Config
```

You need `strictNullChecks` on (it comes with `strict`) for the narrowing to work. You should have that on anyway.

## Seriously, don't install this

It's 40 lines. Open [`efw.ts`](./efw.ts), copy it into your project, and delete the comment that says where you got it. Nobody will know. You don't need another `left-pad` in your lockfile.

If you really want it as a dependency, I'm not going to stop you:

```sh
npm install efwasync
```

## Why try/catch is dumb

So here's the thing. Everyone writes `try/catch` in TypeScript, and then everyone writes the same bad patterns with it. I've written all of them. You have too.

### The `let` up top

```ts
let user: User;
try {
  user = await findUser(id);
} catch (e: unknown) {
  return notFound();
}
user.name; // user: User, and still reassignable for the rest of the function
```

You need `user` after the `try`, so you declare it outside, with no value, as a `let`. Now it's mutable for the rest of the function. Do that three times and you've got three `let`s at the top like you're writing C in 1998.

### The `let` with a fallback

```ts
let config: Config = defaults;
try {
  config = JSON.parse(raw); // JSON.parse returns any, so this compiles no matter what's in raw
} catch {}
// config: Config. Parsed or default? The type can't tell you.
```

Did it parse, or is that the default? I don't know, and you don't either. That empty `catch {}` isn't handling anything. It's hiding the error from you.

### The giant try block

```ts
try {
  const user: User = await findUser(id);
  const org: Org = await findOrg(user.orgId);
  const invoice: Stripe.Invoice = await stripe.invoices.create({ customer: org.stripeId });
  await sendEmail(user.email, invoice);
} catch (e: unknown) { // thrown by any of four calls, and the type is the same for all of them
  log.error('something failed', e);
}
```

So you fix the `let` problem by putting everything in the `try`, and now four different failures share one `catch`. A missing user, a Stripe outage and a bounced email all look the same in your logs. Which one was it? Good luck.

### `e` is `unknown`

```ts
catch (e: unknown) {
  log.error(e.message); // ✗ 'e' is of type 'unknown'
}
```

JavaScript lets you throw anything. A string, a number, `undefined`, a Promise. So TypeScript gives you `unknown`, and you write `e instanceof Error ? e.message : String(e)` for the four-hundredth time. `efw` does that once, and you always get a real `Error` back.

### Nothing makes you handle it

```ts
declare function findUser(id: string): Promise<User>; // no mention of failure anywhere

const user: User = await findUser(id); // this can throw, and TypeScript says nothing
```

This is the one that actually bugs me. TypeScript doesn't track what throws. There's no `throws` clause and no checked exceptions. `findUser` says it returns a `User`, and that's only true when it works. The compiler is happy to let you ship zero error handling, and you find out at 3am.

With `efwAsync`, the return type is this:

```ts
efwAsync(findUser(id)): Promise<readonly [Error, undefined] | readonly [undefined, User]>
```

You can't use `user` as a `User` until you've checked `err`. The code won't compile until you handle it. I think that's where the error belonged the whole time, in the return type, where you can see it.

### And `.catch()`

```ts
const user: User | null = await findUser(id).catch(() => null);
// null means it failed. Why did it fail? That's gone.
```

Now `user` is `User | null` and the error is gone. Or you chain `.then().catch().then()` and the control flow reads like a choose-your-own-adventure book.

## What it looks like instead

```ts
const [userErr, user] = await efwAsync(findUser(id));
if (userErr) return notFound();
// user: User

const [orgErr, org] = await efwAsync(findOrg(user.orgId));
if (orgErr) return serverError(orgErr);
// org: Org

const [invoiceErr, invoice] = await efwAsync(() => stripe.invoices.create({ customer: org.stripeId }));
if (invoiceErr) return paymentFailed(invoiceErr);
// invoice: Stripe.Invoice

const [emailErr] = await efwAsync(sendEmail(user.email, invoice));
if (emailErr) log.warn('invoice email bounced', emailErr); // emailErr: Error. Not fatal, keep going
```

Everything's a `const`. Every failure gets its own handling. You read the happy path straight down the left edge. It's Go, basically, and Go got this one right.

## Ban try/catch with ESLint

```js
// eslint.config.js
import noTryCatch from 'efwasync/eslint';

export default [
  // ...your config
  noTryCatch,
];
```

That bans `try` blocks and `.catch()` across your codebase. The one `try/catch` that gets to exist is the one inside `efw.ts`, and it has an `eslint-disable` on it. It's built on `no-restricted-syntax`, so if you already use that rule, import `{ restrictions }` from `efwasync/eslint` and spread it into your own list.

## Claude skill

Your agent writes `try/catch` too. This stops it:

```sh
mkdir -p .claude/skills && cp -r node_modules/efwasync/skill .claude/skills/efw
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
