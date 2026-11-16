# Diagnostic analysis: 17 November 2026

Source: `orivyn-diagnostics-20261117-051330.log`, git HEAD `4084964b3fa2b7a78306b86a231ed36139a17ced`.

| Check | Observed | Action |
| --- | --- | --- |
| Biome format/check | 22 format errors; 879 lint errors, 672 warnings, largely generated Turbo cache and CLI schema mismatch | Update schema from 2.2.7 to 2.6.8; exclude generated caches and diagnostics |
| TypeScript | Six TS5097 consumer source import errors | Enable TS source extension imports for the independent consumer |
| JavaScript tests | All tests passed | No test logic changed |
| Next.js build | Both compile; consumer fails TypeScript; Playground aborted as collateral | Fix consumer TS config and rerun builds |
| Python Ruff lint | Eight diagnostic violations | Fix import order, dependency annotations, contract-safe exceptions and context-manager shape |
| Python Ruff format | 15 files require formatting | Run Ruff formatter and format check locally; formatting is not complete by source edits alone |
| Python pytest | 23 passed | No test logic changed |

## Run after updating

```bash
git pull origin main
pnpm exec biome check . --max-diagnostics=100
pnpm typecheck
pnpm test
pnpm build
uv run --project apps/api ruff check apps/api
uv run --project apps/api ruff format apps/api
uv run --project apps/api ruff format --check apps/api
uv run --project apps/api pytest apps/api/tests
```

**Note:** Ruff formatter writes files. Review and commit its output. Do not ignore or suppress all lint rules merely to obtain a green result. No dependency-backed checks could be executed by the GitHub-only change authoring environment.
