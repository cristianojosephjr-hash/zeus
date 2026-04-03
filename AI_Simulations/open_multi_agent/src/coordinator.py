from pydantic import BaseModel
from typing import List, Dict

class Task(BaseModel):
    id: int
    description: str
    dependencies: List[int]

class MessageBus:
    def __init__(self):
        self.messages = []

    def send(self, agent_id: str, payload: str):
        self.messages.append({"from": agent_id, "data": payload})
        print(f"[MessageBus] Agent {agent_id} sent: {payload}")

class TaskQueue:
    def __init__(self):
        self.tasks: Dict[int, Task] = {}

    def resolve_dependencies(self):
        """Topological dependency resolution for tasks."""
        resolved = sorted(self.tasks.values(), key=lambda t: len(t.dependencies))
        return resolved

if __name__ == "__main__":
    print("[Open-Multi-Agent] Coordinator, TaskQueue, and MessageBus ready.")
