# Zeus - AI Simulations

A collection of Python-based AI simulation frameworks covering physics-informed machine learning, multi-agent orchestration, quantum-informed neural networks, and GPU-accelerated fluid dynamics.

## Simulations

1. **Zeus Code Paradigm** - Augmented Lagrangian-Guided Diffusion (ALGD) with Physics-Informed ML
2. **Open Multi-Agent Framework** - Multi-agent orchestration with task decomposition and message passing
3. **Physics-Informed KANs** - Kolmogorov-Arnold Networks trained with Ehrenfest theorem constraints
4. **Multi-GPU Euler Equations** - HPC fluid dynamics with PyCUDA and MPI

## Setup

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install pydantic python-dotenv torch numpy scipy numba
```

## Run

```bash
python AI_Simulations/zeus_code/src/coordinator/lagrangian_tasker.py
python AI_Simulations/open_multi_agent/src/coordinator.py
python AI_Simulations/kan_ehrenfest/src/ehrenfest_loss.py
python AI_Simulations/shallow_water_gpu/src/mpi_simulator.py
```

## Author
cristianojosephjr-hash
