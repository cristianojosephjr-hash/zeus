class CyclicIterator {
  constructor(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("CyclicIterator requires a non-empty list.");
    }
    this.items = items;
    this.index = 0;
  }

  next() {
    const value = this.items[this.index];
    this.index = (this.index + 1) % this.items.length;
    return value;
  }

  take(count) {
    const output = [];
    for (let i = 0; i < count; i += 1) {
      output.push(this.next());
    }
    return output;
  }
}

const SIMULATION_CONFIG = {
  zeus_code: {
    label: "Zeus Code Paradigm",
    params: [
      { key: "omega", label: "Omega", min: 0.1, max: 5.0, step: 0.1, value: 1.2 },
      { key: "reward", label: "Reward", min: 0.2, max: 5.0, step: 0.1, value: 2.4 },
      { key: "constraints", label: "Constraints", min: 0.0, max: 2.5, step: 0.1, value: 0.6 },
      { key: "penalty", label: "Penalty", min: 0.2, max: 3.0, step: 0.1, value: 1.1 },
    ],
  },
  open_multi_agent: {
    label: "Open Multi-Agent Framework",
    params: [
      { key: "agents", label: "Agents", min: 2, max: 12, step: 1, value: 5 },
      { key: "tasks", label: "Tasks", min: 4, max: 24, step: 1, value: 10 },
      { key: "rounds", label: "Rounds", min: 1, max: 12, step: 1, value: 4 },
    ],
  },
  kan_ehrenfest: {
    label: "Physics-Informed KANs",
    params: [
      { key: "lambdaPenalty", label: "Lambda", min: 0.2, max: 6, step: 0.1, value: 1.5 },
      { key: "dt", label: "dt", min: 0.005, max: 0.2, step: 0.005, value: 0.04 },
      { key: "amplitude", label: "Amplitude", min: 0.1, max: 4, step: 0.1, value: 1.6 },
    ],
  },
  shallow_water_gpu: {
    label: "Multi-GPU Euler Equations",
    params: [
      { key: "ranks", label: "Ranks", min: 1, max: 16, step: 1, value: 4 },
      { key: "cfl", label: "CFL", min: 0.1, max: 0.9, step: 0.05, value: 0.45 },
      { key: "steps", label: "Steps", min: 10, max: 200, step: 5, value: 60 },
    ],
  },
};

const heroCopy = new CyclicIterator([
  "Run simulation loops with deterministic cyclic iterators.",
  "Remix parameter sets and publish shareable scenario URLs.",
  "Preview scalable orchestration from AI physics foundations.",
]);

const simulationSelect = document.getElementById("simulation");
const parameterGrid = document.getElementById("parameter-grid");
const runButton = document.getElementById("run-button");
const remixButton = document.getElementById("remix-button");
const shareButton = document.getElementById("share-button");
const resultMetrics = document.getElementById("result-metrics");
const heroLoop = document.getElementById("hero-loop");
const cyclePreview = document.getElementById("cycle-preview");
const chart = document.getElementById("chart");
const chartContext = chart.getContext("2d");

const PARAMETER_STATE = {};
let latestResult = null;

function initHeroLoop() {
  heroLoop.textContent = heroCopy.next();
  window.setInterval(() => {
    heroLoop.textContent = heroCopy.next();
  }, 2500);
}

function toNumber(value) {
  return Number.parseFloat(value);
}

function createParamCard(param, value) {
  const card = document.createElement("div");
  card.className = "parameter-card";
  const id = `param-${param.key}`;
  card.innerHTML = `
    <label for="${id}">${param.label}</label>
    <input
      id="${id}"
      type="range"
      min="${param.min}"
      max="${param.max}"
      step="${param.step}"
      value="${value}"
    />
    <input
      id="${id}-number"
      type="number"
      min="${param.min}"
      max="${param.max}"
      step="${param.step}"
      value="${value}"
    />
  `;
  const slider = card.querySelector(`#${id}`);
  const number = card.querySelector(`#${id}-number`);
  slider.addEventListener("input", () => {
    number.value = slider.value;
    PARAMETER_STATE[param.key] = toNumber(slider.value);
  });
  number.addEventListener("input", () => {
    slider.value = number.value;
    PARAMETER_STATE[param.key] = toNumber(number.value);
  });
  return card;
}

function loadParameters(simulationType) {
  parameterGrid.innerHTML = "";
  const config = SIMULATION_CONFIG[simulationType];
  config.params.forEach((param) => {
    PARAMETER_STATE[param.key] = param.value;
    parameterGrid.appendChild(createParamCard(param, param.value));
  });
}

