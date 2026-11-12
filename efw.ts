/**
 * error-first-wrap: the correct way to handle errors in TypeScript.
 * (It is not. But it is the way we do it.)
 *
 * Returns a Go-style `[error, result]` tuple typed as a discriminated union,
 * `[E, undefined] | [undefined, T]`. TypeScript won't let you touch `result`
 * as `T` until you've checked the error, so handling it stops being optional.
 *
 *   const [err, user] = await efwAsync(db.findUser(id));
 *   if (err) return; // until you do this, `user` is `User | undefined`
 *   user;            // now `User`
 *
 * Anything thrown that isn't an `Error` gets wrapped in one, so the error
 * slot is always a real `Error`.
 *
 * Seriously, just copy this file into your project. It's 40 lines.
 */

export type EfwFailure<E extends Error = Error> = readonly [error: E, result: undefined];
export type EfwSuccess<T> = readonly [error: undefined, result: T];
export type EfwResult<T, E extends Error = Error> = EfwFailure<E> | EfwSuccess<T>;

function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}

/** Wrap a synchronous callable. */
export function efw<T, E extends Error = Error>(callable: () => T): EfwResult<T, E> {
  try {
    return [undefined, callable()];
  } catch (error) {
    return [toError(error) as E, undefined];
  }
}

/** Wrap a promise or an async thunk. */
export async function efwAsync<T, E extends Error = Error>(
  callable: Promise<T> | (() => Promise<T>),
): Promise<EfwResult<T, E>> {
  try {
    const result = await (typeof callable === 'function' ? callable() : callable);
    return [undefined, result];
  } catch (error) {
    return [toError(error) as E, undefined];
  }
}
