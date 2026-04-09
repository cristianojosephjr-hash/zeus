# Zeus

Zeus includes:

1. Python simulation cores for physics-informed AI and orchestration.
2. A Netlify-ready strategic decision lab (`apps/zeus-world`) for policy negotiation simulations.

## Simulation Modules

1. **Zeus Code Paradigm**: Augmented Lagrangian-guided scoring.
2. **Open Multi-Agent Framework**: dependency-aware task orchestration with cyclic execution support.
3. **Physics-Informed KANs**: Ehrenfest-theorem-informed loss.
4. **Multi-GPU Euler Equations**: MPI/CUDA simulator with graceful fallback modes.
5. **Strategic Policy Engine**: multi-party negotiation with mechanism-design style policy levers and decision-ready gating.

## Local Setup (Python)

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -e ".[dev,cpu]"
```

Optional GPU extras:

```bash
pip install -e ".[gpu]"
```

## Run Checks

```bash
pytest -q
```

## Run Simulation Entrypoints

```bash
python AI_Simulations/zeus_code/src/coordinator/lagrangian_tasker.py
python AI_Simulations/open_multi_agent/src/coordinator.py
python AI_Simulations/kan_ehrenfest/src/ehrenfest_loss.py
python AI_Simulations/shallow_water_gpu/src/mpi_simulator.py
python - <<'PY'
from AI_Simulations.strategic_policy.src.engine import build_policy_pack
print(build_policy_pack(domain="water")["recommended_branch_id"])
PY
```

## Run the Web App

The web app is static and can be served directly:

```bash
# from repo root
python -m http.server 8080 --directory apps/zeus-world
```

Open: `http://localhost:8080`

## Strategic Decision Lab Features

Phase-1 realistic scenario set:

1. Water Allocation
2. Urban Mobility
3. Public Health Surge

Implemented policy workflow:

1. Configure region, budget, incentive, penalty, and objective function.
2. Run multi-party negotiation with cyclic stakeholder turns.
3. Compare decision tree branches and payoff matrix outcomes.
4. Review uncertainty, backtest, sensitivity, and budget-feasibility gates.
5. Export Action Memo PDF and machine-readable decision JSON.

Data mode precedence:

`curated -> live -> synthetic`

Curated references are embedded in the app (`apps/zeus-world/data/curated-2026.js`) and aligned with 2025-2026 sources.

## Optional Cloudflare Accelerator (Phase 2)

An Agents SDK scaffold is included at `cloudflare/negotiation-agent` for stateful negotiation backends.

```bash
cd cloudflare/negotiation-agent
npm install
npx wrangler deploy --dry-run --outdir .wrangler-dry
```

## Netlify Deployment

`netlify.toml` is already configured to publish `apps/zeus-world`.

```bash
netlify deploy --dir apps/zeus-world
netlify deploy --prod --dir apps/zeus-world
```

## Author

cristianojosephjr-hash
