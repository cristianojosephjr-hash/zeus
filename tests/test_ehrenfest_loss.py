import pytest

torch = pytest.importorskip("torch")

from AI_Simulations.kan_ehrenfest.src.ehrenfest_loss import ehrenfest_loss


def test_ehrenfest_loss_returns_scalar_tensor():
    y_pred = torch.randn(32)
    y_target = torch.randn(32)
    commutator = torch.randn(32)
    loss = ehrenfest_loss(y_pred, y_target, commutator, lambda_penalty=1.5, dt=0.02)
    assert loss.shape == torch.Size([])


def test_ehrenfest_loss_invalid_dt_raises():
    y_pred = torch.randn(8)
    y_target = torch.randn(8)
    commutator = torch.randn(8)
    with pytest.raises(ValueError, match="dt must be positive"):
        ehrenfest_loss(y_pred, y_target, commutator, dt=0)
