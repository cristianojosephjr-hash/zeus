try:
    import torch
except ImportError:  # pragma: no cover - exercised in runtime environments only
    torch = None

def ehrenfest_loss(
    Y_pred,
    Y_target,
    H_commutator_target,
    lambda_penalty=1.0,
    dt=0.01,
    gradient_dim=-1,
):
    """
    Computes standard MSE plus the physics-informed Ehrenfest penalty.
    d<Y_x>/dt = i<[H, Y_x]>
    """
    if torch is None:
        raise ImportError("torch is required to compute ehrenfest_loss.")
    if dt <= 0:
        raise ValueError("dt must be positive.")
    if Y_pred.shape != Y_target.shape:
        raise ValueError("Y_pred and Y_target must have the same shape.")
    if Y_pred.shape != H_commutator_target.shape:
        raise ValueError("Y_pred and H_commutator_target must have the same shape.")

    # 1. Standard Mean Squared Error against target sequence
    mse_loss = torch.mean((Y_pred - Y_target)**2)

    # 2. Ehrenfest penalty: derivative of prediction must match physical expectation
    dt_Y_pred = torch.gradient(Y_pred, spacing=(dt,), dim=gradient_dim)[0]
    physics_penalty = torch.mean((dt_Y_pred - H_commutator_target)**2)

    return mse_loss + (lambda_penalty * physics_penalty)

if __name__ == "__main__":
    if torch is None:
        print("[KAN Simulation] torch is not installed. Install optional dependency `cpu` to run this module.")
    else:
        print("[KAN Simulation] Ehrenfest constraints initialized.")
