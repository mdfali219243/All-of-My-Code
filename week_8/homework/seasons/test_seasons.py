import pytest
from seasons import calculate_minutes

def test_valid_date():
    assert "minutes" in calculate_minutes("2000-01-01")

def test_recent_date():
    assert "minutes" in calculate_minutes("2023-06-01")

def test_invalid_format():
    with pytest.raises(ValueError):
        calculate_minutes("February 6th, 1998")
