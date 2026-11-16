# Orivyn Local Tools and Model Evaluation

## Why this exists

Orivyn is a frontend-first intelligence platform, not a chatbot. This milestone prioritizes dependable tools, observable execution, and local model evaluation before adding any more external providers.

## The reusable action engine

`@orivyn/actions` exports `createActionExecutor<State>()`. An application registers pairs of:

- `definition`: the same typed tool schema that Needle receives;
- `execute(state, args)`: a deterministic **host-owned** synchronous state transition, with no model-generated code.

The engine compiles each schema with AJV once and checks each proposed call again immediately before execution:

1. Tool is registered and unique.
2. Tool is enabled for the current context.
3. Tool belongs to the browser and has read-only risk.
4. Arguments match JSON Schema, including `additionalProperties` restrictions.
5. An allowed handler returns the next immutable application state.

Results include `state`, `applied`, `rejected`, and a `trace` with action name, rejection reason, and handler processing time. Traces are local UI data, not a remotely persisted audit log.

### API example

```ts
import { createActionExecutor } from "@orivyn/actions";

const executor = createActionExecutor<{ page: string }>([
  {
    definition: {
      name: "navigate",
      description: "Switch between known application pages",
      parameters: {
        type: "object",
        properties: { page: { type: "string", enum: ["projects", "music"] } },
        required: ["page"],
        additionalProperties: false,
      },
      execution: "browser",
      risk: "read",
    },
    execute: (state, args) => ({ ...state, page: args.page as string }),
  },
]);

const report = executor.execute(
  { page: "projects" },
  [{ name: "navigate", arguments: { page: "music" }, confidence: null }],
  ["navigate"],
);
console.log(report.state.page); // "music"
```

**Security:** A frontend executor cannot authorize payments, authentication changes, privileged reads or writes. Such actions stay with the owning application backend. The executor also cannot securely enforce authorization for values supplied by an untrusted browser. Use it only for UI-level operations.

## Model benchmark screen

URL: `http://localhost:3000/benchmarks`.

The page contains ten golden cases with explicit expected tool name and JSON arguments, including multi-tool requests, unsupported destinations, explanation-vs-action intent, negation, and disabled-action abstention.

- Select **Needle WASM** to run the actual installed local model, sequentially, in your browser. First use can require model download. This sends no prompt to Orivyn's API.
- Select **Rules baseline** to measure the deterministic matcher. This is not AI inference.
- Press **Run benchmark**. Accuracy is the percentage of _executed_ cases matching the expected names and arguments exactly. Average latency includes model download on cold start.
- Failed cases show the full expected and actual proposal JSON, plus runtime errors.
- **Export JSON** creates a local report including input, expected, actual, pass/fail, latency and run timestamp.
- **Stop after test** prevents the _next_ case from starting. It does not interrupt a currently running WASM inference call.

No dataset or model performance numbers are hardcoded into the dashboard. Score zeros before running mean _not evaluated_, not a model accuracy result.

## What is currently supported

- Demo navigation to Projects/Music/Career.
- Project filtering by technology/category.
- Resetting demo app state.
- Exact schema validation and bounded read-only action execution.
- Running and exporting a small tool-routing evaluation suite.
- Needle/Whistle stay in the local browser runtime; voice remains opt-in.

## What still needs work

- More realistic multi-step and ambiguous language benchmarks, including negation and adversarial input.
- Persisted evaluation comparisons across model versions (currently exported reports).
- Browser model cancellation while an individual inference call is running.
- A versioned application manifest and generic context provider, beyond the demo.
- Actual device verification: Chromium, Safari, mobile, cold/warm model download, error paths.
- Automated CI is explicitly not desired; run repository checks locally.

## Local setup

```bash
corepack enable
pnpm install
pnpm dev:web
```

No FastAPI, API token, hosted model, Docker, or provider credentials are needed for these flows.

Run checks from the repository root:

```bash
pnpm format
pnpm check
pnpm typecheck
pnpm test
```

**Release caveat:** This change was authored via GitHub's repository connector. Full dependency-backed typecheck, Biome, Node tests, Next.js build, and live browser inference have not yet been verified in a local checkout. Treat the code as review-ready, not production-certified.

## Needle call diagnostics

The browser adapter returns optional `diagnostics` on its proposal response: `raw_calls` and a list of rejected name/reason pairs. These describe _model output validation_ (unknown tool, invalid arguments, disallowed execution, invalid schema). They do not expose or execute arbitrary model scripts, and only appear in the local result. The benchmark report includes diagnostics when available.
