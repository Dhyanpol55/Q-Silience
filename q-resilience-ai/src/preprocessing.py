"""
Microgrid Preprocessing & Feature Scaling
Enforces train-test isolation and maps sensor features into quantum circuit encoding range [0, 2pi].
"""

from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler, StandardScaler


DEFAULT_FEATURES = ["demand_kw", "solar_kw", "voltage_dev_v", "frequency_dev_hz"]


class MicrogridPreprocessor:
    """
    Fits scaler only on training data and transforms test samples into [0, 2pi].
    """

    def __init__(self, feature_cols: List[str] = None, scaler_type: str = "minmax"):
        self.feature_cols = feature_cols or DEFAULT_FEATURES
        self.scaler_type = scaler_type
        self.scaler = MinMaxScaler(feature_range=(0.0, 2.0 * np.pi)) if scaler_type == "minmax" else StandardScaler()
        self.is_fitted = False

    def fit(self, df_train: pd.DataFrame):
        X_train_raw = df_train[self.feature_cols].values
        self.scaler.fit(X_train_raw)
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Preprocessor must be fitted on training data before transform.")
        X_raw = df[self.feature_cols].values
        return self.scaler.transform(X_raw)

    def fit_transform(self, df_train: pd.DataFrame) -> np.ndarray:
        return self.fit(df_train).transform(df_train)


def prepare_dataset_splits(
    df: pd.DataFrame,
    feature_cols: List[str] = None,
    test_size: float = 0.25,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, MicrogridPreprocessor]:
    """
    Performs stratified train/test split and fits preprocessor solely on train partition.
    
    Returns:
        X_train, X_test, y_train, y_test, preprocessor
    """
    feature_cols = feature_cols or DEFAULT_FEATURES
    train_df, test_df = train_test_split(
        df,
        test_size=test_size,
        random_state=seed,
        stratify=df["is_abnormal"],
    )

    preprocessor = MicrogridPreprocessor(feature_cols=feature_cols, scaler_type="minmax")
    X_train = preprocessor.fit_transform(train_df)
    X_test = preprocessor.transform(test_df)

    y_train = train_df["is_abnormal"].values
    y_test = test_df["is_abnormal"].values

    return X_train, X_test, y_train, y_test, preprocessor
