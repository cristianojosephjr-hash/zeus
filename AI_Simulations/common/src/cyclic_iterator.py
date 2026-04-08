from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Iterator, List, Optional, Sequence, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class CyclicIterator(Generic[T]):
    """
    Iterate over a sequence in a loop with an optional cycle limit.
    max_cycles=None means infinite iteration.
    """

    items: Sequence[T]
    max_cycles: Optional[int] = None

    def __post_init__(self) -> None:
        if not self.items:
            raise ValueError("CyclicIterator requires at least one item.")
        if self.max_cycles is not None and self.max_cycles < 0:
            raise ValueError("max_cycles must be non-negative or None.")

    def __iter__(self) -> Iterator[T]:
        values: List[T] = list(self.items)
        total_cycles = self.max_cycles
        cycle = 0
        while total_cycles is None or cycle < total_cycles:
            for value in values:
                yield value
            cycle += 1
