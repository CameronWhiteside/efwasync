// Compile-only check that the README's type claims hold. Run by CI: tsc --noEmit.
import { efw, efwAsync } from './index.js';

type User = { name: string };
type Config = { port: number };
declare function findUser(id: string): Promise<User>;
declare const raw: string;

export async function asyncNarrows(): Promise<string | undefined> {
  const [err, user] = await efwAsync(findUser('1'));
  // @ts-expect-error 'user' is possibly 'undefined' before the error check
  user.name;
  if (err) return undefined;
  const narrowed: User = user;
  return narrowed.name;
}

export function syncNarrows(): Config | undefined {
  const [err, config] = efw<Config>(() => JSON.parse(raw));
  if (err) return undefined;
  const narrowed: Config = config;
  return narrowed;
}

export async function errIsError(): Promise<string | undefined> {
  const [err] = await efwAsync(findUser('1'));
  return err?.message;
}

export async function catchNull(): Promise<User | null> {
  const user: User | null = await findUser('1').catch(() => null);
  return user;
}

export async function letUpTop(): Promise<string | undefined> {
  let user: User;
  // eslint-disable-next-line no-restricted-syntax
  try {
    user = await findUser('1');
  } catch {
    return undefined;
  }
  return user.name;
}
