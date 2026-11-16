import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const destination = join(appRoot, "public", "vendor", "cactus");

mkdirSync(destination, { recursive: true });

const assets = [
  ["cactus-needle/browser/worker.js", "worker.js"],
  ["cactus-needle/browser/needle.wasm", "needle.wasm"],
];

for (const [moduleName, fileName] of assets) {
  const source = require.resolve(moduleName);
  if (statSync(source).size === 0) {
    throw new Error(`Invalid empty Cactus asset: ${moduleName}`);
  }
  copyFileSync(source, join(destination, fileName));
  process.stdout.write(`Cactus asset ready: /vendor/cactus/${fileName}\n`);
}
