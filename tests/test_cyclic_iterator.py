import pytest

from AI_Simulations.common.src.cyclic_iterator import CyclicIterator


def test_cyclic_iterator_repeats_in_order():
    iterator = CyclicIterator(["A", "B", "C"], max_cycles=2)
    assert list(iterator) == ["A", "B", "C", "A", "B", "C"]


def test_cyclic_iterator_rejects_empty():
    with pytest.raises(ValueError):
        CyclicIterator([])
