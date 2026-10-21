"""
Classical Machine Learning Baseline Models
Implements Support Vector Classifier (SVC) and optional Random Forest with timing.
"""

import time
from typing import Dict, Tuple, Any
import numpy as np
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier


def train_classical_svc(
    X_train: np.ndarray,
    y_train: np.ndarray,
    C: float = 1.0,
    gamma: str = "scale",
    probability: bool = True,
    seed: int = 42,
) -> Tuple[SVC, float]:
    """
    Trains classical Support Vector Classifier with RBF kernel.
    
    Returns:
        (fitted_model, training_time_ms)
    """
    t0 = time.perf_counter()
    model = SVC(
        C=C,
        kernel="rbf",
        gamma=gamma,
        probability=probability,
        random_state=seed,
    )
    model.fit(X_train, y_train)
    t1 = time.perf_counter()
    train_time_ms = (t1 - t0) * 1000.0
    return model, train_time_ms


def train_random_forest(
    X_train: np.ndarray,
    y_train: np.ndarray,
    n_estimators: int = 50,
    seed: int = 42,
) -> Tuple[RandomForestClassifier, float]:
    """
    Trains Random Forest classifier for optional multi-model classical baseline.
    """
    t0 = time.perf_counter()
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=5,
        random_state=seed,
    )
    model.fit(X_train, y_train)
    t1 = time.perf_counter()
    return model, (t1 - t0) * 1000.0


def predict_classical(
    model: Any,
    X_test: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray, float]:
    """
    Predicts classes and probabilities with inference timing.
    
    Returns:
        (predicted_labels, probabilities, inference_time_ms)
    """
    t0 = time.perf_counter()
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
    t1 = time.perf_counter()
    inference_time_ms = (t1 - t0) * 1000.0
    return preds, probs, inference_time_ms
