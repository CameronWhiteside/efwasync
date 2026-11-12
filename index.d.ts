export type EfwFailure<E extends Error = Error> = readonly [error: E, result: undefined];
export type EfwSuccess<T> = readonly [error: undefined, result: T];
export type EfwResult<T, E extends Error = Error> = EfwFailure<E> | EfwSuccess<T>;

export declare function efw<T, E extends Error = Error>(callable: () => T): EfwResult<T, E>;
export declare function efwAsync<T, E extends Error = Error>(
  callable: Promise<T> | (() => Promise<T>),
): Promise<EfwResult<T, E>>;
