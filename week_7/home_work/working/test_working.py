from working import convert
import pytest

def test_basic_cases():
    assert convert("9:00 AM to 5:00 PM") == "09:00 to 17:00"
    assert convert("12:00 AM to 12:00 PM") == "00:00 to 12:00"
    assert convert("1:30 PM to 2:30 PM") == "13:30 to 14:30"

def test_edge_cases():
    assert convert("12:00 PM to 12:00 AM") == "12:00 to 00:00"
    assert convert("11:59 AM to 12:01 PM") == "11:59 to 12:01"
    assert convert("9 AM to 5 PM") == "09:00 to 17:00"
    assert convert("10 AM to 8:50 PM") == "10:00 to 20:50"
    assert convert("10:30 PM to 8 AM") == "22:30 to 08:00"

def test_invalid_format():
    with pytest.raises(ValueError):
        convert("9:00 AM to 5:60 PM")
    with pytest.raises(ValueError):
        convert("9 AM - 5 PM")
    with pytest.raises(ValueError):
        convert("09:00 AM - 17:00 PM")
    with pytest.raises(ValueError):
        convert("13:00 AM to 5:00 PM")
    with pytest.raises(ValueError):
        convert("0:00 AM to 5:00 PM")
