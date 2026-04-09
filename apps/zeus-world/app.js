import { buildPolicyPack, CyclicIterator, resolveScenarioData, scenarioDefaults } from "./engine.js";
import { SCENARIO_LIBRARY, SOURCES_2026 } from "./data/curated-2026.js";

const elements = {
  heroLoop: document.getElementById("hero-loop"),
  runStatus: document.getElementById("run-status"),
  dataMode: document.getElementById("data-mode"),
  scenario: document.getElementById("scenario"),
  region: document.getElementById("region"),
  objective: document.getElementById("objective"),
  budget: document.getElementById("budget"),
  budgetNumber: document.getElementById("budget-number"),
  incentive: document.getElementById("incentive"),
  incentiveNumber: document.getElementById("incentive-number"),
  penalty: document.getElementById("penalty"),
  penaltyNumber: document.getElementById("penalty-number"),
  collaboration: document.getElementById("collaboration"),
  collaborationNumber: document.getElementById("collaboration-number"),
  runButton: document.getElementById("run-button"),
  remixButton: document.getElementById("remix-button"),
  copyLinkButton: document.getElementById("copy-link-button"),
  metrics: document.getElementById("metrics"),
  chart: document.getElementById("chart"),
  decisionTree: document.getElementById("decision-tree"),
  payoffHead: document.getElementById("payoff-head"),
  payoffBody: document.getElementById("payoff-body"),
  negotiationLog: document.getElementById("negotiation-log"),
  gateStatus: document.getElementById("gate-status"),
  checkAssumptions: document.getElementById("check-assumptions"),
  checkFairness: document.getElementById("check-fairness"),
  checkRisk: document.getElementById("check-risk"),
  exportJson: document.getElementById("export-json"),
  exportMemo: document.getElementById("export-memo"),
  sources: document.getElementById("sources"),
};

const chartContext = elements.chart.getContext("2d");

const state = {
  runResult: null,
  jobs: {},
  currentRunId: null,
  baselineData: null,
};

const heroMessages = new CyclicIterator([
  "Model multi-party negotiation with budget, incentive, and penalty levers.",
  "Compare policy branches with payoff matrices and uncertainty bounds.",
  "Generate action-ready memos tied to 2026 real-world challenge baselines.",
]);

function statusLabel(status) {
  return `Status: ${status}`;
}

function setRunStatus(status) {
  elements.runStatus.textContent = statusLabel(status);
}

function connectInputPair(rangeInput, numberInput) {
  const syncFromRange = () => {
    numberInput.value = rangeInput.value;
  };
  const syncFromNumber = () => {
    rangeInput.value = numberInput.value;
  };
  rangeInput.addEventListener("input", syncFromRange);
  numberInput.addEventListener("input", syncFromNumber);
}

function loadScenarioDefaults() {
  const defaults = scenarioDefaults(elements.scenario.value);
  elements.budget.value = String(defaults.budget);
  elements.budgetNumber.value = String(defaults.budget);
  elements.incentive.value = String(defaults.incentive);
  elements.incentiveNumber.value = String(defaults.incentive);
  elements.penalty.value = String(defaults.penalty);
  elements.penaltyNumber.value = String(defaults.penalty);
  elements.collaboration.value = String(defaults.collaborationWeight);
  elements.collaborationNumber.value = String(defaults.collaborationWeight);
}

function readLevers() {
  return {
    budget: Number(elements.budget.value),
    incentive: Number(elements.incentive.value),
    penalty: Number(elements.penalty.value),
    collaborationWeight: Number(elements.collaboration.value),
    rounds: 8,
  };
}

function checklistComplete() {
  return Boolean(
    elements.checkAssumptions.checked && elements.checkFairness.checked && elements.checkRisk.checked
  );
}

function updateGateStatus() {
  const run = state.runResult;
  if (!run) {
    elements.gateStatus.textContent = "Decision-ready: no (no run completed)";
    return;
  }
  const ready = Boolean(
    run.backtest.pass &&
      run.sensitivity.pass &&
      checklistComplete() &&
      run.recommendation?.feasible
  );
  elements.gateStatus.textContent = `Decision-ready: ${ready ? "yes" : "no"} | `
    + `Backtest: ${run.backtest.pass ? "pass" : "fail"} | `
    + `Sensitivity: ${run.sensitivity.pass ? "pass" : "fail"} | `
    + `Feasibility: ${run.recommendation?.feasible ? "pass" : "fail"} | `
    + `Peer review: ${checklistComplete() ? "pass" : "pending"}`;
}

