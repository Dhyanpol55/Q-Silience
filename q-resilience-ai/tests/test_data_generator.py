"""
Unit tests for data generation and schema validation
"""

import pytest
import pandas as pd
from src.data_generator import generate_microgrid_dataset, validate_microgrid_dataframe, FEATURE_COLUMNS


def test_reproducible_generation():
    df1 = generate_microgrid_dataset(n_samples=50, seed=42)
    df2 = generate_microgrid_dataset(n_samples=50, seed=42)
    pd.testing.assert_frame_equal(df1, df2)


def test_schema_columns():
    df = generate_microgrid_dataset(n_samples=40, seed=123)
    for col in FEATURE_COLUMNS:
        assert col in df.columns
    assert "is_abnormal" in df.columns
    assert set(df["is_abnormal"].unique()).issubset({0, 1})


def test_validation_rejects_missing_cols():
    df = pd.DataFrame({"demand_kw": [50.0], "is_abnormal": [0]})
    is_valid, msg = validate_microgrid_dataframe(df)
    assert not is_valid
    assert "Missing required columns" in msg
