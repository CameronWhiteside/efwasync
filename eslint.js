// Flat-config block that bans try/catch. Use efw / efwAsync instead.
//   import efw from 'efw-async/eslint';
//   export default [...yourConfig, efw];
// ponytail: built on no-restricted-syntax, so it replaces (not merges with) any
// no-restricted-syntax list you already have. Spread your selectors in if so.
const message = 'try/catch is not how we handle errors here. Use efw() or efwAsync() and check the error first.';

export const restrictions = [
  { selector: 'TryStatement', message },
  { selector: "CallExpression[callee.property.name='catch']", message: '.catch() is try/catch with extra steps. Use efwAsync().' },
];

export default {
  name: 'efw-async/no-try-catch',
  rules: { 'no-restricted-syntax': ['error', ...restrictions] },
};
