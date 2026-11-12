// ponytail: hand-written JS twin of efw.ts so the package needs no build step.
function toError(thrown) {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}

export function efw(callable) {
  try {
    return [undefined, callable()];
  } catch (error) {
    return [toError(error), undefined];
  }
}

export async function efwAsync(callable) {
  try {
    const result = await (typeof callable === 'function' ? callable() : callable);
    return [undefined, result];
  } catch (error) {
    return [toError(error), undefined];
  }
}
