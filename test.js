import { test } from 'node:test';
import assert from 'node:assert/strict';
import { efw, efwAsync } from './index.js';

test('efw success', () => assert.deepEqual(efw(() => 42), [undefined, 42]));
test('efw throw', () => {
  const [err, val] = efw(() => { throw new Error('nope'); });
  assert.equal(err.message, 'nope');
  assert.equal(val, undefined);
});
test('efw non-Error throw', () => {
  const [err] = efw(() => { throw 'raw string'; });
  assert.ok(err instanceof Error);
  assert.equal(err.message, 'raw string');
});
test('efwAsync promise', async () => assert.deepEqual(await efwAsync(Promise.resolve('ok')), [undefined, 'ok']));
test('efwAsync thunk', async () => assert.deepEqual(await efwAsync(() => Promise.resolve(7)), [undefined, 7]));
test('efwAsync rejection', async () => {
  const [err] = await efwAsync(Promise.reject(new Error('boom')));
  assert.equal(err.message, 'boom');
});
test('efwAsync non-Error rejection', async () => {
  const [err] = await efwAsync(() => Promise.reject('bad'));
  assert.ok(err instanceof Error);
  assert.equal(err.message, 'bad');
});

import { Linter } from 'eslint';
import noTryCatch from './eslint.js';

test('eslint config bans try/catch and .catch()', () => {
  const lint = (code) => new Linter().verify(code, [noTryCatch], 'x.js').map((m) => m.ruleId);
  assert.deepEqual(lint('try { a() } catch (e) {}'), ['no-restricted-syntax']);
  assert.deepEqual(lint('p.catch(() => {})'), ['no-restricted-syntax']);
  assert.deepEqual(lint('const [err, v] = efw(() => a());'), []);
});
