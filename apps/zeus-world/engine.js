import { CURATED_2026, SCENARIO_LIBRARY } from "./data/curated-2026.js";

export class CyclicIterator {
  constructor(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("CyclicIterator requires at least one item.");
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

const ACTIONS = ["cooperate", "compete", "invest", "delay"];
const ACTION_EFFECTS = {
  cooperate: { welfare: 9, risk: -4, cost: 4, fairness: 4 },
  compete: { welfare: 2, risk: 6, cost: 2, fairness: -4 },
  invest: { welfare: 8, risk: -2, cost: 9, fairness: 2 },
  delay: { welfare: -3, risk: 5, cost: 0, fairness: -2 },
};

const ACTOR_PREFERENCES = {
  water: {
    Farmers: { cooperate: 0.7, compete: 0.35, invest: 0.6, delay: -0.2 },
    "City Utility": { cooperate: 0.8, compete: 0.2, invest: 0.5, delay: -0.3 },
    Industry: { cooperate: 0.3, compete: 0.6, invest: 0.45, delay: 0.1 },
    Regulator: { cooperate: 0.9, compete: -0.2, invest: 0.4, delay: 0.2 },
  },
  mobility: {
    Drivers: { cooperate: 0.25, compete: 0.7, invest: 0.3, delay: 0.2 },
    "Transit Agency": { cooperate: 0.85, compete: -0.1, invest: 0.55, delay: 0.1 },
    Businesses: { cooperate: 0.35, compete: 0.55, invest: 0.45, delay: 0.1 },
    Regulator: { cooperate: 0.8, compete: -0.2, invest: 0.6, delay: 0.25 },
  },
  health: {
    Hospitals: { cooperate: 0.8, compete: 0.1, invest: 0.7, delay: -0.4 },
    "Public Agency": { cooperate: 0.9, compete: -0.2, invest: 0.55, delay: 0.1 },
    Residents: { cooperate: 0.45, compete: 0.3, invest: 0.25, delay: 0.25 },
    Regulator: { cooperate: 0.85, compete: -0.25, invest: 0.5, delay: 0.2 },
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deterministicRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function gini(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return 0;
  }
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

function selectAction({
  scenario,
  actor,
  pressure,
  incentive,
  penalty,
  collaborationWeight,
  actionCounts,
  rng,
}) {
  const actorPreference = ACTOR_PREFERENCES[scenario]?.[actor] ?? {};
  const actionScores = ACTIONS.map((action) => {
    const effect = ACTION_EFFECTS[action];
    const fatigue = (actionCounts[action] ?? 0) * 0.85;
    const score =
      effect.welfare * (1 + collaborationWeight * 0.2) -
      (effect.risk + pressure * 6) * 0.5 -
      effect.cost * 0.2 +
      (action === "cooperate" || action === "invest" ? incentive * 0.55 : 0) -
      (action === "compete" || action === "delay" ? penalty * 0.45 : 0) +
      (actorPreference[action] ?? 0) * 1.7 -
      fatigue +
      (rng() - 0.5);
    return { action, score };
  });
  actionScores.sort((a, b) => b.score - a.score);
  return actionScores[0].action;
}

function objectiveScore(objectiveFn, { welfare, fairness, risk, cost, budget }) {
  if (objectiveFn === "profit_risk_floor") {
    let score = welfare * 1.1 - risk * 0.75 - Math.max(0, cost - budget) * 1.5;
    if (risk > 45) {
      score -= 30;
    }
    return score;
  }
  if (objectiveFn === "equity_viability_floor") {
    let score = fairness * 1.3 + welfare * 0.45 - risk * 0.6;
    if (welfare < 35) {
      score -= 25;
    }
    return score;
  }
  // welfare_cost_cap
  let score = welfare + fairness * 0.8 - risk * 0.7;
  if (cost > budget) {
    score -= (cost - budget) * 1.8;
  }
  return score;
}

function branchFromLevers(baseLevers) {
  return [
    {
      id: "balanced",
      title: "Balanced Incentives",
      levers: { ...baseLevers },
      pressureDelta: 0,
    },
    {
      id: "incentive_push",
      title: "Incentive-Led Cooperation",
      levers: {
        ...baseLevers,
        budget: baseLevers.budget * 1.08,
        incentive: baseLevers.incentive * 1.25,
        penalty: baseLevers.penalty * 0.9,
        collaborationWeight: baseLevers.collaborationWeight * 1.1,
      },
      pressureDelta: -0.03,
    },
    {
      id: "penalty_push",
      title: "Penalty-Driven Compliance",
      levers: {
        ...baseLevers,
        budget: baseLevers.budget * 0.95,
        incentive: baseLevers.incentive * 0.9,
        penalty: baseLevers.penalty * 1.35,
        collaborationWeight: baseLevers.collaborationWeight * 0.95,
      },
      pressureDelta: 0.03,
    },
    {
      id: "resilience_push",
      title: "Resilience Investment",
      levers: {
        ...baseLevers,
        budget: baseLevers.budget * 1.18,
        incentive: baseLevers.incentive * 1.1,
        penalty: baseLevers.penalty,
        collaborationWeight: baseLevers.collaborationWeight * 1.25,
        rounds: baseLevers.rounds + 1,
      },
      pressureDelta: -0.05,
    },
  ];
}

function simulateBranch({ scenario, baseline, branchConfig, objectiveFn, seed }) {
  const rng = deterministicRandom(seed);
  const stakeholders = SCENARIO_LIBRARY[scenario].stakeholders;
  const rounds = branchConfig.levers.rounds;
  const iterator = new CyclicIterator(stakeholders);
  const payoffs = Object.fromEntries(stakeholders.map((name) => [name, 0]));
  const actionCounts = Object.fromEntries(ACTIONS.map((action) => [action, 0]));
  const branchLog = [];

  let welfareAcc = 0;
  let riskAcc = 0;
  let costAcc = 0;
  let fairnessAcc = 0;

  const pressure = clamp(baseline.pressure + branchConfig.pressureDelta, 0.2, 0.92);

  for (let round = 1; round <= rounds * stakeholders.length; round += 1) {
    const actor = iterator.next();
    const action = selectAction({
      scenario,
      actor,
      pressure,
      incentive: branchConfig.levers.incentive,
      penalty: branchConfig.levers.penalty,
      collaborationWeight: branchConfig.levers.collaborationWeight,
      actionCounts,
      rng,
    });
    actionCounts[action] += 1;

    const effect = ACTION_EFFECTS[action];
    const welfareDelta = effect.welfare * (1 - pressure * 0.25);
    const riskDelta = effect.risk + pressure * 5;
    const costDelta =
      Math.max(0, effect.cost + Math.max(0, branchConfig.levers.incentive - branchConfig.levers.penalty) * 0.18);
    const payoffDelta = welfareDelta - riskDelta * 0.42 - costDelta * 0.22;

    welfareAcc += welfareDelta;
    riskAcc += riskDelta;
    costAcc += costDelta;
    fairnessAcc += effect.fairness;
    payoffs[actor] += payoffDelta;

    branchLog.push(
      `R${String(round).padStart(2, "0")} ${actor} -> ${action} (delta ${payoffDelta.toFixed(2)})`
    );
  }

  const welfare = clamp(welfareAcc / (rounds * 0.65), 0, 100);
  const risk = clamp(riskAcc / (rounds * 1.25), 0, 100);
  const fairness =
    clamp(
      100 - gini(Object.values(payoffs).map((value) => Math.max(0.001, value + 20))) * 100 + fairnessAcc / rounds,
      0,
      100
    );
  const cost = clamp(costAcc, 0, 2000);
  const confidence = clamp(90 - pressure * 22 - Math.abs(branchConfig.levers.incentive - branchConfig.levers.penalty) * 5, 20, 95);
  const objective = objectiveScore(objectiveFn, {
    welfare,
    fairness,
    risk,
    cost,
    budget: branchConfig.levers.budget,
  });

  return {
    id: branchConfig.id,
    title: branchConfig.title,
    welfare: Number(welfare.toFixed(3)),
    fairness: Number(fairness.toFixed(3)),
    risk: Number(risk.toFixed(3)),
    cost: Number(cost.toFixed(3)),
    confidence: Number(confidence.toFixed(3)),
    objectiveScore: Number(objective.toFixed(3)),
    feasible: cost <= branchConfig.levers.budget,
    payoffs: Object.fromEntries(
      Object.entries(payoffs).map(([name, value]) => [name, Number(value.toFixed(3))])
    ),
    branchLog,
  };
}

function runUncertainty({ scenario, baseline, levers, objectiveFn, seed, draws = 40 }) {
  const values = [];
  for (let i = 0; i < draws; i += 1) {
    const drawSeed = seed + i * 17;
    const rng = deterministicRandom(drawSeed);
    const pressureShift = (rng() - 0.5) * 0.16;
    const syntheticBranch = {
      id: `u-${i}`,
      title: "uncertainty",
      levers,
      pressureDelta: pressureShift,
    };
    const draw = simulateBranch({
      scenario,
      baseline,
      branchConfig: syntheticBranch,
      objectiveFn,
      seed: drawSeed,
    });
    values.push(draw.welfare);
  }
  values.sort((a, b) => a - b);
  const idx10 = Math.max(0, Math.floor(values.length * 0.1) - 1);
  const idx90 = Math.min(values.length - 1, Math.ceil(values.length * 0.9) - 1);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    meanWelfare: Number(avg.toFixed(3)),
    p10Welfare: values[idx10],
    p90Welfare: values[idx90],
    spread: Number((values[idx90] - values[idx10]).toFixed(3)),
  };
}

function runBacktest({ baseline, recommendedBranch }) {
  const target = baseline.backtest_target;
  const error = Math.abs(recommendedBranch.welfare - target) / Math.max(1, target);
  return {
    target: Number(target.toFixed(3)),
    predicted: recommendedBranch.welfare,
    relativeError: Number(error.toFixed(4)),
    pass: error <= 0.2,
  };
}

function runSensitivity({ scenario, baseline, levers, objectiveFn, seed, baselineScore }) {
  const variants = [
    { incentive: levers.incentive * 0.9, penalty: levers.penalty * 1.1 },
    { incentive: levers.incentive * 1.1, penalty: levers.penalty * 0.9 },
  ];

  const scores = variants.map((variant, index) => {
    const branch = simulateBranch({
      scenario,
      baseline,
      branchConfig: {
        id: `s-${index}`,
        title: "sensitivity",
        levers: { ...levers, ...variant },
        pressureDelta: 0,
      },
      objectiveFn,
      seed: seed + index * 31,
    });
    return branch.objectiveScore;
  });

  const drift = Math.max(...scores.map((value) => Math.abs(value - baselineScore)));
  return {
    objectiveDrift: Number(drift.toFixed(3)),
    pass: drift <= 18,
  };
}

function decisionTree(branches, recommendedId) {
  return branches.map((branch, index) => ({
    node: `N${index + 1}`,
    label: branch.title,
    recommendationPath: branch.id === recommendedId,
    expectedWelfare: branch.welfare,
    expectedCost: branch.cost,
  }));
}

function payoffMatrix(branches, scenario) {
  const stakeholders = SCENARIO_LIBRARY[scenario].stakeholders;
  return stakeholders.map((stakeholder) => {
    const row = { stakeholder };
    branches.forEach((branch) => {
      row[branch.id] = branch.payoffs[stakeholder];
    });
    return row;
  });
}

export async function resolveScenarioData({ scenario, region }) {
  const data = CURATED_2026.regions[region]?.[scenario];
  if (data) {
    return {
      baseline: data,
      sourceChain: ["curated"],
      sourceMode: "curated",
    };
  }

  // Live enrichment placeholder hook.
  try {
    const response = await fetch("https://api.worldbank.org/v2/country/US/indicator/ER.H2O.FWST.ZS?format=json");
    if (response.ok) {
      return {
        baseline: {
          pressure: 0.6,
          backtest_target: 60,
        },
        sourceChain: ["live", "synthetic"],
        sourceMode: "live",
      };
    }
  } catch (error) {
    // Fall back below.
  }

  return {
    baseline: {
      pressure: 0.6,
      backtest_target: 60,
    },
    sourceChain: ["synthetic"],
    sourceMode: "synthetic",
  };
}

export function buildPolicyPack({
  scenario,
  region,
  objectiveFn,
  levers,
  baseline,
  seed = 42,
  peerChecklistComplete = false,
}) {
  const branches = branchFromLevers(levers).map((config, index) =>
    simulateBranch({
      scenario,
      baseline,
      branchConfig: config,
      objectiveFn,
      seed: seed + index * 41,
    })
  );
  const feasible = branches.filter((branch) => branch.feasible);
  const pool = feasible.length > 0 ? feasible : branches;
  const recommended = [...pool].sort((a, b) => b.objectiveScore - a.objectiveScore)[0];

  const uncertainty = runUncertainty({
    scenario,
    baseline,
    levers,
    objectiveFn,
    seed,
  });
  const backtest = runBacktest({ baseline, recommendedBranch: recommended });
  const sensitivity = runSensitivity({
    scenario,
    baseline,
    levers,
    objectiveFn,
    seed,
    baselineScore: recommended.objectiveScore,
  });
  const ready = backtest.pass && sensitivity.pass && peerChecklistComplete && recommended.feasible;

  return {
    runId: `run-${Date.now()}-${Math.floor(seed * 13)}`,
    scenario,
    region,
    objectiveFn,
    branches,
    recommendedBranchId: recommended.id,
    recommendation: recommended,
    uncertainty,
    backtest,
    sensitivity,
    decisionTree: decisionTree(branches, recommended.id),
    payoffMatrix: payoffMatrix(branches, scenario),
    decisionReady: ready,
    negotiationLog: recommended.branchLog,
  };
}

export function scenarioDefaults(scenario) {
  if (scenario === "water") {
    return { budget: 320, incentive: 1.2, penalty: 1.0, collaborationWeight: 1.0, rounds: 8 };
  }
  if (scenario === "mobility") {
    return { budget: 280, incentive: 1.1, penalty: 1.2, collaborationWeight: 1.0, rounds: 8 };
  }
  return { budget: 300, incentive: 1.0, penalty: 1.1, collaborationWeight: 1.05, rounds: 8 };
}
