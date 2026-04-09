import pytest

from AI_Simulations.open_multi_agent.src.coordinator import Task, TaskQueue


def test_topological_resolution_orders_dependencies():
    queue = TaskQueue()
    queue.add_task(Task(id=1, description="load data"))
    queue.add_task(Task(id=2, description="train", dependencies=[1]))
    queue.add_task(Task(id=3, description="evaluate", dependencies=[2]))

    ordered = queue.resolve_dependencies()
    assert [task.id for task in ordered] == [1, 2, 3]


def test_cycle_detection_raises():
    queue = TaskQueue()
    queue.add_task(Task(id=1, description="a", dependencies=[2]))
    queue.add_task(Task(id=2, description="b", dependencies=[1]))
    with pytest.raises(ValueError, match="Cyclic dependency"):
        queue.resolve_dependencies()


def test_cyclic_execution_rounds_are_repeatable():
    queue = TaskQueue()
    queue.add_task(Task(id=1, description="a"))
    queue.add_task(Task(id=2, description="b", dependencies=[1]))
    queue.add_task(Task(id=3, description="c", dependencies=[2]))

    round_robin = list(queue.cyclic_execution_order(rounds=2))
    assert [task.id for task in round_robin] == [1, 2, 3, 1, 2, 3]