function finiteDifference(values, dt) {
  const derivatives = [];
  for (let i = 0; i < values.length; i += 1) {
    if (i === 0) {
      derivatives.push((values[i + 1] - values[i]) / dt);
    } else if (i === values.length - 1) {
      derivatives.push((values[i] - values[i - 1]) / dt);
    } else {
      derivatives.push((values[i + 1] - values[i - 1]) / (2 * dt));
    }
  }
  return derivatives;
}

function runZeusCode(params) {
  const frames = [];
  for (let step = 0; step < 40; step += 1) {
    const reward = params.reward + Math.sin(step / 5) * 0.4;
    const constraints = params.constraints + Math.cos(step / 7) * 0.15;
    const augmented = reward - params.penalty * constraints;
    const totalLoss = Math.max(0.001, params.omega * Math.abs(constraints) + (1 / (1 + augmented)));
    frames.push(totalLoss);
  }
  const stability = 1 / (1 + frames.reduce((sum, v) => sum + v, 0) / frames.length);
  return {
    title: SIMULATION_CONFIG.zeus_code.label,
    metrics: {
      "Final Loss": frames[frames.length - 1].toFixed(4),
      "Mean Loss": (frames.reduce((sum, v) => sum + v, 0) / frames.length).toFixed(4),
      "Stability Score": stability.toFixed(4),
    },
    frames,
  };
}

function runOpenMultiAgent(params) {
  const agentIds = Array.from({ length: params.agents }, (_, index) => `A${index + 1}`);
  const taskIds = Array.from({ length: params.tasks }, (_, index) => `T${index + 1}`);
  const scheduler = new CyclicIterator(agentIds);
  const assignments = [];
  for (let i = 0; i < params.tasks * params.rounds; i += 1) {
    assignments.push(`${scheduler.next()}->${taskIds[i % taskIds.length]}`);
  }
  const utilization = new Map();
  assignments.forEach((pair) => {
    const [agent] = pair.split("->");
    utilization.set(agent, (utilization.get(agent) ?? 0) + 1);
  });
  const spread = Math.max(...utilization.values()) - Math.min(...utilization.values());
  return {
    title: SIMULATION_CONFIG.open_multi_agent.label,
    metrics: {
      "Assignments": assignments.length,
      "Agent Spread": spread,
      "Cycle Fairness": (1 / (1 + spread)).toFixed(4),
    },
    frames: Array.from(utilization.values()),
    assignmentPreview: assignments.slice(0, 12),
  };
}

function runKanEhrenfest(params) {
  const points = 50;
  const yPred = [];
  const yTarget = [];
  const commutator = [];

  for (let i = 0; i < points; i += 1) {
    const t = i * params.dt;
    yPred.push(params.amplitude * Math.sin(t));
    yTarget.push(params.amplitude * Math.sin(t + 0.07));
    commutator.push(params.amplitude * Math.cos(t));
  }

  const mse = yPred.reduce((sum, v, index) => sum + (v - yTarget[index]) ** 2, 0) / points;
  const gradient = finiteDifference(yPred, params.dt);
  const physicsPenalty =
    gradient.reduce((sum, v, index) => sum + (v - commutator[index]) ** 2, 0) / points;

  return {
    title: SIMULATION_CONFIG.kan_ehrenfest.label,
    metrics: {
      MSE: mse.toFixed(5),
      "Physics Penalty": physicsPenalty.toFixed(5),
      "Total Loss": (mse + params.lambdaPenalty * physicsPenalty).toFixed(5),
    },
    frames: yPred,
  };
}

function runShallowWater(params) {
  const frames = [];
  let amplitude = 1;
  for (let i = 0; i < params.steps; i += 1) {
    amplitude = amplitude * (1 - params.cfl * 0.008) + Math.sin(i / 6) * 0.005 * params.ranks;
    frames.push(Math.max(0, amplitude));
  }
  return {
    title: SIMULATION_CONFIG.shallow_water_gpu.label,
    metrics: {
      Ranks: params.ranks,
      "Peak Height": Math.max(...frames).toFixed(4),
      "Final Height": frames[frames.length - 1].toFixed(4),
    },
    frames,
  };
}

function runSimulation(simulationType, params) {
  if (simulationType === "zeus_code") {
    return runZeusCode(params);
  }
  if (simulationType === "open_multi_agent") {
    return runOpenMultiAgent(params);
  }
  if (simulationType === "kan_ehrenfest") {
    return runKanEhrenfest(params);
  }
  return runShallowWater(params);
}

