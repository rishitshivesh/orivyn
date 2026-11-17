#!/usr/bin/env node
/**
 * Orivyn npm release builder.
 *
 * Dry run (default): pnpm release:npm --scope @your-org --version 0.7.0
 * Publish explicitly: pnpm release:npm --scope @your-org --version 0.7.0 --publish
 *
 * Packages are staged under .release/npm, never published from the source tree.
 * No registry credentials are accepted or printed by this script.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const names = ["core", "actions", "runtime", "client", "browser", "react"];
const baseScope = "@orivyn";
const versionPattern = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*)?$/;
const scopePattern = /^@[a-z0-9][a-z0-9-]*$/;

function fail(message) {
  throw new Error(message);
}
function info(message) {
  process.stdout.write(`[release:npm] ${message}\n`);
}
function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) fail(`${binary} ${args.join(" ")} failed (exit ${result.status})`);
}
function capture(binary, args, cwd = root) {
  const result = spawnSync(binary, args, { cwd, encoding: "utf8" });
  if (result.error) throw result.error;
  return result;
}
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { scope: baseScope, version: null, publish: false, skipChecks: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--scope") options.scope = args[++i];
    else if (args[i] === "--version") options.version = args[++i];
    else if (args[i] === "--publish") options.publish = true;
    else if (args[i] === "--skip-checks") options.skipChecks = true;
    else if (args[i] === "--help" || args[i] === "-h") {
      process.stdout.write("Usage: pnpm release:npm --scope @org --version X.Y.Z [--publish] [--skip-checks]\nDefault is a dry run. --publish performs actual npm publication.\n");
      process.exit(0);
    } else fail(`Unknown argument: ${args[i]}`);
  }
  if (!scopePattern.test(options.scope)) fail("Provide a valid lowercase npm scope, e.g. --scope @myorg");
  if (!versionPattern.test(options.version ?? "")) fail("Provide --version X.Y.Z (or prerelease X.Y.Z-beta.1)");
  if (options.publish && options.skipChecks) fail("Publishing cannot skip quality checks");
  return options;
}
const options = parseArgs();
const stagingRoot = join(root, ".release", "npm");
const packageJsons = new Map(names.map((name) => {
  const json = JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8"));
  if (json.name !== `${baseScope}/${name}`) fail(`Unexpected source package name: ${json.name}`);
  return [name, json];
}));

function replaceScope(text) {
  return text.replaceAll(`${baseScope}/`, `${options.scope}/`);
}
function checkDirty() {
  const result = capture("git", ["status", "--porcelain"]);
  if (result.status !== 0) fail("Unable to check Git status");
  if (result.stdout.trim()) fail("Commit your source and formatter changes before publishing");
}
function checkRegistryVersion(name) {
  const result = capture("npm", ["view", `${options.scope}/${name}@${options.version}`, "version", "--registry", "https://registry.npmjs.org/"]);
  if (result.status === 0) fail(`Already published: ${options.scope}/${name}@${options.version}`);
  if (!/E404|404 Not Found|is not in this registry/i.test(result.stderr)) {
    fail(`Could not verify npm availability for ${name}: ${result.stderr.trim().slice(0, 350)}`);
  }
}
function verifyTarball(stageDir, name) {
  const result = capture("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], stageDir);
  if (result.status !== 0) fail(`npm pack failed for ${name}: ${result.stderr.trim()}`);
  let pack;
  try { pack = JSON.parse(result.stdout)[0]; } catch { fail(`Invalid npm pack JSON for ${name}`); }
  const files = new Set(pack.files.map((item) => item.path));
  for (const required of ["package.json", "README.md", "dist/index.mjs", "dist/index.d.mts"]) {
    if (!files.has(required)) fail(`Missing file in ${name} tarball: ${required}`);
  }
  if ([...files].some((item) => item.startsWith("src/") || /(^|\/)\.env|\.tsbuildinfo|\.map$/.test(item))) {
    fail(`Unexpected source, secret, or map file in ${name} tarball`);
  }
  const manifest = JSON.parse(readFileSync(join(stageDir, "package.json"), "utf8"));
  if (manifest.name !== `${options.scope}/${name}` || manifest.version !== options.version) {
    fail(`Incorrect package identity in ${name} tarball`);
  }
  const js = readFileSync(join(stageDir, "dist", "index.mjs"), "utf8");
  const dts = readFileSync(join(stageDir, "dist", "index.d.mts"), "utf8");
  if (options.scope !== baseScope && (js.includes(`${baseScope}/`) || dts.includes(`${baseScope}/`))) {
    fail(`Unrewritten Orivyn import in ${name}`);
  }
  info(`Validated ${manifest.name}@${options.version}: ${pack.files.length} files, ${pack.size} bytes`);
}
function buildPackage(name) {
  const source = packageJsons.get(name);
  const stageDir = join(stagingRoot, name);
  const outDir = join(stageDir, "dist");
  mkdirSync(outDir, { recursive: true });
  const dependencyNames = Object.keys(source.dependencies ?? {});
  const external = [...new Set([...dependencyNames, "react", "react-dom", "cactus-needle/browser"])];
  const args = ["exec", "tsup", join(root, "packages", name, "src", "index.ts"),
    "--format", "esm", "--target", "es2022", "--platform", "neutral",
    "--dts", "--no-splitting", "--out-dir", outDir, "--tsconfig", join(root, "packages", name, "tsconfig.json")];
  for (const dependency of external) args.push("--external", dependency);
  info(`Building ${name}`);
  run("pnpm", args);
  const manifest = {
    name: `${options.scope}/${name}`,
    version: options.version,
    type: "module",
    description: `Orivyn ${name} SDK package`,
    license: "UNLICENSED",
    main: "./dist/index.mjs",
    module: "./dist/index.mjs",
    types: "./dist/index.d.mts",
    exports: { ".": { types: "./dist/index.d.mts", import: "./dist/index.mjs", default: "./dist/index.mjs" } },
    files: ["dist", "README.md", ...(name === "browser" ? ["scripts/sync-assets.mjs"] : [])],
    publishConfig: { access: "public", registry: "https://registry.npmjs.org/" },
    repository: { type: "git", url: "git+https://github.com/rishitshivesh/orivyn.git", directory: `packages/${name}` },
    engines: { node: ">=20" },
  };
  const dependencies = {};
  for (const [key, value] of Object.entries(source.dependencies ?? {})) {
    dependencies[replaceScope(key)] = value.startsWith("workspace:") ? options.version : value;
  }
  if (Object.keys(dependencies).length) manifest.dependencies = dependencies;
  if (source.peerDependencies) manifest.peerDependencies = source.peerDependencies;
  if (name === "browser") {
    const scriptDir = join(stageDir, "scripts");
    mkdirSync(scriptDir, { recursive: true });
    const content = readFileSync(join(root, "packages/browser/scripts/sync-assets.mjs"), "utf8");
    writeFileSync(join(scriptDir, "sync-assets.mjs"), `#!/usr/bin/env node\n${content}`);
    manifest.bin = { "orivyn-sync-cactus": "./scripts/sync-assets.mjs" };
  }
  writeFileSync(join(stageDir, "README.md"),
    `# ${manifest.name}\n\nOrivyn's ${name} package. See [the Orivyn repository](https://github.com/rishitshivesh/orivyn) for API usage and security guidance.\n\nPublished as JavaScript (ESM) with TypeScript declarations.\n`);
  writeFileSync(join(stageDir, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
  // tsup's bundled .d.ts can include imports from the original workspace scope.
  // Re-scope *only the staged artifacts*, never the source monorepo.
  for (const file of ["index.mjs", "index.d.mts"]) {
    const location = join(outDir, file);
    if (!existsSync(location)) fail(`tsup did not produce ${location}`);
    let content = replaceScope(readFileSync(location, "utf8"));
    // Next.js App Router must identify the published React module as a client entry.
    if (name === "react" && file === "index.mjs" && !/^["']use client["'];/.test(content.trimStart())) {
      content = '"use client";\n' + content;
    }
    writeFileSync(location, content);
  }
  run("node", ["--check", join(outDir, "index.mjs")]);
  verifyTarball(stageDir, name);
}

try {
  info(`Preparing ${names.length} packages for ${options.scope} at ${options.version}`);
  if (!options.skipChecks) {
    for (const task of ["check", "typecheck", "test", "build"]) {
      info(`Quality gate: pnpm ${task}`);
      run("pnpm", [task]);
    }
  } else info("Skipping quality checks for DRY RUN only");
  if (options.publish) {
    checkDirty();
    run("npm", ["whoami", "--registry", "https://registry.npmjs.org/"]);
    // Preflight all versions before any package becomes publicly visible.
    for (const name of names) checkRegistryVersion(name);
  }
  rmSync(stagingRoot, { recursive: true, force: true });
  for (const name of names) buildPackage(name);
  info(options.publish ? "Publishing in dependency order" : "DRY RUN completed. No packages were published.");
  if (options.publish) {
    for (const name of names) {
      info(`Publishing ${options.scope}/${name}@${options.version}`);
      run("npm", ["publish", join(stagingRoot, name), "--access", "public", "--registry", "https://registry.npmjs.org/"]);
    }
    info("All packages published. Versions on npm are immutable.");
  } else info(`Review staging artifacts at ${stagingRoot}`);
} catch (error) {
  process.stderr.write(`[release:npm] ERROR: ${error.message}\n`);
  process.exitCode = 1;
}
