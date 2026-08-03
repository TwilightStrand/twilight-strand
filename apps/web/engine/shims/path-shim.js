// Minimal path shim for wasmoon's Emscripten glue.
export const normalize = (p) => p;
export const dirname = (p) => p.split("/").slice(0, -1).join("/") || ".";
export const join = (...parts) => parts.join("/");
export const resolve = (...parts) => parts.join("/");
export default { normalize, dirname, join, resolve };