function renderMetrics(metrics) {
  resultMetrics.innerHTML = "";
  Object.entries(metrics).forEach(([label, value]) => {
    const item = document.createElement("article");
    item.className = "metric";
    item.innerHTML = `
      <span class="metric-label">${label}</span>
      <span class="metric-value">${value}</span>
    `;
    resultMetrics.appendChild(item);
  });
}

function drawChart(frames) {
  chartContext.clearRect(0, 0, chart.width, chart.height);
  if (!frames.length) {
    return;
  }
  const min = Math.min(...frames);
  const max = Math.max(...frames);
  const range = Math.max(0.0001, max - min);
  const padding = 30;

  chartContext.strokeStyle = "rgba(255,255,255,0.25)";
  chartContext.beginPath();
  chartContext.moveTo(padding, chart.height - padding);
  chartContext.lineTo(chart.width - padding, chart.height - padding);
  chartContext.moveTo(padding, padding);
  chartContext.lineTo(padding, chart.height - padding);
  chartContext.stroke();

  chartContext.strokeStyle = "#00e9bf";
  chartContext.lineWidth = 2;
  chartContext.beginPath();
  frames.forEach((value, index) => {
    const x = padding + (index / (frames.length - 1 || 1)) * (chart.width - padding * 2);
    const y =
      chart.height -
      padding -
      ((value - min) / range) * (chart.height - padding * 2);
    if (index === 0) {
      chartContext.moveTo(x, y);
    } else {
      chartContext.lineTo(x, y);
    }
  });
  chartContext.stroke();
}

function runAndRender() {
  const simulationType = simulationSelect.value;
  latestResult = runSimulation(simulationType, PARAMETER_STATE);
  renderMetrics(latestResult.metrics);
  drawChart(latestResult.frames);
  const cycleSource =
    latestResult.assignmentPreview ??
    new CyclicIterator([
      "seed-A",
      "seed-B",
      "seed-C",
      "seed-D",
    ]).take(12);
  cyclePreview.textContent = cycleSource.join(" | ");
}

function remixParameters() {
  const config = SIMULATION_CONFIG[simulationSelect.value];
  const remixIterator = new CyclicIterator([0.85, 0.95, 1.05, 1.15, 0.9, 1.1]);
  config.params.forEach((param) => {
    const modifier = remixIterator.next();
    const newValue = Math.min(param.max, Math.max(param.min, param.value * modifier));
    PARAMETER_STATE[param.key] = Number(newValue.toFixed(4));
  });
  loadParameters(simulationSelect.value);
  Object.entries(PARAMETER_STATE).forEach(([key, value]) => {
    const slider = document.getElementById(`param-${key}`);
    const number = document.getElementById(`param-${key}-number`);
    if (slider && number) {
      slider.value = String(value);
      number.value = String(value);
    }
  });
}

function currentStateToHash() {
  const payload = {
    simulation: simulationSelect.value,
    params: PARAMETER_STATE,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function loadStateFromHash() {
  if (!window.location.hash.startsWith("#state=")) {
    return;
  }
  try {
    const raw = window.location.hash.replace("#state=", "");
    const decoded = decodeURIComponent(escape(atob(raw)));
    const state = JSON.parse(decoded);
    if (!SIMULATION_CONFIG[state.simulation]) {
      return;
    }
    simulationSelect.value = state.simulation;
    loadParameters(state.simulation);
    Object.entries(state.params).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(PARAMETER_STATE, key)) {
        PARAMETER_STATE[key] = value;
        const slider = document.getElementById(`param-${key}`);
        const number = document.getElementById(`param-${key}-number`);
        if (slider && number) {
          slider.value = String(value);
          number.value = String(value);
        }
      }
    });
  } catch (error) {
    console.warn("Unable to load state from URL hash.", error);
  }
}

simulationSelect.addEventListener("change", () => {
  loadParameters(simulationSelect.value);
  runAndRender();
});

runButton.addEventListener("click", runAndRender);
remixButton.addEventListener("click", () => {
  remixParameters();
  runAndRender();
});
shareButton.addEventListener("click", async () => {
  const hash = currentStateToHash();
  const url = `${window.location.origin}${window.location.pathname}#state=${hash}`;
  await navigator.clipboard.writeText(url);
  shareButton.textContent = "Link Copied";
  window.setTimeout(() => {
    shareButton.textContent = "Copy Share Link";
  }, 1200);
});

initHeroLoop();
loadParameters(simulationSelect.value);
loadStateFromHash();
runAndRender();
