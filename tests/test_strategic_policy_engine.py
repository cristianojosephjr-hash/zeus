from AI_Simulations.strategic_policy.src.engine import build_policy_pack


def test_policy_pack_contains_expected_sections():
    pack = build_policy_pack(
        domain="water",
        objective_fn="welfare_cost_cap",
        budget=320,
        incentive=1.2,
        penalty=1.0,
        collaboration_weight=1.0,
        rounds=8,
        seed=7,
        peer_review_checked=False,
    )
    assert "branches" in pack
    assert "payoff_matrix" in pack
    assert "uncertainty" in pack
    assert len(pack["branches"]) == 4


def test_recommended_branch_exists_in_branch_list():
    pack = build_policy_pack(
        domain="mobility",
        objective_fn="welfare_cost_cap",
        budget=300,
        incentive=1.1,
        penalty=1.2,
        collaboration_weight=1.0,
        rounds=8,
        seed=11,
    )
    ids = {branch["id"] for branch in pack["branches"]}
    assert pack["recommended_branch_id"] in ids


def test_decision_ready_requires_peer_review():
    without_review = build_policy_pack(
        domain="health",
        objective_fn="welfare_cost_cap",
        peer_review_checked=False,
    )
    with_review = build_policy_pack(
        domain="health",
        objective_fn="welfare_cost_cap",
        peer_review_checked=True,
    )
    assert without_review["decision_ready"] is False
    if with_review["backtest"]["pass"] and with_review["sensitivity"]["pass"]:
        assert with_review["decision_ready"] is True


def test_decision_ready_requires_feasible_recommendation():
    pack = build_policy_pack(
        domain="water",
        objective_fn="welfare_cost_cap",
        budget=180,
        incentive=0.4,
        penalty=1.8,
        collaboration_weight=0.7,
        rounds=8,
        seed=42,
        peer_review_checked=True,
    )
    recommended = next(
        branch for branch in pack["branches"] if branch["id"] == pack["recommended_branch_id"]
    )
    assert recommended["feasible"] is False
    assert pack["decision_ready"] is False
