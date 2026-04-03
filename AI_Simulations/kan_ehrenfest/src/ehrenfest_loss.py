import torch

def ehrenfest_loss(Y_pred, Y_target, H_commutator_target, lambda_penalty=1.0):
    """
    Computes standard MSE plus the physics-informed Ehrenfest penalty.
    d<Y_x>/dt = i<[H, Y_x]>
    """
    # 1. Standard Mean Squared Error against target sequence
    mse_loss = torch.mean((Y_pred - Y_target)**2)

    # 2. Ehrenfest penalty: derivative of prediction must match physical expectation
    dt_Y_pred = torch.gradient(Y_pred, spacing=(0.01,))[0]
    physics_penalty = torch.mean((dt_Y_pred - H_commutator_target)**2)

    return mse_loss + (lambda_penalty * physics_penalty)

if __name__ == "__main__":
    print("[KAN Simulation] Ehrenfest constraints initialized.")
