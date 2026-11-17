# Publishing Orivyn packages to npm

Orivyn includes six reusable libraries. Publishing compiles **ESM JavaScript and TypeScript declarations** rather than distributing the source-only `src/index.ts` workspace exports.

Packages are built and published in this order:

1. `core`
2. `actions`
3. `runtime`
4. `client`
5. `browser`
6. `react`

The publisher translates internal `@orivyn/*` dependencies into packages under your chosen organization scope and pins their version. It does **not** rename or modify source packages in the monorepo.

## One-time setup

- Node.js 22.18+ and pnpm 10.20.0 (see root package.json).
- You must own or have permission to publish in your chosen npm organization.
- Enable npm two-factor authentication and log in interactively using `npm login`. Do not commit npm tokens or .npmrc credentials.
- Run `pnpm install --no-frozen-lockfile` after pulling this change because it introduces `tsup` as a release-only dev dependency. Commit the resulting `pnpm-lock.yaml` so releases are reproducible.
- Commit the final formatted source before publishing. Actual publish refuses a dirty Git checkout.

The examples use `@my-org` as a placeholder. Replace it with **your exact npm organization scope**. If your npm organization is `orivyn`, use `@orivyn`.

## Build and review, without publishing (default)

```bash
pnpm install --no-frozen-lockfile
pnpm release:npm --scope @my-org --version 0.7.0
```

This runs `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm build`, then builds the six publishable packages using tsup, generates `.d.ts` files, rewrites scoped imports and workspace dependency versions, and checks each npm tarball through `npm pack --dry-run --json`.

Stage output is written to **`.release/npm/<package>`** and is ignored by Git. Inspect `package.json`, `dist/index.js` and `dist/index.d.ts` before release.

If you are iterating only on the publishing script, you may use `--skip-checks` for a **dry run**. The script refuses `--publish --skip-checks`.

## Publish (explicit, irreversible)

```bash
npm whoami
pnpm release:npm --scope @my-org --version 0.7.0 --publish
```

The script checks npm authentication, Git cleanliness, verifies that **none of the six package versions are already published**, rebuilds and inspects all staged packages, then calls `npm publish --access public` sequentially. npm may ask for a 2FA code. Publishing may partially succeed if a later package fails: npm versions are immutable, so inspect the registry before retrying rather than assuming a rollback.

**Important:** `--access public` makes the package contents publicly downloadable. The staging manifest sets `license: "UNLICENSED"` because this repository has not selected a public redistribution license through this workflow. Do not assume that public npm visibility is the same as granting an open-source license.

For a subsequent release, choose a **new semver version**. Never reuse a published version. Preview `0.7.1` and publish `0.7.1`, for example.

## Install in Portfolio OS

```bash
pnpm add @my-org/core @my-org/actions @my-org/runtime @my-org/react @my-org/browser
```

For the Next.js App Router, `@my-org/react` is built with a `"use client"` module directive, and all entrypoints target modern ESM. You do not need `transpilePackages` for the published dist artifacts.

The browser model needs the same-origin worker and WASM files copied into the consumer's public folder. The published `browser` package provides:

```bash
pnpm exec orivyn-sync-cactus public/vendor/cactus
```

Call that before `next dev` and `next build`, for example:

```json
{
  "scripts": {
    "predev": "orivyn-sync-cactus public/vendor/cactus",
    "prebuild": "orivyn-sync-cactus public/vendor/cactus"
  }
}
```

Do not call `orivyn-sync-cactus` on a server request. It is a local/CI asset-copy operation. Do not put provider API keys in the browser. The Cactus model remains lazy-loaded and its assets must be reachable over same-origin HTTPS or localhost.

### Example usage

```tsx
"use client";

import { createOrivynApp } from "@my-org/react";
import { defineApplication } from "@my-org/runtime";

const manifest = defineApplication({
  id: "portfolio.navigation",
  name: "Portfolio Navigation",
  version: "0.7.0",
  runtime: "browser",
  tools: [
    {
      name: "portfolio.open",
      description: "Open a supported portfolio section",
      execution: "browser",
      risk: "read",
      parameters: {
        type: "object",
        properties: {
          section: { type: "string", enum: ["projects", "music"] },
        },
        required: ["section"],
        additionalProperties: false,
      },
    },
  ],
});

type State = { section: "projects" | "music" };
export const {
  Provider: OrivynProvider,
  useOrivyn,
  useOrivynTool,
} = createOrivynApp<State>(manifest);

// Mount using:
// <OrivynProvider manifest={manifest} initialState={{ section: "projects" }}
//   context={{ route: "/projects" }}>{children}</OrivynProvider>
```

## Scope, dependency, and supply-chain notes

- The published packages are **`@scope/core`**, **`@scope/actions`**, **`@scope/runtime`**, **`@scope/client`**, **`@scope/browser`**, and **`@scope/react`**, all at the release version you choose.
- `@scope/react` uses React as a **peer dependency**, avoiding a second React runtime.
- `@scope/browser` depends on `cactus-needle` for local inference and `ajv` for validation. The npm tarball does not bundle model weights.
- The publisher stages package metadata and rewrites internal imports only inside the staged builds. No `workspace:*` strings should be published.
- The script checks pack contents, but **you must execute a real smoke install in Portfolio OS before considering the packages production-ready**. This has not yet been run by ChatGPT.
- No GitHub Actions are created or needed. Publishing is manual, on your machine, with npm login and 2FA.
- The script's version check uses the official `https://registry.npmjs.org/` registry. Do not alter it to a private registry without changing the release procedure.

## Troubleshooting

If `pnpm exec tsup` is missing, run `pnpm install` after pulling and check that the root `tsup` dev dependency installed. If `tsup --dts` fails, inspect the first declaration-generation error rather than publishing without types.

If `npm whoami` fails, run `npm login`. If npm rejects publication, verify membership and 2FA permissions for the organization. For an existing package version, increment the semver version before publishing.

If the browser can't find `worker.js` or `needle.wasm`, rerun the asset CLI from the Portfolio OS root before building. Inspect the actual Network requests for `/vendor/cactus/worker.js` and `/vendor/cactus/needle.wasm`.
