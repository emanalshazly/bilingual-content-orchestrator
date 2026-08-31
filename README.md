# Bilingual Content Orchestrator

An inspectable Gemini-powered prototype that turns one product brief into a structured English/Arabic campaign draft: blog, social, email, and video, followed by brand-review and quality-evaluation stages.

[![CI](https://github.com/emanalshazly/bilingual-content-orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/emanalshazly/bilingual-content-orchestrator/actions/workflows/ci.yml)

## Input contract

The current UI accepts five text inputs:

| Input | Required | Purpose |
|---|---|---|
| Product brief | Yes | Source facts, offer, audience, and call to action |
| Brand guidelines | Yes | Voice, forbidden wording, and Arabic register constraints |
| Previous English example | No | Style reference, not a factual source |
| Previous Arabic example | No | Style reference, not proof of cultural correctness |
| SEO keywords | No | Comma-separated suggestions for the English blog |

The product brief and brand guidelines must be non-empty. The orchestrator rejects an execution before calling the model when either is missing.

## Output contract

The pipeline produces JSON for core messaging, four English assets, four Arabic assets, a brand review, and a quality evaluation. `src/lib/schemas.ts` is the canonical structural contract; CI verifies that every declared required field exists in its schema.

Execution order:

```text
validated inputs -> core messaging
                 -> English fan-out
                 -> Arabic adaptation fan-out
                 -> brand review
                 -> quality evaluation
```

## Sample campaign path

The built-in Acme/Compass example demonstrates the workflow without representing a real customer result. Run the app, keep the sample inputs, and select **Run Pipeline**. Outputs are model-generated drafts and require factual, editorial, and native-language review before publication.

## Cultural adaptation boundary

The prompts request MSA-first adaptation, RTL notes, register decisions, and a log of departures from the English draft. Those instructions do not prove cultural quality. The automated evaluator is another model output, not an independent Arabic reviewer or publication approval.

## Failure states

- Missing product brief or brand guidelines: deterministic input error, no model call.
- Missing or invalid API key: provider error; affected stage is marked `error`.
- Invalid model JSON: parse/provider error; no silent fallback.
- One fan-out request fails: the pipeline stops and must be rerun.
- Unsupported, inaccurate, or culturally weak copy: human review required; automated scores are advisory.

## Run locally

Requirements: Node.js 20 and a Gemini API key.

```bash
npm ci
Copy-Item .env.example .env.local   # PowerShell
npm test
npm run lint
npm run build
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local`, then open `http://localhost:3000`.

## Security and deployment boundary

This prototype calls Gemini from the browser and therefore is suitable only for local evaluation with a restricted development key. Do not deploy it with a privileged API key. A public deployment requires a server-side credential boundary, authentication, rate limits, logging controls, and a new security review.

## Validation boundary

CI covers TypeScript compilation, structural schema/contract tests, and the Vite build. It does not call Gemini or establish output quality, cultural appropriateness, marketing performance, or deployment readiness.

## License

MIT — see [LICENSE](LICENSE).
