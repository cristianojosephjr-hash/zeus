# Zeus Negotiation Agent (Cloudflare Optional Accelerator)

This package is a phase-2 runtime scaffold for stateful negotiation workloads using the Cloudflare Agents SDK.

## Purpose

- Persist branch scores and negotiation traces per run instance.
- Provide a real-time stateful backend option beyond Netlify-only mode.

## Commands

```bash
npm install
npx wrangler deploy --dry-run --outdir .wrangler-dry
npx wrangler dev
```

## Route

- Agent endpoint pattern: `/agents/NegotiationAgent/{instance-id}`