function metricEntries(result) {
  return [
    ["Scenario", SCENARIO_LIBRARY[result.scenario].label],
    ["Region", result.region],
    ["Recommended Branch", result.recommendation.title],
    ["Welfare", result.recommendation.welfare.toFixed(2)],
    ["Fairness", result.recommendation.fairness.toFixed(2)],
    ["Risk", result.recommendation.risk.toFixed(2)],
    ["Cost", result.recommendation.cost.toFixed(2)],
    ["Confidence", `${result.recommendation.confidence.toFixed(1)}%`],
    ["Backtest Error", `${(result.backtest.relativeError * 100).toFixed(1)}%`],
    ["Uncertainty (P10-P90)", `${result.uncertainty.p10Welfare.toFixed(1)}-${result.uncertainty.p90Welfare.toFixed(1)}`],
  ];
}

function renderMetrics(result) {
  elements.metrics.innerHTML = "";
  metricEntries(result).forEach(([label, value]) => {
    const card = document.createElement("article");
    card.className = "metric-card";
    card.innerHTML = `
      <span class="metric-label">${label}</span>
      <span class="metric-value">${value}</span>
    `;
    elements.metrics.appendChild(card);
  });
}

function drawChart(result) {
  const ctx = chartContext;
  const branches = result.branches;
  const values = branches.map((branch) => branch.objectiveScore);
  const min = Math.min(...values, result.uncertainty.p10Welfare);
  const max = Math.max(...values, result.uncertainty.p90Welfare);
  const range = Math.max(1, max - min);
  const width = elements.chart.width;
  const height = elements.chart.height;
  const padding = 30;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  const yFromValue = (value) =>
    height - padding - ((value - min) / range) * (height - padding * 2);
  const xFromIndex = (index) =>
    padding + (index / Math.max(1, branches.length - 1)) * (width - padding * 2);

  // Uncertainty band.
  const yLow = yFromValue(result.uncertainty.p10Welfare);
  const yHigh = yFromValue(result.uncertainty.p90Welfare);
  ctx.fillStyle = "rgba(255, 140, 57, 0.22)";
  ctx.fillRect(padding, yHigh, width - padding * 2, Math.max(2, yLow - yHigh));

  // Objective line.
  ctx.strokeStyle = "#00ddb5";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  branches.forEach((branch, index) => {
    const x = xFromIndex(index);
    const y = yFromValue(branch.objectiveScore);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Points and labels.
  branches.forEach((branch, index) => {
    const x = xFromIndex(index);
    const y = yFromValue(branch.objectiveScore);
    ctx.beginPath();
    ctx.fillStyle = branch.id === result.recommendedBranchId ? "#ff8c39" : "#35a8ff";
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(241, 247, 255, 0.9)";
    ctx.font = "12px Space Grotesk";
    ctx.fillText(branch.id, x - 16, height - 10);
  });
}

function renderDecisionTree(result) {
  elements.decisionTree.innerHTML = "";
  result.decisionTree.forEach((node) => {
    const div = document.createElement("div");
    div.className = `node${node.recommendationPath ? " recommended" : ""}`;
    div.innerHTML = `
      <strong>${node.node} · ${node.label}</strong>
      <div>Welfare: ${node.expectedWelfare.toFixed(2)}</div>
      <div>Cost: ${node.expectedCost.toFixed(2)}</div>
      <div>Path: ${node.recommendationPath ? "recommended" : "alternative"}</div>
    `;
    elements.decisionTree.appendChild(div);
  });
}

function renderPayoffTable(result) {
  const branchIds = result.branches.map((branch) => branch.id);
  elements.payoffHead.innerHTML = "";
  const headRow = document.createElement("tr");
  headRow.innerHTML = `<th>Stakeholder</th>${branchIds.map((id) => `<th>${id}</th>`).join("")}`;
  elements.payoffHead.appendChild(headRow);

  elements.payoffBody.innerHTML = "";
  result.payoffMatrix.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.stakeholder}</td>${
      branchIds.map((id) => `<td>${Number(row[id]).toFixed(2)}</td>`).join("")
    }`;
    elements.payoffBody.appendChild(tr);
  });
}

function renderNegotiationLog(result) {
  elements.negotiationLog.textContent = result.negotiationLog.join("\n");
}

function renderSources(sourceChain) {
  const chainText = `Data mode chain: ${sourceChain.join(" -> ")}`;
  const citations = SOURCES_2026.map((source) => `${source.label}: ${source.url}`).join(" | ");
  elements.sources.textContent = `${chainText}. Sources: ${citations}`;
}

function renderRunResult(result, sourceChain) {
  state.runResult = result;
  renderMetrics(result);
  drawChart(result);
  renderDecisionTree(result);
  renderPayoffTable(result);
  renderNegotiationLog(result);
  renderSources(sourceChain);
  updateGateStatus();
}

function serializeState() {
  return {
    scenario: elements.scenario.value,
    region: elements.region.value,
    objective: elements.objective.value,
    levers: readLevers(),
  };
}

function updateHash() {
  const payload = serializeState();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  window.location.hash = `state=${encoded}`;
}

function loadHash() {
  if (!window.location.hash.startsWith("#state=")) {
    return;
  }
  try {
    const raw = window.location.hash.replace("#state=", "");
    const decoded = decodeURIComponent(escape(atob(raw)));
    const data = JSON.parse(decoded);
    if (!SCENARIO_LIBRARY[data.scenario]) {
      return;
    }
    elements.scenario.value = data.scenario;
    elements.region.value = data.region;
    elements.objective.value = data.objective;
    const levers = data.levers ?? {};
    const defaults = scenarioDefaults(data.scenario);
    elements.budget.value = String(levers.budget ?? defaults.budget);
    elements.budgetNumber.value = String(levers.budget ?? defaults.budget);
    elements.incentive.value = String(levers.incentive ?? defaults.incentive);
    elements.incentiveNumber.value = String(levers.incentive ?? defaults.incentive);
    elements.penalty.value = String(levers.penalty ?? defaults.penalty);
    elements.penaltyNumber.value = String(levers.penalty ?? defaults.penalty);
    elements.collaboration.value = String(levers.collaborationWeight ?? defaults.collaborationWeight);
    elements.collaborationNumber.value = String(levers.collaborationWeight ?? defaults.collaborationWeight);
  } catch (error) {
    console.warn("Invalid state hash", error);
  }
}

function createRunJob(payload) {
  const runId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  state.jobs[runId] = { status: "queued", result: null, sourceChain: ["curated"] };
  window.setTimeout(() => {
    state.jobs[runId].status = "running";
  }, 260);
  window.setTimeout(() => {
    state.jobs[runId].status = "completed";
    state.jobs[runId].result = payload.result;
    state.jobs[runId].sourceChain = payload.sourceChain;
  }, 1180);
  return runId;
}

function pollRun(runId) {
  setRunStatus("queued");
  const poller = window.setInterval(() => {
    const job = state.jobs[runId];
    if (!job) {
      window.clearInterval(poller);
      return;
    }
    setRunStatus(job.status);
    if (job.status === "completed") {
      window.clearInterval(poller);
      setRunStatus("completed");
      renderRunResult(job.result, job.sourceChain);
    }
  }, 260);
}

async function runNegotiation() {
  updateHash();
  setRunStatus("queued");
  const scenario = elements.scenario.value;
  const region = elements.region.value;
  const objectiveFn = elements.objective.value;
  const levers = readLevers();
  const source = await resolveScenarioData({ scenario, region });
  elements.dataMode.textContent = `Data: ${source.sourceMode}`;
  const result = buildPolicyPack({
    scenario,
    region,
    objectiveFn,
    levers,
    baseline: source.baseline,
    seed: Date.now() % 1000,
    peerChecklistComplete: checklistComplete(),
  });
  const runId = createRunJob({ result, sourceChain: source.sourceChain });
  state.currentRunId = runId;
  pollRun(runId);
}

function remixLevers() {
  const iterator = new CyclicIterator([0.88, 0.93, 1.05, 1.11, 0.96, 1.08]);
  const edits = [
    ["budget", "budgetNumber", { min: 120, max: 520 }],
    ["incentive", "incentiveNumber", { min: 0.3, max: 2.2 }],
    ["penalty", "penaltyNumber", { min: 0.3, max: 2.2 }],
    ["collaboration", "collaborationNumber", { min: 0.6, max: 1.8 }],
  ];
  edits.forEach(([rangeId, numberId, bounds]) => {
    const rangeElement = document.getElementById(rangeId);
    const numberElement = document.getElementById(numberId);
    const current = Number(rangeElement.value);
    const next = clamp(current * iterator.next(), bounds.min, bounds.max);
    rangeElement.value = String(Number(next.toFixed(3)));
    numberElement.value = String(Number(next.toFixed(3)));
  });
}

function exportDecisionJson() {
  if (!state.runResult) {
    return;
  }
  const payload = {
    ...state.runResult,
    checklistComplete: checklistComplete(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${state.runResult.scenario}-${state.runResult.region}-decision.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportMemoPdf() {
  if (!state.runResult) {
    return;
  }
  const run = state.runResult;
  const jspdf = window.jspdf;
  if (!jspdf || !jspdf.jsPDF) {
    return;
  }
  const doc = new jspdf.jsPDF();
  const lines = [
    "Zeus World - Action Memo",
    `Generated: ${new Date().toISOString()}`,
    `Scenario: ${SCENARIO_LIBRARY[run.scenario].label} (${run.region})`,
    `Objective: ${run.objectiveFn}`,
    "",
    `Recommended Branch: ${run.recommendation.title}`,
    `Welfare: ${run.recommendation.welfare.toFixed(2)}`,
    `Fairness: ${run.recommendation.fairness.toFixed(2)}`,
    `Risk: ${run.recommendation.risk.toFixed(2)}`,
    `Cost: ${run.recommendation.cost.toFixed(2)}`,
    `Confidence: ${run.recommendation.confidence.toFixed(1)}%`,
    "",
    `Decision Ready: ${run.backtest.pass && run.sensitivity.pass && checklistComplete() && run.recommendation.feasible ? "Yes" : "No"}`,
    `Backtest Error: ${(run.backtest.relativeError * 100).toFixed(1)}%`,
    `Sensitivity Drift: ${run.sensitivity.objectiveDrift.toFixed(2)}`,
    "",
    "Sources:",
    ...SOURCES_2026.map((source) => `${source.label} - ${source.url}`),
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  let y = 16;
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 176);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 6;
    if (y > 275) {
      doc.addPage();
      y = 18;
    }
  });
  doc.save(`${run.scenario}-${run.region}-action-memo.pdf`);
}

async function copyScenarioLink() {
  updateHash();
  await navigator.clipboard.writeText(window.location.href);
  elements.copyLinkButton.textContent = "Link Copied";
  window.setTimeout(() => {
    elements.copyLinkButton.textContent = "Copy Scenario Link";
  }, 1000);
}

function setupHeroLoop() {
  elements.heroLoop.textContent = heroMessages.next();
  window.setInterval(() => {
    elements.heroLoop.textContent = heroMessages.next();
  }, 2600);
}

function bindEvents() {
  connectInputPair(elements.budget, elements.budgetNumber);
  connectInputPair(elements.incentive, elements.incentiveNumber);
  connectInputPair(elements.penalty, elements.penaltyNumber);
  connectInputPair(elements.collaboration, elements.collaborationNumber);

  elements.scenario.addEventListener("change", () => {
    loadScenarioDefaults();
    updateHash();
  });
  elements.region.addEventListener("change", updateHash);
  elements.objective.addEventListener("change", updateHash);
  elements.runButton.addEventListener("click", runNegotiation);
  elements.remixButton.addEventListener("click", remixLevers);
  elements.copyLinkButton.addEventListener("click", copyScenarioLink);
  elements.exportJson.addEventListener("click", exportDecisionJson);
  elements.exportMemo.addEventListener("click", exportMemoPdf);
  [elements.checkAssumptions, elements.checkFairness, elements.checkRisk].forEach((checkbox) => {
    checkbox.addEventListener("change", updateGateStatus);
  });
}

function init() {
  setupHeroLoop();
  loadScenarioDefaults();
  loadHash();
  bindEvents();
  updateGateStatus();
}

init();
