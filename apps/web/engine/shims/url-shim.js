// Minimal URL shim for wasmoon's Emscripten glue (Node.js path only, never executed in browser).
export const pathToFileURL = (p) => new URL(`file://${p}`);
export const fileURLToPath = (u) => u.pathname || u.toString().replace("file://", "");
export default { pathToFileURL, fileURLToPath };
