# Zeus

Zeus includes:

1. Python simulation cores for physics-informed AI and orchestration.
2. A Netlify-ready web application (`apps/zeus-world`) for running, remixing, and sharing simulations.

## Simulation Modules

1. **Zeus Code Paradigm**: Augmented Lagrangian-guided scoring.
2. **Open Multi-Agent Framework**: dependency-aware task orchestration with cyclic execution support.
3. **Physics-Informed KANs**: Ehrenfest-theorem-informed loss.
4. **Multi-GPU Euler Equations**: MPI/CUDA simulator with graceful fallback modes.

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
```

## Run the Web App

The web app is static and can be served directly:

```bash
# from repo root
python -m http.server 8080 --directory apps/zeus-world
```

Open: `http://localhost:8080`

## Netlify Deployment

`netlify.toml` is already configured to publish `apps/zeus-world`.

```bash
netlify deploy --dir apps/zeus-world
netlify deploy --prod --dir apps/zeus-world
```

## Author

cristianojosephjr-hash
