from __future__ import annotations

from collections import deque
from pathlib import Path
import sys
from typing import Deque, Dict, Iterable, Iterator, List, Optional

from pydantic import BaseModel, Field

try:
    from AI_Simulations.common.src.cyclic_iterator import CyclicIterator
except ImportError:
    repo_root = Path(__file__).resolve().parents[3]
    if str(repo_root) not in sys.path:
        sys.path.append(str(repo_root))
    from AI_Simulations.common.src.cyclic_iterator import CyclicIterator

class Task(BaseModel):
    id: int
    description: str
    dependencies: List[int] = Field(default_factory=list)

class MessageBus:
    def __init__(self):
        self.messages = []

    def send(self, agent_id: str, payload: str):
        self.messages.append({"from": agent_id, "data": payload})
        print(f"[MessageBus] Agent {agent_id} sent: {payload}")

class TaskQueue:
    def __init__(self):
        self.tasks: Dict[int, Task] = {}

    def add_task(self, task: Task) -> None:
        self.tasks[task.id] = task

    def resolve_dependencies(self) -> List[Task]:
        """Resolve tasks in valid topological order or raise on cycles/missing deps."""
        indegree: Dict[int, int] = {task_id: 0 for task_id in self.tasks}
        adjacency: Dict[int, List[int]] = {task_id: [] for task_id in self.tasks}

        for task in self.tasks.values():
            for dep in task.dependencies:
                if dep not in self.tasks:
                    raise ValueError(
                        f"Task {task.id} has dependency {dep}, but dependency is missing."
                    )
                indegree[task.id] += 1
                adjacency[dep].append(task.id)

        queue: Deque[int] = deque(sorted(task_id for task_id, degree in indegree.items() if degree == 0))
        ordered_ids: List[int] = []

        while queue:
            current = queue.popleft()
            ordered_ids.append(current)
            for dependent in adjacency[current]:
                indegree[dependent] -= 1
                if indegree[dependent] == 0:
                    queue.append(dependent)

        if len(ordered_ids) != len(self.tasks):
            raise ValueError("Cyclic dependency detected in task graph.")

        return [self.tasks[task_id] for task_id in ordered_ids]

    def cyclic_execution_order(
        self,
        rounds: Optional[int] = None,
        task_ids: Optional[Iterable[int]] = None,
    ) -> Iterator[Task]:
        """
        Yield tasks in a repeating cycle.
        If task_ids are not supplied, use resolved dependency order.
        """
        if task_ids is None:
            seed_ids = [task.id for task in self.resolve_dependencies()]
        else:
            seed_ids = list(task_ids)
        for task_id in CyclicIterator(seed_ids, max_cycles=rounds):
            yield self.tasks[task_id]

if __name__ == "__main__":
    print("[Open-Multi-Agent] Coordinator, TaskQueue, and MessageBus ready.")
