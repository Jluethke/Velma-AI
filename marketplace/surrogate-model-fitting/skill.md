# Surrogate Model Fitting

Fit the surrogate from the sampled data, choosing among polynomial response surface, Gaussian-process kriging, and radial basis functions by the smoothness and dimension of the response.

## Inputs

- `sampling-plan`: The input points whose expensive outputs are now available
- `simulation-outputs`: The evaluated responses at the sampled points

## Outputs

- `fitted-surrogate`: The trained surrogate model with its hyperparameters
- `model-class-choice`: Which surrogate family was used and why it fits the response character

## Process

1. Use a low-order polynomial response surface for smooth, mildly curved responses. A quadratic model y_hat = b0 + sum b_i*x_i + sum b_ij*x_i*x_j fit by least squares is cheap, interpretable, and smooth, but it cannot capture multimodal or sharply varying responses and extrapolates poorly.
2. Use Gaussian-process kriging for a general nonlinear response that also needs an uncertainty estimate. The kriging predictor is y_hat(x) = mu + r(x)^T*R^(-1)*(y - 1*mu), where R is the correlation matrix of training points with entries R_ij = exp(-sum theta_k*(x_i,k - x_j,k)^2) and r(x) is the correlation of x to the training points. It interpolates the data exactly and returns a prediction variance s^2(x) that drives adaptive sampling.
3. Fit the kriging hyperparameters by maximum likelihood. Estimate the length-scale parameters theta_k and the process variance by maximizing the likelihood of the observed data; small theta_k means the response varies slowly in that direction, large theta_k means it varies fast, so the fitted theta also ranks input sensitivity.
4. Use radial basis functions for scattered data in moderate dimension. The model y_hat(x) = sum w_i*phi(||x - x_i||) with a multiquadric phi(r) = sqrt(r^2 + c^2) or Gaussian phi(r) = exp(-(r/c)^2) solves a linear system for the weights w_i and handles irregular point layouts well; the shape parameter c trades smoothness against conditioning.
5. Guard the conditioning of the fit. Kriging and radial basis systems become ill-conditioned when sample points are very close or the correlation length is large; add a small regularization (a nugget term on the diagonal) to stabilize the solve, accepting that it turns exact interpolation into smoothing, which is usually the right trade when the simulation itself has numerical noise.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
