// Empty shim for Node.js builtins that wasmoon's Emscripten glue references
// but never calls in browser context.
export default {};
export const createRequire = () => () => {};
export const readFileSync = () => "";
export const readFile = () => {};
export const existsSync = () => false;
