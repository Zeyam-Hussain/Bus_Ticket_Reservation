from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

from features import rule_demand


def train_model(output_path=Path(__file__).parent / "model.joblib"):
    rng = np.random.default_rng(42)
    sample_count = 20_000
    load = rng.beta(2, 2, sample_count)
    hours_norm = rng.uniform(0.0, 1.0, sample_count)
    weekend = (rng.integers(0, 7, sample_count) >= 4).astype(float)
    velocity = np.clip(0.5 * load + rng.normal(0, 0.15, sample_count), 0, 1)

    features = np.column_stack([load, hours_norm, weekend, velocity])
    target = np.clip(
        rule_demand(load, hours_norm, weekend, velocity)
        + rng.normal(0, 0.04, sample_count),
        0,
        1,
    )

    x_train, x_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=42
    )
    estimator = GradientBoostingRegressor(
        n_estimators=200, max_depth=3, random_state=42
    ).fit(x_train, y_train)

    model_mae = mean_absolute_error(y_test, estimator.predict(x_test))
    baseline_mae = mean_absolute_error(y_test, np.full_like(y_test, y_train.mean()))
    if model_mae >= baseline_mae:
        raise RuntimeError(
            f"Model failed baseline: MAE {model_mae:.4f} >= {baseline_mae:.4f}"
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(estimator, output_path)
    print(
        f"Demo model MAE: {model_mae:.4f}; constant baseline MAE: {baseline_mae:.4f}. "
        "Training data is synthetic and is not evidence of real-world fare performance."
    )
    return estimator


if __name__ == "__main__":
    train_model()
