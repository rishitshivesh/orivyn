# Independent Orivyn Consumer

This Next.js application is intentionally separate from the Console. It imports `@orivyn/core`, `@orivyn/runtime`, `@orivyn/react`, and `@orivyn/browser` via workspace package names, never the Console's source files.

## Run

```bash
pnpm install --no-frozen-lockfile
pnpm dev:example
```

Open http://localhost:3001. Use the sample action buttons to create proposals, review and apply them, or type a command and explicitly invoke Needle locally. Context-aware tools are enabled only when the active route is `/catalog`. The UI uses its own local shadcn-style primitives, no backend or database.

Use `deploy/compose.example.yml` in Dokploy to deploy this consumer separately on port 3001. Read `docs/APPLICATION_RUNTIME.md` for the public API and security model.
