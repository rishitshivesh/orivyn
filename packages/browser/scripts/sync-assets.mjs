import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/** Copies the installed Cactus worker and WASM to the consumer's same-origin public directory. */
export function syncCactusAssets(destination) {
  if (!destination) throw new Error("Provide an asset destination");
  const target = resolve(destination);
  mkdirSync(target, { recursive: true });
  for (const [name, targetName] of [
    ["cactus-needle/browser/worker.js", "worker.js"],
    ["cactus-needle/browser/needle.wasm", "needle.wasm"],
  ]) {
    const source = require.resolve(name);
    if (statSync(source).size === 0) throw new Error(`Empty Cactus asset: ${name}`);
    copyFileSync(source, join(target, targetName));
    process.stdout.write(`Orivyn asset: ${join(target, targetName)}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncCactusAssets(process.argv[2]);
}
