# Agent strategy: E.D.I.T.H. and other consumers

Orivyn is an **intelligence execution platform**. It must not assume a single small tool-calling model can provide high-quality conversation, grounded explanations, and action selection.

## Pipeline

1. **Intent recognition**: Prefer deterministic, cheap, typed handlers for exact UI operations. Needle can propose actions for fuzzier supported commands.
2. **Tool eligibility**: The host application supplies the tool allowlist for the authenticated user and active context.
3. **Proposal**: The model yields structured candidate calls; no model output directly mutates state.
4. **Schema and policy validation**: Recheck tool name, arguments, data scope and execution level.
5. **Execution**: Frontend handles safe UI state updates after user approval; sensitive actions go through application-owned backend.
6. **Response composition**: Simple actions use deterministic human-readable feedback. Complex questions require a separate retrieval and reasoning provider with citations and documented data boundaries.
7. **Observation**: Capture model latency and outcomes using privacy-preserving telemetry and regression fixtures.

## E.D.I.T.H.

- Needle is the fast UI-action router, not E.D.I.T.H.'s personality or reasoning brain.
- Voice recognition is Whistle (English and specified supported languages); voice synthesis needs a separate provider.
- Answering why a technical decision was made requires portfolio retrieval and a capable reasoning model, not tool-call JSON.
- The authoritative portfolio guide must be maintained by the Portfolio OS project; Orivyn does not silently ingest private CMS content.
- Agent tool manifests will be versioned and scoped to the active app. E.D.I.T.H. can orchestrate multiple permitted actions, but only through host-owned handlers.
- Do not invent a fallback or automatically send browser audio/prompts to a hosted provider.

## Evaluation suite to build

Use fixtures spanning navigation, project filters, negation, ambiguous commands, out-of-scope questions, unsafe requests, and hidden/disabled tools. Measure:
- exact eligible-tool accuracy;
- schema-validation reject rate;
- action outcome correctness;
- latency and download size;
- unsupported-intent abstention;
- regression differences across model versions.

Do not equate a fluent model response with a correct or authorized action.
